-- 0029_ia_unlock.up.sql
-- PP6a pass 1 (Private Platform Revamp): unlock the information architecture and
-- give it a Draft/Live state, so PP6b can load one real focus area and PP6c can
-- load the other 21 and cut over reversibly.
--
-- WHY THIS EXISTS (D-PP-k, owner 2026-08-14). The owner delivered the final
-- content: 4 sections -> 22 focus areas -> 88 templates, with ZERO overlap
-- against the 33 focus areas / 297 templates seeded from the mockup. It is a
-- replacement information architecture, not an upload. See
-- docs/content-migration-map.md.
--
-- THE CEILING HAS THREE LAYERS, NOT ONE (verified against PROD 2026-08-14 —
-- the original sprint scope named only the first, which would have shipped a
-- migration that changed nothing):
--   1. the table CHECK elements_slug_shape ('^[a-k][1-3]$', 0011:32, widened 0026:23)
--   2. the admin_upsert_element BODY, which independently re-raises on the same
--      pattern and on '^[A-K]$'
--   3. three zod schemas in src/lib/admin/content-actions.ts (:56, :58, :132)
-- 11 letters x 3 = exactly 33 slots, and all 33 are occupied, so a 34th focus
-- area is physically impossible until all three are relaxed. Layers 1 and 2 are
-- here; layer 3 ships in the same commit.
--
-- DRAFT/LIVE IS A SECURITY BOUNDARY, NOT AN EDITORIAL ONE. `published` must be
-- honoured by every RPC that hands out content, not just the one that feeds the
-- section pages. Verified: get_element() returns simple_guide_md directly,
-- get_resources() returns every row, and get_resource_download() mints a signed
-- URL for any id — all EXECUTE-able by any approved caller. Filtering only
-- get_platform_topics() would have left a draft focus area's guide body and its
-- template FILES reachable by anyone approved. All four are filtered below.
--
-- ADDITIVE + BEHAVIOUR-PRESERVING. `published` defaults to true, so all 33 live
-- focus areas stay visible and this migration is a no-op on screen. No content
-- row is inserted, updated or deleted. No function signature changes, so the
-- deployed app is unaffected at every moment (expand -> migrate -> contract).
--
-- ONE DELETION: get_elements() is dropped. It is an unfiltered SECURITY DEFINER
-- read over every element, EXECUTE-able by any approved caller, with ZERO
-- callers in src/ (PP5 deleted its wrapper — see src/lib/workspace/content.ts:14)
-- and no entry in PP7's contraction list. Filtering a function nobody calls
-- keeps a leak surface alive for no benefit; the down-migration restores it
-- verbatim. Recorded so the choice is visible, not silent.

begin;

-- ---------------------------------------------------------------------------
-- 1) Layer 1 of the ceiling: the table constraints.
-- ---------------------------------------------------------------------------

-- General kebab slug, so the new focus areas can be named after themselves
-- ('get-legally-ready') instead of a coordinate ('a1'). The 33 existing slugs
-- ('a1' … 'k3') satisfy this, so the constraint validates without touching data.
alter table public.elements drop constraint if exists elements_slug_shape;
alter table public.elements add constraint elements_slug_shape
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 1 and 80);

-- The A–K focus-area vocabulary belongs to the OLD model. The new 22 have no
-- A–K identity, so the code becomes optional rather than something we fabricate
-- a junk value for. Existing rows keep their codes and still validate.
alter table public.elements drop constraint if exists elements_focus_area_shape;
alter table public.elements add constraint elements_focus_area_shape
  check (focus_area_code is null or focus_area_code ~ '^[A-K]$');

alter table public.elements alter column focus_area_code drop not null;
alter table public.elements alter column focus_area_name drop not null;

-- NOTE: public.resources.focus_area_shape ALREADY allows NULL
-- (CHECK (focus_area_code IS NULL OR focus_area_code ~ '^[A-K]$')), so template
-- rows for the new focus areas need no constraint change here. Verified on PROD.

-- ---------------------------------------------------------------------------
-- 2) Draft / Live.
--
-- default true = every existing row is Live, so this migration changes nothing
-- a partner can see. New content is created with published = false by the PP6a
-- write RPCs (pass 2), reviewed, and switched on deliberately.
--
-- A topic is visible only if BOTH it and its group are published, so an entire
-- section's worth of new content can be staged and revealed with one flip.
-- ---------------------------------------------------------------------------

alter table public.platform_groups
  add column if not exists published boolean not null default true;

alter table public.platform_topics
  add column if not exists published boolean not null default true;

-- Partial indexes matching the read predicate below (all rows are published
-- today, so these are small; they stay useful once drafts exist).
create index if not exists platform_topics_published_ix
  on public.platform_topics (published) where published;

create index if not exists platform_groups_published_ix
  on public.platform_groups (published) where published;

-- ---------------------------------------------------------------------------
-- 3) The four member read RPCs. Signatures are UNCHANGED (create or replace,
--    no column added/removed/reordered), so deployed code is unaffected.
--    0011/0027 pattern preserved: SECURITY DEFINER, pinned search_path,
--    is_approved() in the WHERE so a pending/anon caller gets zero rows rather
--    than an error, EXECUTE revoked from public/anon.
-- ---------------------------------------------------------------------------

-- 3a) The flat join behind every toolkit page, the reader breadcrumbs AND the
--     Ctrl/Cmd+K search index (built in src/lib/workspace-v2/content.ts:238-290
--     from this RPC — filtering here covers all three surfaces at once).
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
    and t.published
    and g.published
  order by g.section_slug, g.sort_order, t.sort_order, t.slug;
$$;

revoke execute on function public.get_platform_topics() from public, anon;
grant execute on function public.get_platform_topics() to authenticated;

-- 3b) The guide body. Previously reachable by element slug alone: a draft focus
--     area's entire simple_guide_md was one direct RPC call away, because the
--     app-level 404 in getTopicGuide() is a ROUTE guard, not a data guard.
--     Now an element resolves only through a published topic in a published
--     group — which also means an element with no topic at all resolves to
--     nothing, the fail-closed direction.
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
    and public.is_approved()
    and exists (
      select 1
      from public.platform_topics t
      join public.platform_groups g on g.id = t.group_id
      where t.element_id = e.id
        and t.published
        and g.published
    );
$$;

revoke execute on function public.get_element(text) from public, anon;
grant execute on function public.get_element(text) to authenticated;

-- 3c) The resource list. A row is visible when it resolves to a published topic,
--     OR when it is one of the PUBLIC booklets (element_id is null by design —
--     2 rows). The `and r.is_public` on the element-less branch is deliberate
--     and tighter than before: it also closes the orphan case, where deleting an
--     element SET NULLs its resources' element_id (resources_element_id_fkey ...
--     ON DELETE SET NULL) and would otherwise leave private files listed and
--     downloadable with no topic to gate them. Zero such rows exist today, so
--     the visible count is unchanged (297 + 2 = 299).
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
    and (
      (r.element_id is null and r.is_public)
      or exists (
        select 1
        from public.platform_topics t
        join public.platform_groups g on g.id = t.group_id
        where t.element_id = r.element_id
          and t.published
          and g.published
      )
    )
  order by r.focus_area_code nulls last, r.sort_order, r.title;
$$;

revoke execute on function public.get_resources() from public, anon;
grant execute on function public.get_resources() to authenticated;

-- 3d) The signed-URL issuer — THE ONLY SURFACE THAT HANDS OUT BYTES. Without
--     the same predicate, "Draft" would be an editorial illusion: the UI would
--     hide a draft topic's templates while any approved caller could still ask
--     for a download URL by id. Same predicate as 3c, deliberately.
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
  where r.id = p_id
    and public.is_approved()
    and (
      (r.element_id is null and r.is_public)
      or exists (
        select 1
        from public.platform_topics t
        join public.platform_groups g on g.id = t.group_id
        where t.element_id = r.element_id
          and t.published
          and g.published
      )
    );
$$;

revoke execute on function public.get_resource_download(uuid) from public, anon;
grant execute on function public.get_resource_download(uuid) to authenticated;

-- 3e) Drop the unfiltered, caller-less element list (see the header note).
drop function if exists public.get_elements();

-- ---------------------------------------------------------------------------
-- 4) Layer 2 of the ceiling: the admin_upsert_element body.
--
--    Restated in full rather than patched — the repo convention (0026) is that
--    a replaced function is written out whole, so the file is readable as the
--    definitive source. Changes vs the 0026 body:
--      - slug guard widened to the general kebab shape
--      - focus-area code is now OPTIONAL; validated only when supplied
--      - focus_area_name is no longer required
--    Everything else (is_admin() gate, truncation widths, conflict target,
--    returned id) is byte-for-byte the prior behaviour.
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
  v_fac   text := nullif(upper(btrim(coalesce(p_focus_area_code, ''))), '');
  v_fan   text := nullif(btrim(coalesce(p_focus_area_name, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
    raise exception 'invalid slug' using errcode = '22023';
  end if;
  -- Optional now: the new focus areas have no A–K identity. Validated only if
  -- the caller supplies one, so the legacy 33 keep their codes.
  if v_fac is not null and v_fac !~ '^[A-K]$' then
    raise exception 'invalid focus area' using errcode = '22023';
  end if;
  if v_code is null or v_title is null then
    raise exception 'code and title are required' using errcode = '22023';
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

commit;
