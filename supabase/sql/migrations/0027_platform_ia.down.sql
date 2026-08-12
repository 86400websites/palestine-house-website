-- 0027_platform_ia.down.sql
-- Reverts the PP1 platform IA layer. Destructive ONLY for the new presentation
-- tables (platform_*) and the two additive resources columns — elements,
-- checklist_items, resources rows, storage objects and every pre-0027 RPC are
-- untouched. Restores the 0014 get_resources() signature.

begin;

-- get_platform_extras / platform_extras exist only where the pre-correction
-- (pre-D-PP-c, 2026-08-11) 0027 was applied (TEST) — defensive drops, no-ops
-- on any post-correction database.
drop function if exists public.get_platform_extras();
drop function if exists public.get_platform_topics();
drop function if exists public.get_platform_sections();

drop table if exists public.platform_extras;
drop table if exists public.platform_topics;
drop table if exists public.platform_groups;
drop table if exists public.platform_sections;

drop index if exists public.resources_element_doc_key_ux;
alter table public.resources drop constraint if exists resources_doc_key_shape;
alter table public.resources drop column if exists doc_key;
alter table public.resources drop column if exists code;

-- Restore the 0014 signature (drop first — return type change).
drop function if exists public.get_resources();

create function public.get_resources()
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
  where public.is_approved()
  order by r.focus_area_code nulls last, r.sort_order, r.title;
$$;

revoke execute on function public.get_resources() from public, anon;
grant execute on function public.get_resources() to authenticated;

commit;
