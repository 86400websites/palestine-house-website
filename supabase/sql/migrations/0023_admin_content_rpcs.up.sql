-- 0023_admin_content_rpcs.up.sql
-- S11 (11-3): the HQ content-management read/write RPCs behind /admin/content.
--
-- Gives admins CRUD over the gated content tables (elements, academy_modules,
-- resources) WITHOUT loosening their RLS — those tables stay default-deny with
-- NO client policy (0011/0014/0015). HQ reaches them ONLY through these
-- is_admin()-gated SECURITY DEFINER functions, hardened exactly like 0009
-- (admin_set_application_status) and 0020 (publish_programming_session):
--   * language sql/plpgsql, security definer, search_path = '' with
--     fully-qualified objects;
--   * authorization decided from public.is_admin() INSIDE the function
--     (arguments never grant access): list/get gate via WHERE public.is_admin()
--     (a non-admin gets zero rows, no leak); write/delete raise 42501;
--   * narrow returns — the list/get RPCs NEVER return raw storage paths
--     (resources) or any PII; admin reads stay metadata + content bodies only;
--   * length-capped writes via left(); blank text normalised to NULL;
--   * EXECUTE revoked from public + anon then granted to authenticated only.
--
-- The public/approved read projections (get_elements / get_element /
-- get_academy_modules / get_resources / get_resource_download) are UNTOUCHED and
-- keep returning correct rows after an admin write. Upserts are idempotent on
-- the natural keys (elements.slug, academy_modules.element_id) so a re-run never
-- changes ids; resource edits update by id IN PLACE (no new row, no id churn).
--
-- Resources are file-backed (the 267 templates in the private bucket + 2 public
-- booklets). S11 ships NO file upload (D-S11-c), so a resource cannot be created
-- from the UI — hence admin_update_resource (by id, metadata only) instead of an
-- upsert, and is_public / storage_bucket / storage_path are NEVER editable here
-- (is_public is bound to which bucket holds the file). admin_get_resource /
-- admin_list_resources omit the storage path entirely (no leak).
--
-- CAUTION (confirmed intended at the S11 gate): admin_delete_element deletes the
-- element row, which FK-cascades to its 1:1 academy_modules row (0015,
-- element_id ... on delete cascade). The S11 admin UI is EDIT-ONLY for
-- elements / academy / resources (no delete button); these delete RPCs ship for
-- DB-layer completeness + re-ingest parity, not wired to UI buttons.

-- =====================================================================
-- ELEMENTS
-- =====================================================================

-- List: metadata + which bodies are filled (no full bodies), admins only.
create or replace function public.admin_list_elements()
returns table (
  id                uuid,
  slug              text,
  code              text,
  focus_area_code   text,
  focus_area_name   text,
  title             text,
  one_line          text,
  sort_order        integer,
  has_overview      boolean,
  has_simple_guide  boolean,
  has_watch_out_for boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.sort_order,
         (e.overview_md      is not null and btrim(e.overview_md)      <> ''),
         (e.simple_guide_md  is not null and btrim(e.simple_guide_md)  <> ''),
         (e.watch_out_for_md is not null and btrim(e.watch_out_for_md) <> '')
  from public.elements e
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, e.code;
$$;
revoke execute on function public.admin_list_elements() from public, anon;
grant execute on function public.admin_list_elements() to authenticated;

-- Get one element with full tab bodies for editing, admins only.
create or replace function public.admin_get_element(p_slug text)
returns table (
  id               uuid,
  slug             text,
  code             text,
  focus_area_code  text,
  focus_area_name  text,
  title            text,
  one_line         text,
  overview_md      text,
  simple_guide_md  text,
  watch_out_for_md text,
  sort_order       integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.overview_md, e.simple_guide_md,
         e.watch_out_for_md, e.sort_order
  from public.elements e
  where e.slug = p_slug
    and public.is_admin();
$$;
revoke execute on function public.admin_get_element(text) from public, anon;
grant execute on function public.admin_get_element(text) to authenticated;

-- Upsert on the natural key (slug). In practice always an UPDATE: the slug shape
-- constraint allows only [a-j][1-3] (the 30 existing topics), so no 31st row can
-- be created. Blank long-form bodies normalise to NULL (the empty-state render).
create or replace function public.admin_upsert_element(
  p_slug             text,
  p_code             text,
  p_focus_area_code  text,
  p_focus_area_name  text,
  p_title            text,
  p_one_line         text default null,
  p_overview_md      text default null,
  p_simple_guide_md  text default null,
  p_watch_out_for_md text default null,
  p_sort_order       integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_code  text := nullif(btrim(coalesce(p_code, '')), '');
  v_fac   text := upper(btrim(coalesce(p_focus_area_code, '')));
  v_fan   text := nullif(btrim(coalesce(p_focus_area_name, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_slug !~ '^[a-j][1-3]$' then
    raise exception 'invalid slug' using errcode = '22023';
  end if;
  if v_fac !~ '^[A-J]$' then
    raise exception 'invalid focus area' using errcode = '22023';
  end if;
  if v_code is null or v_fan is null or v_title is null then
    raise exception 'code, focus area name and title are required' using errcode = '22023';
  end if;

  insert into public.elements
    (slug, code, focus_area_code, focus_area_name, title, one_line,
     overview_md, simple_guide_md, watch_out_for_md, sort_order)
  values
    (v_slug, left(v_code, 16), v_fac, left(v_fan, 120), left(v_title, 200),
     nullif(btrim(coalesce(p_one_line, '')), ''),
     (case when btrim(coalesce(p_overview_md, '')) = '' then null else left(p_overview_md, 100000) end),
     (case when btrim(coalesce(p_simple_guide_md, '')) = '' then null else left(p_simple_guide_md, 100000) end),
     (case when btrim(coalesce(p_watch_out_for_md, '')) = '' then null else left(p_watch_out_for_md, 100000) end),
     coalesce(p_sort_order, 0))
  on conflict (slug) do update
    set code             = excluded.code,
        focus_area_code  = excluded.focus_area_code,
        focus_area_name  = excluded.focus_area_name,
        title            = excluded.title,
        one_line         = excluded.one_line,
        overview_md      = excluded.overview_md,
        simple_guide_md  = excluded.simple_guide_md,
        watch_out_for_md = excluded.watch_out_for_md,
        sort_order       = excluded.sort_order,
        updated_at       = now()
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) from public, anon;
grant execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) to authenticated;

-- Delete by slug (FK-cascades the 1:1 academy_modules row). A missing slug is a
-- neutral no-op (returns false). Not wired to a UI button in S11 (edit-only).
create or replace function public.admin_delete_element(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.elements where slug = lower(btrim(coalesce(p_slug, '')));
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;
revoke execute on function public.admin_delete_element(text) from public, anon;
grant execute on function public.admin_delete_element(text) to authenticated;

-- =====================================================================
-- ACADEMY MODULES (1:1 with an element; youtube_url + body_md script)
-- =====================================================================

create or replace function public.admin_list_academy_modules()
returns table (
  id            uuid,
  element_id    uuid,
  element_slug  text,
  element_code  text,
  element_title text,
  title         text,
  one_line      text,
  length        text,
  youtube_url   text,
  has_body      boolean,
  sort_order    integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select am.id, am.element_id, e.slug, e.code, e.title,
         am.title, am.one_line, am.length, am.youtube_url,
         (am.body_md is not null and btrim(am.body_md) <> ''),
         am.sort_order
  from public.academy_modules am
  join public.elements e on e.id = am.element_id
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, am.sort_order;
$$;
revoke execute on function public.admin_list_academy_modules() from public, anon;
grant execute on function public.admin_list_academy_modules() to authenticated;

create or replace function public.admin_get_academy_module(p_element_id uuid)
returns table (
  id            uuid,
  element_id    uuid,
  element_slug  text,
  element_code  text,
  element_title text,
  title         text,
  one_line      text,
  length        text,
  youtube_url   text,
  body_md       text,
  sort_order    integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select am.id, am.element_id, e.slug, e.code, e.title,
         am.title, am.one_line, am.length, am.youtube_url, am.body_md, am.sort_order
  from public.academy_modules am
  join public.elements e on e.id = am.element_id
  where am.element_id = p_element_id
    and public.is_admin();
$$;
revoke execute on function public.admin_get_academy_module(uuid) from public, anon;
grant execute on function public.admin_get_academy_module(uuid) to authenticated;

-- Upsert on the natural key (element_id, UNIQUE 1:1). youtube_url is host-guarded
-- in-function (defence in depth — the Server Action also validates via
-- parseYouTubeId) so a direct PostgREST call can't store a non-YouTube link.
create or replace function public.admin_upsert_academy_module(
  p_element_id  uuid,
  p_title       text,
  p_one_line    text default null,
  p_length      text default null,
  p_youtube_url text default null,
  p_body_md     text default null,
  p_sort_order  integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_url   text := nullif(btrim(coalesce(p_youtube_url, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_element_id is null then
    raise exception 'element is required' using errcode = '22023';
  end if;
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.elements e where e.id = p_element_id) then
    raise exception 'element not found' using errcode = 'P0002';
  end if;
  if v_url is not null
     and v_url !~* '^https?://([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)(/|$)' then
    raise exception 'invalid video link' using errcode = '22023';
  end if;

  insert into public.academy_modules
    (element_id, title, one_line, length, youtube_url, body_md, sort_order)
  values
    (p_element_id, left(v_title, 200),
     nullif(btrim(coalesce(p_one_line, '')), ''),
     nullif(btrim(coalesce(p_length, '')), ''),
     left(v_url, 500),
     (case when btrim(coalesce(p_body_md, '')) = '' then null else left(p_body_md, 100000) end),
     coalesce(p_sort_order, 0))
  on conflict (element_id) do update
    set title       = excluded.title,
        one_line    = excluded.one_line,
        length      = excluded.length,
        youtube_url = excluded.youtube_url,
        body_md     = excluded.body_md,
        sort_order  = excluded.sort_order
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer) from public, anon;
grant execute on function public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer) to authenticated;

create or replace function public.admin_delete_academy_module(p_element_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.academy_modules where element_id = p_element_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;
revoke execute on function public.admin_delete_academy_module(uuid) from public, anon;
grant execute on function public.admin_delete_academy_module(uuid) to authenticated;

-- =====================================================================
-- RESOURCES (metadata-only edit; storage paths never returned or changed)
-- =====================================================================

create or replace function public.admin_list_resources()
returns table (
  id              uuid,
  title           text,
  type            text,
  focus_area_code text,
  element_id      uuid,
  element_code    text,
  element_title   text,
  version         text,
  is_public       boolean,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.title, r.type, r.focus_area_code, r.element_id,
         e.code, e.title, r.version, r.is_public, r.sort_order
  from public.resources r
  left join public.elements e on e.id = r.element_id
  where public.is_admin()
  order by r.focus_area_code nulls last, r.sort_order, r.title;
$$;
revoke execute on function public.admin_list_resources() from public, anon;
grant execute on function public.admin_list_resources() to authenticated;

create or replace function public.admin_get_resource(p_id uuid)
returns table (
  id              uuid,
  title           text,
  type            text,
  focus_area_code text,
  element_id      uuid,
  version         text,
  is_public       boolean,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.title, r.type, r.focus_area_code, r.element_id,
         r.version, r.is_public, r.sort_order
  from public.resources r
  where r.id = p_id
    and public.is_admin();
$$;
revoke execute on function public.admin_get_resource(uuid) from public, anon;
grant execute on function public.admin_get_resource(uuid) to authenticated;

-- Update resource METADATA by id (never storage_bucket / storage_path /
-- is_public — those are bound to the file and out of S11 scope). A missing id
-- raises P0002.
create or replace function public.admin_update_resource(
  p_id              uuid,
  p_title           text,
  p_type            text,
  p_focus_area_code text default null,
  p_element_id      uuid default null,
  p_version         text default null,
  p_sort_order      integer default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_type  text := lower(btrim(coalesce(p_type, '')));
  v_fac   text := nullif(upper(btrim(coalesce(p_focus_area_code, ''))), '');
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;
  if v_type not in ('form','script','log','report','approval','guide','booklet') then
    raise exception 'invalid type' using errcode = '22023';
  end if;
  if v_fac is not null and v_fac !~ '^[A-J]$' then
    raise exception 'invalid focus area' using errcode = '22023';
  end if;
  if p_element_id is not null
     and not exists (select 1 from public.elements e where e.id = p_element_id) then
    raise exception 'element not found' using errcode = 'P0002';
  end if;

  update public.resources r
     set title           = left(v_title, 300),
         type            = v_type,
         focus_area_code = v_fac,
         element_id      = p_element_id,
         version         = coalesce(nullif(btrim(coalesce(p_version, '')), ''), 'v1'),
         sort_order      = coalesce(p_sort_order, r.sort_order)
   where r.id = p_id;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'resource not found' using errcode = 'P0002';
  end if;
  return true;
end;
$$;
revoke execute on function public.admin_update_resource(uuid, text, text, text, uuid, text, integer) from public, anon;
grant execute on function public.admin_update_resource(uuid, text, text, text, uuid, text, integer) to authenticated;

-- Delete the resource metadata row by id (leaves the storage object in place —
-- file lifecycle is the re-ingest path). Missing id is a neutral no-op. Not
-- wired to a UI button in S11 (edit-only).
create or replace function public.admin_delete_resource(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.resources where id = p_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;
revoke execute on function public.admin_delete_resource(uuid) from public, anon;
grant execute on function public.admin_delete_resource(uuid) to authenticated;
