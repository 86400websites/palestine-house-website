-- 0026_verify_PROD_safe_readonly.sql
-- Production-safe verification for migration 0026 (Focus Area K widening) and
-- the Food content ingest. READ-ONLY: plain selects, no role switching, no
-- writes. Run Section A immediately after applying 0026_focus_area_k.up.sql;
-- run Section B after the Food ingest
-- (`pnpm tsx scripts/ingest-content.ts --pack food --i-understand-not-test`).

-- ===========================================================================
-- SECTION A — after 0026, before the Food ingest.
-- ===========================================================================

-- A1) Constraint shapes widened.
select
  c.conname,
  pg_get_constraintdef(c.oid) as definition,
  pg_get_constraintdef(c.oid) ~ '\[a-k\]\[1-3\]|\[A-K\]' as widened
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and c.conname in
    ('elements_slug_shape', 'elements_focus_area_shape', 'resources_focus_area_shape')
order by c.conname;
-- EXPECT: three rows, widened = true for every row.

-- A2) Admin RPC bodies carry the widened regexes; old forms gone.
select
  p.proname,
  p.prosrc like '%^[a-k][1-3]$%' or p.proname = 'admin_update_resource'
    as new_slug_regex,
  p.prosrc like '%^[A-K]$%'      as new_area_regex,
  p.prosrc not like '%^[a-j][1-3]$%' and p.prosrc not like '%^[A-J]$%'
    as old_regexes_gone
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_upsert_element', 'admin_update_resource')
order by p.proname;
-- EXPECT: two rows; all three booleans true on each.

-- A3) EXECUTE privileges preserved: anon denied, authenticated granted.
select
  has_function_privilege('anon',
    'public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer)',
    'execute') as upsert_anon,
  has_function_privilege('authenticated',
    'public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer)',
    'execute') as upsert_authenticated,
  has_function_privilege('anon',
    'public.admin_update_resource(uuid, text, text, text, uuid, text, integer)',
    'execute') as update_res_anon,
  has_function_privilege('authenticated',
    'public.admin_update_resource(uuid, text, text, text, uuid, text, integer)',
    'execute') as update_res_authenticated;
-- EXPECT: anon = false and authenticated = true for both functions.

-- A4) No data changed by the migration itself.
select
  (select count(*) from public.elements)        as elements,
  (select count(*) from public.checklist_items) as checklist_items,
  (select count(*) from public.academy_modules) as academy_modules,
  (select count(*) from public.resources)       as resources;
-- EXPECT (before the Food ingest): 30 / 728 / 30 / 269.

-- ===========================================================================
-- SECTION B — after the Food ingest.
-- ===========================================================================

-- B1) Totals grew by exactly the Food pack: +3 / +90 / +3 / +30.
select
  (select count(*) from public.elements)        as elements,
  (select count(*) from public.checklist_items) as checklist_items,
  (select count(*) from public.academy_modules) as academy_modules,
  (select count(*) from public.resources)       as resources;
-- EXPECT: 33 / 818 / 33 / 299.

-- B2) The three K elements are complete (bodies + one_line present).
select
  e.slug, e.code, e.focus_area_code, e.focus_area_name, e.title,
  e.one_line is not null         as has_one_line,
  e.overview_md is not null      as has_overview,
  e.simple_guide_md is not null  as has_simple_guide,
  e.watch_out_for_md is not null as has_watch_out_for
from public.elements e
where e.focus_area_code = 'K'
order by e.slug;
-- EXPECT: exactly k1 / k2 / k3, codes K1..K3,
--         focus_area_name = 'Café & Culinary Experience',
--         every boolean = true.

-- B3) 30 checklist items per K element, all with a group label.
select e.slug,
       count(*)                                   as items,
       count(*) filter (where ci.group_label is not null
                          and btrim(ci.group_label) <> '') as items_with_group
from public.checklist_items ci
join public.elements e on e.id = ci.element_id
where e.focus_area_code = 'K'
group by e.slug
order by e.slug;
-- EXPECT: three rows; items = 30 and items_with_group = 30 on each.

-- B4) Academy modules for K: Simple-Guide body present, no video URL yet
--     (the Videos tab falls back to the marked Sample clip).
select e.slug,
       am.body_md is not null as has_body,
       am.youtube_url is null as youtube_null
from public.academy_modules am
join public.elements e on e.id = am.element_id
where e.focus_area_code = 'K'
order by e.slug;
-- EXPECT: three rows; has_body = true, youtube_null = true on each.

-- B5) 10 private templates per K element in the "resources" bucket under
--     the k1/ k2/ k3 path prefixes; none public.
select e.slug,
       count(*)                                          as templates,
       count(*) filter (where r.storage_bucket = 'resources') as in_private_bucket,
       count(*) filter (where r.is_public = false)            as private_rows,
       count(*) filter (where r.storage_path like e.slug || '/%') as under_slug_prefix
from public.resources r
join public.elements e on e.id = r.element_id
where r.focus_area_code = 'K'
group by e.slug
order by e.slug;
-- EXPECT: three rows; every column = 10.

-- B6) The 30 template files exist as Storage objects in the private bucket.
select count(*) as k_storage_objects
from storage.objects o
where o.bucket_id = 'resources'
  and (o.name like 'k1/%' or o.name like 'k2/%' or o.name like 'k3/%');
-- EXPECT: 30.
