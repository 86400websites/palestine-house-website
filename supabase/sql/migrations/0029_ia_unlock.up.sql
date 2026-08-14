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

-- ===========================================================================
-- 5) THE IA WRITE PATH (PP6a pass 2).
--
-- Verified 2026-08-14: there is NOTHING here today. Zero admin_*_platform_*
-- functions exist, and all three tables are RLS default-deny with zero client
-- policies, so the platform IA has been readable and completely unwritable
-- since 0027. Every function below is new.
--
-- Posture is the 0023/0024 pattern throughout: SECURITY DEFINER, pinned
-- search_path, is_admin() as the FIRST statement, narrow returns,
-- revoke-then-grant. Errors are short, stable strings the app maps to
-- brand-voice copy — a raw 23505 or 23503 must never reach the owner's screen.
--
-- Four rules are enforced HERE, in the database, not in the UI, because the UI
-- is not access control and the owner must not be able to break the platform
-- from a form:
--   - delete works only on a Draft row (set it to Draft first — one extra
--     click that removes a whole category of accident)
--   - a group with focus areas in it cannot be deleted (FK is ON DELETE
--     RESTRICT; we catch it and say what to do instead)
--   - a focus area with files attached cannot be deleted (otherwise
--     resources_element_id_fkey ON DELETE SET NULL silently orphans the rows
--     AND their Storage objects, and they vanish from every grid while still
--     existing — the worst possible outcome)
--   - the URL slug is set once, at creation, and is never changed by a rename
-- ===========================================================================

-- --- 5a) Admin reads. These DO return drafts; the member RPCs above do not. ---

create or replace function public.admin_list_platform_sections()
returns table (
  slug                   text,
  num                    integer,
  label                  text,
  subtitle               text,
  eyebrow                text,
  title                  text,
  lead                   text,
  hero_image_path        text,
  hero_position          text,
  journey_image_path     text,
  journey_image_position text,
  journey_desc           text,
  journey_icon           text,
  youtube_url            text,
  sort_order             integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.slug, s.num, s.label, s.subtitle, s.eyebrow, s.title, s.lead,
         s.hero_image_path, s.hero_position, s.journey_image_path,
         s.journey_image_position, s.journey_desc, s.journey_icon,
         s.youtube_url, s.sort_order
  from public.platform_sections s
  where public.is_admin()
  order by s.sort_order, s.slug;
$$;

revoke execute on function public.admin_list_platform_sections() from public, anon;
grant execute on function public.admin_list_platform_sections() to authenticated;

create or replace function public.admin_list_platform_groups()
returns table (
  id           uuid,
  section_slug text,
  slug         text,
  name         text,
  description  text,
  sort_order   integer,
  published    boolean,
  topic_count  bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select g.id, g.section_slug, g.slug, g.name, g.description,
         g.sort_order, g.published,
         (select count(*) from public.platform_topics t where t.group_id = g.id)
  from public.platform_groups g
  where public.is_admin()
  order by g.section_slug, g.sort_order, g.slug;
$$;

revoke execute on function public.admin_list_platform_groups() from public, anon;
grant execute on function public.admin_list_platform_groups() to authenticated;

-- Everything the Focus areas screen needs in one round-trip, including the
-- counts that decide whether Delete is offered at all.
create or replace function public.admin_list_platform_topics()
returns table (
  id             uuid,
  group_id       uuid,
  group_name     text,
  section_slug   text,
  slug           text,
  title          text,
  description    text,
  intro          text,
  icon           text,
  image_path     text,
  image_position text,
  youtube_url    text,
  sort_order     integer,
  published      boolean,
  element_id     uuid,
  element_slug   text,
  element_code   text,
  has_guide_text boolean,
  template_count bigint,
  guide_file_count bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select t.id, t.group_id, g.name, g.section_slug,
         t.slug, t.title, t.description, t.intro, t.icon,
         t.image_path, t.image_position, t.youtube_url, t.sort_order, t.published,
         e.id, e.slug, e.code,
         (e.simple_guide_md is not null and btrim(e.simple_guide_md) <> ''),
         (select count(*) from public.resources r
           where r.element_id = e.id and r.doc_key is null),
         (select count(*) from public.resources r
           where r.element_id = e.id and r.doc_key = 'guide')
  from public.platform_topics t
  join public.platform_groups g on g.id = t.group_id
  join public.elements e on e.id = t.element_id
  where public.is_admin()
  order by g.section_slug, g.sort_order, t.sort_order, t.slug;
$$;

revoke execute on function public.admin_list_platform_topics() from public, anon;
grant execute on function public.admin_list_platform_topics() to authenticated;

-- --- 5b) Sections: EDIT ONLY. -------------------------------------------------
-- platform_sections_slug_shape freezes the set to
-- ('about','setup','operate','program','support'), because routes and nav
-- depend on it. So there is deliberately no insert and no delete: a typo can
-- never create a broken menu item. Unknown slug is rejected outright rather
-- than silently updating nothing.

create or replace function public.admin_update_platform_section(
  p_slug                   text,
  p_label                  text,
  p_title                  text,
  p_subtitle               text default null,
  p_eyebrow                text default null,
  p_lead                   text default null,
  p_hero_image_path        text default null,
  p_hero_position          text default null,
  p_journey_image_path     text default null,
  p_journey_image_position text default null,
  p_journey_desc           text default null,
  p_journey_icon           text default null,
  p_youtube_url            text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_label text := nullif(btrim(coalesce(p_label, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_label is null or v_title is null then
    raise exception 'label and title are required' using errcode = '22023';
  end if;

  update public.platform_sections s
     set label                  = left(v_label, 120),
         title                  = left(v_title, 200),
         subtitle               = nullif(btrim(coalesce(p_subtitle, '')), ''),
         eyebrow                = nullif(btrim(coalesce(p_eyebrow, '')), ''),
         lead                   = nullif(btrim(coalesce(p_lead, '')), ''),
         hero_image_path        = nullif(btrim(coalesce(p_hero_image_path, '')), ''),
         hero_position          = nullif(btrim(coalesce(p_hero_position, '')), ''),
         journey_image_path     = nullif(btrim(coalesce(p_journey_image_path, '')), ''),
         journey_image_position = nullif(btrim(coalesce(p_journey_image_position, '')), ''),
         journey_desc           = nullif(btrim(coalesce(p_journey_desc, '')), ''),
         journey_icon           = nullif(btrim(coalesce(p_journey_icon, '')), ''),
         youtube_url            = nullif(btrim(coalesce(p_youtube_url, '')), ''),
         updated_at             = now()
   where s.slug = v_slug;

  if not found then
    raise exception 'unknown section' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.admin_update_platform_section(
  text, text, text, text, text, text, text, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.admin_update_platform_section(
  text, text, text, text, text, text, text, text, text, text, text, text, text)
  to authenticated;

-- --- 5c) Groups. --------------------------------------------------------------
-- Under D-PP-n the new model is one group per section, rendered as a flat list,
-- so the owner rarely touches these — but the CMS can still add one if a
-- section grows, which is why the write path exists.

create or replace function public.admin_upsert_platform_group(
  p_id           uuid    default null,
  p_section_slug text    default null,
  p_slug         text    default null,
  p_name         text    default null,
  p_description  text    default null,
  p_sort_order   integer default 0,
  p_published    boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_sect text := lower(btrim(coalesce(p_section_slug, '')));
  v_id   uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_name is null then
    raise exception 'name is required' using errcode = '22023';
  end if;

  if p_id is null then
    -- Create. New groups are DRAFT by default: nothing appears for a partner
    -- until the owner deliberately publishes it.
    if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
      raise exception 'invalid slug' using errcode = '22023';
    end if;
    if not exists (select 1 from public.platform_sections s where s.slug = v_sect) then
      raise exception 'unknown section' using errcode = '22023';
    end if;
    begin
      insert into public.platform_groups
        (section_slug, slug, name, description, sort_order, published)
      values (v_sect, v_slug, left(v_name, 200),
              nullif(btrim(coalesce(p_description, '')), ''),
              coalesce(p_sort_order, 0), coalesce(p_published, false))
      returning id into v_id;
    exception when unique_violation then
      raise exception 'slug in use' using errcode = '23505';
    end;
  else
    -- Update. The slug is NOT touched: renaming must never change a URL.
    update public.platform_groups g
       set name        = left(v_name, 200),
           description = nullif(btrim(coalesce(p_description, '')), ''),
           sort_order  = coalesce(p_sort_order, g.sort_order),
           published   = coalesce(p_published, g.published),
           updated_at  = now()
     where g.id = p_id
     returning g.id into v_id;
    if v_id is null then
      raise exception 'unknown group' using errcode = '22023';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.admin_upsert_platform_group(
  uuid, text, text, text, text, integer, boolean) from public, anon;
grant execute on function public.admin_upsert_platform_group(
  uuid, text, text, text, text, integer, boolean) to authenticated;

create or replace function public.admin_delete_platform_group(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published boolean;
  v_topics    integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select g.published into v_published from public.platform_groups g where g.id = p_id;
  if v_published is null then
    raise exception 'unknown group' using errcode = '22023';
  end if;
  if v_published then
    raise exception 'live group' using errcode = '22023';
  end if;

  select count(*) into v_topics from public.platform_topics t where t.group_id = p_id;
  if v_topics > 0 then
    -- The FK is ON DELETE RESTRICT, so this would raise 23503 anyway. Catching
    -- it up front lets the app say "move its focus areas first" instead of
    -- surfacing a foreign-key error to a non-technical owner.
    raise exception 'group not empty' using errcode = '23503';
  end if;

  delete from public.platform_groups g where g.id = p_id;
end;
$$;

revoke execute on function public.admin_delete_platform_group(uuid) from public, anon;
grant execute on function public.admin_delete_platform_group(uuid) to authenticated;

-- --- 5d) Focus areas — the two-table transaction. ------------------------------
-- platform_topics.element_id is NOT NULL + UNIQUE + FK -> elements, so a focus
-- area does not exist without an elements row. Both writes happen in one
-- function so a half-created focus area is impossible. The eleven CMS fields
-- straddle the two tables: the guide BODY is elements.simple_guide_md, and the
-- other ten are platform_topics columns.

create or replace function public.admin_upsert_platform_topic(
  p_id              uuid    default null,
  p_group_id        uuid    default null,
  p_slug            text    default null,
  p_title           text    default null,
  p_description     text    default null,
  p_intro           text    default null,
  p_icon            text    default null,
  p_image_path      text    default null,
  p_image_position  text    default null,
  p_youtube_url     text    default null,
  p_sort_order      integer default 0,
  p_published       boolean default false,
  p_element_code    text    default null,
  p_simple_guide_md text    default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug    text := lower(btrim(coalesce(p_slug, '')));
  v_title   text := nullif(btrim(coalesce(p_title, '')), '');
  v_icon    text := coalesce(nullif(btrim(coalesce(p_icon, '')), ''), 'sprig');
  v_code    text := nullif(btrim(coalesce(p_element_code, '')), '');
  v_guide   text := (case when btrim(coalesce(p_simple_guide_md, '')) = ''
                          then null else left(p_simple_guide_md, 100000) end);
  v_id      uuid;
  v_element uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;

  if p_id is null then
    -- ---- create ----
    if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
      raise exception 'invalid slug' using errcode = '22023';
    end if;
    if v_code is null then
      raise exception 'code is required' using errcode = '22023';
    end if;
    if not exists (select 1 from public.platform_groups g where g.id = p_group_id) then
      raise exception 'unknown group' using errcode = '22023';
    end if;

    begin
      insert into public.elements
        (slug, code, focus_area_code, focus_area_name, title, one_line,
         simple_guide_md, sort_order)
      values (v_slug, left(v_code, 16), null, null, left(v_title, 200),
              nullif(btrim(coalesce(p_description, '')), ''),
              v_guide, coalesce(p_sort_order, 0))
      returning id into v_element;
    exception when unique_violation then
      raise exception 'slug in use' using errcode = '23505';
    end;

    begin
      -- platform_topics.slug is UNIQUE GLOBALLY, not per section, and the old
      -- 33 keep their slugs until 0030 — so a collision is realistic and must
      -- read as "that name is already used", never as a raw 23505.
      insert into public.platform_topics
        (element_id, group_id, slug, title, description, intro, icon,
         image_path, image_position, youtube_url, sort_order, published)
      values (v_element, p_group_id, v_slug, left(v_title, 200),
              nullif(btrim(coalesce(p_description, '')), ''),
              nullif(btrim(coalesce(p_intro, '')), ''),
              v_icon,
              nullif(btrim(coalesce(p_image_path, '')), ''),
              nullif(btrim(coalesce(p_image_position, '')), ''),
              nullif(btrim(coalesce(p_youtube_url, '')), ''),
              coalesce(p_sort_order, 0), coalesce(p_published, false))
      returning id into v_id;
    exception when unique_violation then
      raise exception 'slug in use' using errcode = '23505';
    end;
  else
    -- ---- update: the slug is frozen, so renaming never breaks a link ----
    select t.element_id into v_element
    from public.platform_topics t where t.id = p_id;
    if v_element is null then
      raise exception 'unknown focus area' using errcode = '22023';
    end if;

    update public.platform_topics t
       set group_id       = coalesce(p_group_id, t.group_id),
           title          = left(v_title, 200),
           description    = nullif(btrim(coalesce(p_description, '')), ''),
           intro          = nullif(btrim(coalesce(p_intro, '')), ''),
           icon           = v_icon,
           image_path     = nullif(btrim(coalesce(p_image_path, '')), ''),
           image_position = nullif(btrim(coalesce(p_image_position, '')), ''),
           youtube_url    = nullif(btrim(coalesce(p_youtube_url, '')), ''),
           sort_order     = coalesce(p_sort_order, t.sort_order),
           published      = coalesce(p_published, t.published),
           updated_at     = now()
     where t.id = p_id
     returning t.id into v_id;

    update public.elements e
       set title           = left(v_title, 200),
           one_line        = nullif(btrim(coalesce(p_description, '')), ''),
           code            = coalesce(left(v_code, 16), e.code),
           simple_guide_md = coalesce(v_guide, e.simple_guide_md),
           updated_at      = now()
     where e.id = v_element;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.admin_upsert_platform_topic(
  uuid, uuid, text, text, text, text, text, text, text, text, integer, boolean, text, text)
  from public, anon;
grant execute on function public.admin_upsert_platform_topic(
  uuid, uuid, text, text, text, text, text, text, text, text, integer, boolean, text, text)
  to authenticated;

-- The Draft <-> Live switch, on its own so the UI toggle cannot accidentally
-- rewrite any other field.
create or replace function public.admin_set_platform_topic_published(
  p_id uuid,
  p_published boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.platform_topics t
     set published = coalesce(p_published, false), updated_at = now()
   where t.id = p_id;

  if not found then
    raise exception 'unknown focus area' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.admin_set_platform_topic_published(uuid, boolean)
  from public, anon;
grant execute on function public.admin_set_platform_topic_published(uuid, boolean)
  to authenticated;

-- Delete: Draft only, files-free only, and the element goes with it in the
-- correct order. Deleting the elements row alone would CASCADE the topic and
-- SET NULL the resources' element_id, leaving private files that belong to
-- nothing, invisible in every grid but still stored — so files must be removed
-- through the file lifecycle FIRST.
create or replace function public.admin_delete_platform_topic(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published boolean;
  v_element   uuid;
  v_files     integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select t.published, t.element_id into v_published, v_element
  from public.platform_topics t where t.id = p_id;
  if v_element is null then
    raise exception 'unknown focus area' using errcode = '22023';
  end if;
  if v_published then
    raise exception 'live focus area' using errcode = '22023';
  end if;

  select count(*) into v_files from public.resources r where r.element_id = v_element;
  if v_files > 0 then
    raise exception 'focus area has files' using errcode = '23503';
  end if;

  delete from public.platform_topics t where t.id = p_id;
  delete from public.elements e where e.id = v_element;
end;
$$;

revoke execute on function public.admin_delete_platform_topic(uuid) from public, anon;
grant execute on function public.admin_delete_platform_topic(uuid) to authenticated;

-- --- 5e) Reordering. ----------------------------------------------------------
-- The CMS shows up/down arrows, never a number to fat-finger, so the whole
-- ordered list is sent and positions are assigned from array order.

create or replace function public.admin_reorder_platform_topics(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  with ordered as (
    select id, (ordinality::integer - 1) * 10 as new_sort
    from unnest(p_ids) with ordinality as u(id, ordinality)
  )
  update public.platform_topics t
     set sort_order = o.new_sort, updated_at = now()
    from ordered o
   where t.id = o.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.admin_reorder_platform_topics(uuid[]) from public, anon;
grant execute on function public.admin_reorder_platform_topics(uuid[]) to authenticated;

create or replace function public.admin_reorder_platform_groups(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  with ordered as (
    select id, (ordinality::integer - 1) * 10 as new_sort
    from unnest(p_ids) with ordinality as u(id, ordinality)
  )
  update public.platform_groups g
     set sort_order = o.new_sort, updated_at = now()
    from ordered o
   where g.id = o.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.admin_reorder_platform_groups(uuid[]) from public, anon;
grant execute on function public.admin_reorder_platform_groups(uuid[]) to authenticated;

commit;
