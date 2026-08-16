-- 0033_contraction.up.sql
-- PP7 step 7-k · 2026-08-16
--
-- THE CONTRACTION. Removes the retired surfaces' last remains from the schema:
-- three empty tables, seven dead RPCs, four policies on an unreachable table,
-- and two columns on `elements` that no surface renders.
--
-- Moved here from PP8 by the owner (2026-08-16). It is hygiene on things that
-- are already dead: `0030` emptied all three tables, `0029` already dropped
-- their read RPCs, and the ROADMAP has recorded the surfaces as retired since
-- PP5. Nothing a partner can perceive changes.
--
-- ===========================================================================
-- ⚠️⚠️  READ THIS FIRST: 0033 IS THE POINT OF NO RETURN FOR 0030's ROLLBACK
-- ===========================================================================
-- `0030_content_v2_cutover.down.sql` restores the legacy platform, and each of
-- its 33 element inserts names `overview_md` and `watch_out_for_md` by column.
-- Once this migration drops those columns, **that file will no longer run**.
--
-- Measured 2026-08-16:
--   PRODUCTION  33 elements, all 33 carrying BOTH columns —
--               272,158 chars of overview + 674,982 of watch-out = 947,140
--               characters of the owner's prose.
--   TEST        22 elements (post-0030), 0 carrying either. Nothing to lose.
--
-- So the order on production is load-bearing, and it is not a matter of taste:
--
--     0030  ->  delete-297-objects  ->  verify  ->  LIVE FOR A WHILE  ->  0033
--
-- Do not apply this until the new platform has been live long enough that
-- rolling `0030` back is no longer a plan you would consider. The guard below
-- refuses if the legacy platform is still present, and refuses again if ANY
-- element still holds content in either column — so it cannot destroy the
-- owner's prose by being run early or out of order. But it cannot protect you
-- from applying it deliberately and changing your mind next week.
--
-- ---------------------------------------------------------------------------
-- WHY THE FUNCTIONS ARE DROPPED AND RECREATED RATHER THAN REPLACED
-- ---------------------------------------------------------------------------
-- The plan said `CREATE OR REPLACE` the element RPCs without the columns before
-- the `DROP COLUMN`. That would fail: PostgreSQL refuses to change the OUT
-- parameters of an existing function ("cannot change return type of existing
-- function"), and `admin_upsert_element` additionally changes arity, which
-- creates an overload rather than replacing anything. So each is DROPped and
-- recreated. Inside this transaction there is no window in which a caller sees
-- a missing function.
--
-- Checked before writing: no application code calls `admin_upsert_element` or
-- `admin_list_elements`; `admin_get_element` is called by
-- /admin/content/focus-areas and reads only `simple_guide_md`; `get_element` is
-- called by the guide reader and reads only `simple_guide_md` and `title`.
-- `scripts/generate-0030-down.ts` calls `admin_list_elements` and reads only
-- id/slug/code. Dropping the two columns from these four signatures therefore
-- breaks nothing.

begin;

-- ---------------------------------------------------------------------------
-- GUARD. Two independent refusals, either of which stops the whole migration.
-- ---------------------------------------------------------------------------
do $guard$
declare
  n_legacy   integer;
  n_content  integer;
  n_chars    bigint;
begin
  select count(*) into n_legacy from public.elements where code !~ '^[0-9]';
  if n_legacy > 0 then
    raise exception
      'REFUSING: % legacy element(s) are still present, so migration 0030 has not been applied. Running 0033 now would drop overview_md and watch_out_for_md while they still hold the owner''s prose — and would also make 0030''s rollback unrunnable, because its inserts name both columns. Apply 0030 first.',
      n_legacy;
  end if;

  select
    count(*) filter (where coalesce(btrim(overview_md), '') <> ''
                        or coalesce(btrim(watch_out_for_md), '') <> ''),
    coalesce(sum(length(coalesce(overview_md, '')) + length(coalesce(watch_out_for_md, ''))), 0)
  into n_content, n_chars
  from public.elements;

  if n_content > 0 then
    raise exception
      'REFUSING: % element(s) still hold content in overview_md or watch_out_for_md (% characters). This migration DROPS those columns and nothing restores them. If the content is genuinely finished with, clear it deliberately first; if it is not, do not run this migration.',
      n_content, n_chars;
  end if;

  raise notice '0033 guard: 0 legacy elements, 0 characters in the columns about to be dropped.';
end
$guard$;

-- ---------------------------------------------------------------------------
-- 1. THE FOUR ELEMENT FUNCTIONS, WITHOUT THE TWO COLUMNS.
--    Done BEFORE the DROP COLUMN, or the drop fails on the dependency.
-- ---------------------------------------------------------------------------

-- 1a. get_element — the partner-facing read (0011). Approval-gated, and gated
--     again on the topic and its group being published.
drop function if exists public.get_element(text);
create function public.get_element(p_slug text)
returns table (
  id              uuid,
  slug            text,
  code            text,
  focus_area_code text,
  focus_area_name text,
  title           text,
  one_line        text,
  simple_guide_md text,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name, e.title,
         e.one_line, e.simple_guide_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_approved()
    and exists (select 1 from public.platform_topics t
                join public.platform_groups g on g.id = t.group_id
                where t.element_id = e.id and t.published and g.published);
$$;
revoke execute on function public.get_element(text) from public, anon;
grant  execute on function public.get_element(text) to authenticated;

-- 1b. admin_list_elements — the admin index (0023). `has_overview` and
--     `has_watch_out_for` go with the columns they described.
drop function if exists public.admin_list_elements();
create function public.admin_list_elements()
returns table (
  id               uuid,
  slug             text,
  code             text,
  focus_area_code  text,
  focus_area_name  text,
  title            text,
  one_line         text,
  sort_order       integer,
  has_simple_guide boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.sort_order,
         (e.simple_guide_md is not null and btrim(e.simple_guide_md) <> '')
  from public.elements e
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, e.code;
$$;
revoke execute on function public.admin_list_elements() from public, anon;
grant  execute on function public.admin_list_elements() to authenticated;

-- 1c. admin_get_element — one element with its body, for editing (0023).
drop function if exists public.admin_get_element(text);
create function public.admin_get_element(p_slug text)
returns table (
  id              uuid,
  slug            text,
  code            text,
  focus_area_code text,
  focus_area_name text,
  title           text,
  one_line        text,
  simple_guide_md text,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.simple_guide_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_admin();
$$;
revoke execute on function public.admin_get_element(text) from public, anon;
grant  execute on function public.admin_get_element(text) to authenticated;

-- 1d. admin_upsert_element — the admin write (0026), minus two parameters.
--     Arity 10 -> 8, so the old signature is dropped explicitly rather than
--     left behind as an overload that still writes to columns that are gone.
drop function if exists public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer);
create function public.admin_upsert_element(
  p_slug            text,
  p_code            text,
  p_focus_area_code text,
  p_focus_area_name text,
  p_title           text,
  p_one_line        text    default null,
  p_simple_guide_md text    default null,
  p_sort_order      integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_code  text := nullif(btrim(coalesce(p_code, '')), '');
  v_fac   text := nullif(upper(btrim(coalesce(p_focus_area_code, ''))), '');
  v_fan   text := nullif(btrim(coalesce(p_focus_area_name, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
    raise exception 'invalid slug' using errcode = '22023';
  end if;
  if v_fac is not null and v_fac !~ '^[A-K]$' then
    raise exception 'invalid focus area' using errcode = '22023';
  end if;
  if v_code is null or v_title is null then
    raise exception 'code and title are required' using errcode = '22023';
  end if;

  insert into public.elements (slug, code, focus_area_code, focus_area_name, title, one_line, simple_guide_md, sort_order)
  values (
    v_slug, left(v_code, 16), v_fac, left(v_fan, 120), left(v_title, 200),
    nullif(btrim(coalesce(p_one_line, '')), ''),
    (case when btrim(coalesce(p_simple_guide_md, '')) = '' then null else left(p_simple_guide_md, 100000) end),
    coalesce(p_sort_order, 0)
  )
  on conflict (slug) do update set
    code = excluded.code, focus_area_code = excluded.focus_area_code,
    focus_area_name = excluded.focus_area_name, title = excluded.title,
    one_line = excluded.one_line, simple_guide_md = excluded.simple_guide_md,
    sort_order = excluded.sort_order, updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_element(text, text, text, text, text, text, text, integer) from public, anon;
grant  execute on function public.admin_upsert_element(text, text, text, text, text, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE DEAD RPCs. `0029` already dropped the retired READ paths; these are
--    the writes and the admin surface that outlived them.
-- ---------------------------------------------------------------------------
drop function if exists public.set_checklist_progress(uuid, text, text);

drop function if exists public.admin_list_academy_modules();
drop function if exists public.admin_get_academy_module(uuid);
drop function if exists public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer);
drop function if exists public.admin_delete_academy_module(uuid);

-- The Live hub went at PP5 (D-PP-b, owner: `/live` dropped entirely).
drop function if exists public.member_programming_sessions();
drop function if exists public.publish_programming_session(text, text, uuid, text, text, text, text, timestamptz);

-- ---------------------------------------------------------------------------
-- 3. `programming_sessions` POLICIES. The table and its rows are KEPT — the
--    owner's decision at D-PP-b was that the data stays — but with the RPCs
--    gone nothing should reach it. RLS stays enabled with zero policies, which
--    is default-deny: unreachable rather than deleted.
-- ---------------------------------------------------------------------------
drop policy if exists programming_sessions_select_own on public.programming_sessions;
drop policy if exists programming_sessions_insert_own on public.programming_sessions;
drop policy if exists programming_sessions_update_own on public.programming_sessions;
drop policy if exists programming_sessions_delete_own on public.programming_sessions;

-- ---------------------------------------------------------------------------
-- 4. THE THREE EMPTY TABLES. `checklist_progress` first: it carries the only
--    foreign key into `checklist_items`.
-- ---------------------------------------------------------------------------
drop table if exists public.checklist_progress;
drop table if exists public.checklist_items;
drop table if exists public.academy_modules;

-- ---------------------------------------------------------------------------
-- 5. THE TWO COLUMNS. The guard above proved both are empty on every row.
--    `overview_md` — the Overview card was removed at D-PP-f and the column is
--    rendered on no surface. `watch_out_for_md` — no consumer since PP5; the
--    owner confirmed at PP7 that it goes.
-- ---------------------------------------------------------------------------
alter table public.elements
  drop column if exists overview_md,
  drop column if exists watch_out_for_md;

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS, inside the transaction.
-- ---------------------------------------------------------------------------
do $check$
declare
  n_tables  integer;
  n_funcs   integer;
  n_cols    integer;
  n_pol     integer;
  n_elems   integer;
begin
  select count(*) into n_tables from information_schema.tables
   where table_schema = 'public'
     and table_name in ('checklist_items', 'checklist_progress', 'academy_modules');

  select count(*) into n_funcs from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname in ('set_checklist_progress', 'admin_list_academy_modules',
                     'admin_get_academy_module', 'admin_upsert_academy_module',
                     'admin_delete_academy_module', 'member_programming_sessions',
                     'publish_programming_session');

  select count(*) into n_cols from information_schema.columns
   where table_schema = 'public' and table_name = 'elements'
     and column_name in ('overview_md', 'watch_out_for_md');

  select count(*) into n_pol from pg_policy p
   join pg_class c on c.oid = p.polrelid
   where c.relname = 'programming_sessions';

  select count(*) into n_elems from public.elements;

  if n_tables <> 0 then raise exception '0033: % retired table(s) survive', n_tables; end if;
  if n_funcs  <> 0 then raise exception '0033: % retired function(s) survive', n_funcs; end if;
  if n_cols   <> 0 then raise exception '0033: % dropped column(s) survive', n_cols; end if;
  if n_pol    <> 0 then raise exception '0033: % programming_sessions policy(ies) survive', n_pol; end if;
  if n_elems  <> 22 then raise exception '0033: expected 22 elements, found %', n_elems; end if;

  raise notice '0033 OK — 3 tables, 7 functions, 4 policies and 2 columns removed; 22 elements intact.';
end
$check$;

commit;

-- Verify afterwards:
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='elements' order by column_name;
--   -- no overview_md, no watch_out_for_md
--
--   select count(*) from pg_policy p join pg_class c on c.oid=p.polrelid
--    where c.relname='programming_sessions';                      -- 0
--
--   select proname, pronargs from pg_proc
--    where pronamespace='public'::regnamespace and proname like '%element%'
--    order by proname;
--   -- admin_get_element/1 · admin_list_elements/0 · admin_upsert_element/8 · get_element/1
