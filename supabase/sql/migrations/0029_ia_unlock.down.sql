-- 0029_ia_unlock.down.sql
--
-- *** READ BEFORE RUNNING ***
--
-- This file is SAFE ONLY WHILE EVERY elements.slug STILL MATCHES '^[a-k][1-3]$'
-- and every elements.focus_area_code is a non-null 'A'..'K'. In practice that
-- means: only BEFORE PP6b has loaded any real content.
--
-- Why: restoring the old constraints re-validates existing rows. From PP6b
-- onward the non-conforming rows ARE THE OWNER'S REAL FINAL CONTENT — the 22
-- focus areas delivered on 2026-08-14 — and there is no A–K coordinate left to
-- give them, because all 33 old slots are occupied.
--
-- This file therefore ABORTS rather than deletes. That is a deliberate
-- departure from 0026_focus_area_k.down.sql, which deletes its K content first:
-- there the rows were a re-ingestable content pack; here they are the platform.
-- If you genuinely need to reverse 0029 after PP6b, reverse the CONTENT
-- migration (0030) first, then run this. Per WORKFLOW.md §14 a forward fix is
-- preferred to a rollback in every other case.
--
-- Reversibility is proven on TEST during PP6a, BEFORE PP6b runs, because after
-- PP6b the proof is no longer repeatable.
--
-- What it restores: the 0011/0026 constraint shapes and NOT NULLs, the 0027
-- bodies of the four member read RPCs, the 0026 body of admin_upsert_element,
-- and the get_elements() function. What it removes: the published columns and
-- their indexes.

begin;

-- ---------------------------------------------------------------------------
-- 0) Refuse rather than destroy.
-- ---------------------------------------------------------------------------
do $guard$
declare
  v_bad_slug integer;
  v_bad_fac  integer;
begin
  select count(*) into v_bad_slug
  from public.elements where slug !~ '^[a-k][1-3]$';

  select count(*) into v_bad_fac
  from public.elements
  where focus_area_code is null or focus_area_code !~ '^[A-K]$';

  if v_bad_slug > 0 or v_bad_fac > 0 then
    raise exception
      'refusing to reverse 0029: % element row(s) have post-0029 slugs and % have no A-K focus area. These are real content. Reverse 0030 (the content migration) first, or fix forward.',
      v_bad_slug, v_bad_fac
      using errcode = '23514';
  end if;
end;
$guard$;

-- ---------------------------------------------------------------------------
-- 1) Draft/Live goes. DROP COLUMN never fails on data, but it must happen
--    BEFORE the RPCs are restored, so no restored function ever references a
--    column mid-transaction.
-- ---------------------------------------------------------------------------
drop index if exists public.platform_topics_published_ix;
drop index if exists public.platform_groups_published_ix;

alter table public.platform_topics drop column if exists published;
alter table public.platform_groups drop column if exists published;

-- ---------------------------------------------------------------------------
-- 2) Restore the 0027 member read RPCs verbatim (signatures unchanged).
-- ---------------------------------------------------------------------------

create or replace function public.get_platform_topics()
returns table (
  id             uuid,
  element_id     uuid,
  element_slug   text,
  element_code   text,
  section_slug   text,
  group_id       uuid,
  group_slug     text,
  group_name     text,
  group_desc     text,
  group_sort     integer,
  slug           text,
  title          text,
  description    text,
  intro          text,
  icon           text,
  image_path     text,
  image_position text,
  youtube_url    text,
  sort_order     integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select t.id, t.element_id, e.slug, e.code,
         g.section_slug, g.id, g.slug, g.name, g.description, g.sort_order,
         t.slug, t.title, t.description, t.intro, t.icon,
         t.image_path, t.image_position, t.youtube_url, t.sort_order
  from public.platform_topics t
  join public.platform_groups g on g.id = t.group_id
  join public.elements e on e.id = t.element_id
  where public.is_approved()
  order by g.section_slug, g.sort_order, t.sort_order, t.slug;
$$;

revoke execute on function public.get_platform_topics() from public, anon;
grant execute on function public.get_platform_topics() to authenticated;

create or replace function public.get_element(p_slug text)
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
    and public.is_approved();
$$;

revoke execute on function public.get_element(text) from public, anon;
grant execute on function public.get_element(text) to authenticated;

create or replace function public.get_resources()
returns table (
  id              uuid,
  title           text,
  type            text,
  focus_area_code text,
  element_id      uuid,
  version         text,
  is_public       boolean,
  sort_order      integer,
  code            text,
  doc_key         text
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.title, r.type, r.focus_area_code, r.element_id,
         r.version, r.is_public, r.sort_order, r.code, r.doc_key
  from public.resources r
  where public.is_approved()
  order by r.focus_area_code nulls last, r.sort_order, r.title;
$$;

revoke execute on function public.get_resources() from public, anon;
grant execute on function public.get_resources() to authenticated;

create or replace function public.get_resource_download(p_id uuid)
returns table (
  storage_bucket text,
  storage_path   text,
  is_public      boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.storage_bucket, r.storage_path, r.is_public
  from public.resources r
  where r.id = p_id and public.is_approved();
$$;

revoke execute on function public.get_resource_download(uuid) from public, anon;
grant execute on function public.get_resource_download(uuid) to authenticated;

-- Restore the caller-less element list that 0029 dropped.
create or replace function public.get_elements()
returns table (
  id              uuid,
  slug            text,
  code            text,
  focus_area_code text,
  focus_area_name text,
  title           text,
  one_line        text,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.sort_order
  from public.elements e
  where public.is_approved()
  order by e.focus_area_code, e.sort_order, e.code;
$$;

revoke execute on function public.get_elements() from public, anon;
grant execute on function public.get_elements() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Restore the 0026 admin_upsert_element body (narrow guards, required
--    focus area + focus area name).
-- ---------------------------------------------------------------------------
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
  if v_slug !~ '^[a-k][1-3]$' then
    raise exception 'invalid slug' using errcode = '22023';
  end if;
  if v_fac !~ '^[A-K]$' then
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

revoke execute on function public.admin_upsert_element(
  text, text, text, text, text, text, text, text, text, integer) from public, anon;
grant execute on function public.admin_upsert_element(
  text, text, text, text, text, text, text, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Restore the narrow constraints LAST — the guard at the top has already
--    proven every row still satisfies them.
-- ---------------------------------------------------------------------------
alter table public.elements alter column focus_area_name set not null;
alter table public.elements alter column focus_area_code set not null;

alter table public.elements drop constraint if exists elements_focus_area_shape;
alter table public.elements add constraint elements_focus_area_shape
  check (focus_area_code ~ '^[A-K]$');

alter table public.elements drop constraint if exists elements_slug_shape;
alter table public.elements add constraint elements_slug_shape
  check (slug ~ '^[a-k][1-3]$');

commit;
