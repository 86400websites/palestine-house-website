-- 0027_platform_ia.up.sql
-- PP1 (Private Platform Revamp): the new workspace information architecture as a pure
-- PRESENTATION LAYER over the existing content. The owner's final mockup regroups the
-- same 33 topics ("elements") into 4 sections -> 10 groups -> 33 topics. As amended by
-- D-PP-c (PP1.1, 2026-08-11): each topic surfaces 3 cards (Overview / Simple guide /
-- Template). elements.overview_md / simple_guide_md and resources keep serving content
-- with zero re-upload; watch_out_for_md and checklist_items stay in place but DORMANT
-- (no consumer) until the PP7 contraction decision.
--
-- ADDITIVE ONLY. Old app code never touches these tables; the one changed signature
-- (get_resources) is widened in-place inside this transaction (columns appended, none
-- removed/reordered), so the deployed code is unaffected at every moment. Safe to apply
-- to production BEFORE the PP2 UI ships (expand -> migrate -> contract; the contraction
-- migration lands after PP7 QA).
--
-- Access model: identical to 0011 — all three new tables are RLS default-deny with NO
-- client policy; approved partners read ONLY via the is_approved()-gated SECURITY
-- DEFINER RPCs below. Structural metadata only — nothing here stores content bodies.
--
-- Seeded by the GENERATED 0028_platform_seed.up.sql (from docs/workspace-spec.json,
-- extracted out of the owner's mockup by scripts/extract-mockup-spec.ts).

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per workspace page: the About landing + the 4 toolkit sections.
-- slug is the route segment — fixed by CHECK because routes/nav depend on it
-- (the CMS may edit copy, never the slug set).
create table if not exists public.platform_sections (
  slug                   text primary key,
  num                    integer     not null,
  label                  text        not null,
  subtitle               text,
  eyebrow                text,
  title                  text        not null,
  lead                   text,
  hero_image_path        text,
  hero_position          text,
  journey_image_path     text,
  journey_image_position text,
  journey_desc           text,
  journey_icon           text,
  youtube_url            text,
  sort_order             integer     not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint platform_sections_slug_shape
    check (slug in ('about', 'setup', 'operate', 'program', 'support'))
);

-- Accordion groups inside a toolkit section (10 rows).
create table if not exists public.platform_groups (
  id           uuid primary key default gen_random_uuid(),
  section_slug text        not null references public.platform_sections (slug) on delete cascade,
  slug         text        not null,
  name         text        not null,
  description  text,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint platform_groups_section_slug_key unique (section_slug, slug)
);

-- The 33 topic cards. element_id UNIQUE NOT NULL is the integrity spine of the
-- whole revamp: every topic IS an existing element (bodies/checklist/templates
-- attach through it), and no element can surface twice.
create table if not exists public.platform_topics (
  id             uuid primary key default gen_random_uuid(),
  element_id     uuid        not null unique references public.elements (id) on delete cascade,
  group_id       uuid        not null references public.platform_groups (id) on delete restrict,
  slug           text        not null unique,
  title          text        not null,
  description    text,
  intro          text,
  icon           text        not null,
  image_path     text,
  image_position text,
  youtube_url    text,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS: enable + default-deny, no client policy (0011 pattern). RPC-only reads.
alter table public.platform_sections enable row level security;
alter table public.platform_groups   enable row level security;
alter table public.platform_topics   enable row level security;

-- ---------------------------------------------------------------------------
-- resources: two additive columns
-- ---------------------------------------------------------------------------

-- code: the template badge (T01/R01-style) shown on template rows in the new UI.
-- Backfilled deterministically from the ingest path convention
-- <element-slug>/tNN-kebab.docx — self-consistent with the DB's own data (no
-- cross-source mapping risk). Rows whose path doesn't match keep NULL and render
-- the icon chip, exactly like the mockup's blank-code templates.
alter table public.resources add column if not exists code text;

update public.resources
set code = upper(substring(storage_path from '/([a-z][0-9]{2})-'))
where code is null
  and storage_path ~ '/[a-z][0-9]{2}-';

-- doc_key: which of a topic's 3 card slots a file download serves
-- (overview / guide / template — D-PP-c). NULL for the dormant coded template
-- library and booklets. None of these files exist yet — the owner fills the
-- slots via CMS v2 (PP6): uploading a resources row carrying element_id +
-- doc_key, or (for 'template') promoting one of the dormant coded rows by
-- setting its doc_key. At most one file per (element, slot).
alter table public.resources add column if not exists doc_key text;

alter table public.resources drop constraint if exists resources_doc_key_shape;
alter table public.resources add constraint resources_doc_key_shape
  check (doc_key is null or doc_key in ('overview', 'guide', 'template'));

create unique index if not exists resources_element_doc_key_ux
  on public.resources (element_id, doc_key)
  where doc_key is not null;

-- ---------------------------------------------------------------------------
-- Member read RPCs (0011 pattern: SECURITY DEFINER, pinned search_path,
-- is_approved() gate in the WHERE — a pending/anon caller gets zero rows,
-- never an error; EXECUTE revoked from public/anon).
-- ---------------------------------------------------------------------------

create or replace function public.get_platform_sections()
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
  where public.is_approved()
  order by s.sort_order, s.slug;
$$;

revoke execute on function public.get_platform_sections() from public, anon;
grant execute on function public.get_platform_sections() to authenticated;

-- One flat 33-row join serving every toolkit page, the global search index and
-- the reader breadcrumbs. element_slug/element_code let the app join bodies
-- and resources without extra round-trips.
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

-- ---------------------------------------------------------------------------
-- get_resources(): widened in place (code + doc_key appended). Return type
-- changes require DROP + CREATE; inside this transaction there is no window
-- where the function is missing. The deployed app reads the result as rows of
-- named fields and ignores unknown keys, so old code keeps working unchanged.
-- ---------------------------------------------------------------------------

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

commit;
