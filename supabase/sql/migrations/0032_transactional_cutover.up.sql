-- 0032_transactional_cutover.up.sql
-- PP7 step 7-g · 2026-08-16
--
-- ONE RPC: flip a named set of focus areas between Draft and Live atomically.
--
-- ---------------------------------------------------------------------------
-- WHY THIS EXISTS
-- ---------------------------------------------------------------------------
-- The cutover — the moment the owner's 22 new focus areas become visible to
-- every approved partner — was a `for` loop in `scripts/cutover.ts` issuing 22
-- separate `admin_set_platform_topic_published` calls. The independent review of
-- 2026-08-16 rated that blocking, and the failure mode is easy to state: a
-- network blip at row 12 leaves **11 focus areas Live and 11 Draft**, with no
-- rollback and no record of which half landed. Partners see a platform that is
-- half a platform.
--
-- A cutover is one decision. It should be one statement.
--
-- ---------------------------------------------------------------------------
-- IT RESOLVES BY IDENTITY, NOT BY COUNT
-- ---------------------------------------------------------------------------
-- The same lesson `0030`'s guard learned in this sprint: counting 22 rows says
-- nothing about WHICH 22. This takes an explicit manifest — every focus area's
-- code, slug AND section — and refuses unless every single entry resolves to
-- exactly one topic on all three at once.
--
-- That matters because the caller's previous guard matched on slug alone, and
-- the slug is the one field in this schema DESIGNED to drift:
-- `admin_upsert_platform_topic` freezes it on update so a rename cannot break a
-- partner's bookmark. Identity keyed on the mutable field is how PP7 found a
-- renamed focus area could slip past the loader's Live guard entirely.
--
-- Nothing outside the manifest is touched. The legacy 33 are still Live until
-- `0030` removes them, and a cutover that reached them would unpublish the
-- platform partners are using today — so the target set is an allow-list that
-- fails closed, never a pattern and never a NOT-IN.
--
-- ---------------------------------------------------------------------------
-- REVERSIBLE, AND BY THE SAME CALL
-- ---------------------------------------------------------------------------
-- `p_published => false` takes the same 22 back to Draft. The reverse is not a
-- theoretical escape hatch: PP6c exercised it four times, including the
-- break-glass SQL, before the forward flip had ever run.
--
-- ---------------------------------------------------------------------------
-- SECURITY
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER with `set search_path = ''` and an `is_admin()` check as the
-- first statement, matching every other admin RPC in this schema. Revoke from
-- public and anon, grant to authenticated — authorization is the function's job,
-- not the grant's.

begin;

create or replace function public.admin_cutover_focus_areas(
  /* [{"code":"1.1","slug":"get-legally-ready","group_slug":"setup-focus-areas"}, …] */
  p_manifest  jsonb,
  p_published boolean
)
returns table (
  requested integer,
  changed   integer,
  unchanged integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_requested integer;
  n_resolved  integer;
  missing     text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_published is null then
    raise exception 'p_published must be true or false, not null' using errcode = '22023';
  end if;

  if p_manifest is null or jsonb_typeof(p_manifest) <> 'array' or jsonb_array_length(p_manifest) = 0 then
    raise exception 'p_manifest must be a non-empty json array of {code, slug, group_slug}'
      using errcode = '22023';
  end if;

  create temporary table _cutover_wanted on commit drop as
  select
    (e ->> 'code')       as code,
    (e ->> 'slug')       as slug,
    (e ->> 'group_slug') as group_slug
  from jsonb_array_elements(p_manifest) as e;

  select count(*) into n_requested from _cutover_wanted;

  if exists (select 1 from _cutover_wanted where code is null or slug is null or group_slug is null) then
    raise exception 'every manifest entry needs code, slug and group_slug' using errcode = '22023';
  end if;

  /* Duplicates would make "resolved = requested" pass while a focus area went
     untouched. Caught here rather than by a count that happens to agree. */
  if (select count(distinct code) from _cutover_wanted) <> n_requested
     or (select count(distinct slug) from _cutover_wanted) <> n_requested then
    raise exception 'the manifest contains duplicate codes or slugs' using errcode = '22023';
  end if;

  /* Resolve on all three at once. A row that matches two of the three is NOT a
     match — that is the whole point. */
  create temporary table _cutover_targets on commit drop as
  select t.id, w.code, w.slug, t.published
  from _cutover_wanted w
  join public.elements        e on e.code = w.code
  join public.platform_topics t on t.element_id = e.id and t.slug = w.slug
  join public.platform_groups g on g.id = t.group_id and g.slug = w.group_slug;

  select count(*) into n_resolved from _cutover_targets;

  if n_resolved <> n_requested then
    select string_agg(w.code || ' /' || w.slug, ', ' order by w.code) into missing
    from _cutover_wanted w
    where not exists (select 1 from _cutover_targets x where x.code = w.code);

    raise exception
      'REFUSING: % of % focus areas resolved. These did not match on code, slug AND section together: %. Nothing has been changed.',
      n_resolved, n_requested, coalesce(missing, '(none — a duplicate resolved twice)')
      using errcode = '22023';
  end if;

  select
    count(*) filter (where published is distinct from p_published),
    count(*) filter (where published is not distinct from p_published)
  into changed, unchanged
  from _cutover_targets;

  /* ONE statement. Either all of them flip or none of them do. */
  update public.platform_topics t
     set published = p_published,
         updated_at = now()
  from _cutover_targets x
  where t.id = x.id
    and t.published is distinct from p_published;

  requested := n_requested;
  return next;
end;
$$;

revoke execute on function public.admin_cutover_focus_areas(jsonb, boolean) from public, anon;
grant  execute on function public.admin_cutover_focus_areas(jsonb, boolean) to authenticated;

comment on function public.admin_cutover_focus_areas(jsonb, boolean) is
  'PP7 0032. Atomically publishes or unpublishes exactly the focus areas named in the manifest, '
  'each resolved on code + slug + section together. Refuses unless every entry resolves. '
  'Replaces the 22-separate-calls loop in scripts/cutover.ts, which could leave half the platform live.';

commit;

-- Verify:
--   select proname, prosecdef, proconfig
--   from pg_proc where proname = 'admin_cutover_focus_areas';
--   -- prosecdef = true, proconfig = {search_path=}
--
--   select has_function_privilege('anon',   'public.admin_cutover_focus_areas(jsonb, boolean)', 'execute');  -- false
--   select has_function_privilege('authenticated', 'public.admin_cutover_focus_areas(jsonb, boolean)', 'execute');  -- true
