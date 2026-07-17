-- 0026_focus_area_k.up.sql
-- Sprint FA11 (Food): widen the locked content shape A-J -> A-K so the 11th
-- focus area "Café & Culinary Experience" (elements k1-k3) can exist.
--
-- No data changes: every existing A-J row trivially satisfies the widened
-- checks (drop + re-add validates all rows). Postgres cannot ALTER a CHECK
-- expression, hence drop + re-add under the same constraint names.
--
-- Backwards-compatible with deployed app code: nothing reads the constraint
-- shapes, the read RPCs have no shape guards, and K rows only appear after the
-- separate Food ingest (`scripts/ingest-content.ts --pack food`).
--
-- Also redefines the two S11 admin RPCs whose bodies hardcode the A-J regexes
-- (admin_upsert_element, admin_update_resource). Both are copied VERBATIM from
-- 0023_admin_content_rpcs.up.sql with only the two shape regexes widened; the
-- revoke-then-grant hardening is restated exactly as 0023 ships it.

-- ---------------------------------------------------------------------------
-- 1) elements: slug a1..j3 -> a1..k3; focus area A-J -> A-K.
-- ---------------------------------------------------------------------------
alter table public.elements
  drop constraint elements_slug_shape,
  add  constraint elements_slug_shape check (slug ~ '^[a-k][1-3]$');

alter table public.elements
  drop constraint elements_focus_area_shape,
  add  constraint elements_focus_area_shape check (focus_area_code ~ '^[A-K]$');

-- ---------------------------------------------------------------------------
-- 2) resources: focus area A-J -> A-K (still nullable).
-- ---------------------------------------------------------------------------
alter table public.resources
  drop constraint resources_focus_area_shape,
  add  constraint resources_focus_area_shape
       check (focus_area_code is null or focus_area_code ~ '^[A-K]$');

-- ---------------------------------------------------------------------------
-- 3) admin_upsert_element: verbatim from 0023 except the two widened regexes
--    and the count in the header comment (30 -> 33 topics).
-- ---------------------------------------------------------------------------
-- Upsert on the natural key (slug). In practice always an UPDATE: the slug shape
-- constraint allows only [a-k][1-3] (the 33 existing topics), so no 34th row can
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
revoke execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) from public, anon;
grant execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) admin_update_resource: verbatim from 0023 except the widened regex.
-- ---------------------------------------------------------------------------
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
  if v_fac is not null and v_fac !~ '^[A-K]$' then
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
