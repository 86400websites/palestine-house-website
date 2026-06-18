-- 0011_elements.up.sql
-- S5 (5a): the 30 topic ("element") pages as gated content.
--
-- elements holds one row per topic (A1..J3): focus-area placement, the
-- one-line intro, and the per-tab markdown bodies (Overview, Simple Guide,
-- Watch Out For). The Video + Templates tabs are sourced from academy_modules
-- (0015) and resources (0014), not stored here. watch_out_for_md is nullable —
-- four topics (H2, H3, I3, J2) have no source file and render the approved
-- empty state.
--
-- Access model (the whole point of S5): elements is RLS default-deny with NO
-- client policy — exactly like admins (0003). Approved partners reach it ONLY
-- through the two hardened, is_approved()-gated SECURITY DEFINER RPCs below; a
-- pending or anonymous caller gets zero rows. Nothing here is ever public
-- (programming_sessions in 0013 is the only anon-safe projection). Content is
-- loaded by the one-time ingestion script (S5 step 6), never by the app.

create table if not exists public.elements (
  id               uuid primary key default gen_random_uuid(),
  slug             text        not null unique,
  code             text        not null,
  focus_area_code  text        not null,
  focus_area_name  text        not null,
  title            text        not null,
  one_line         text,
  overview_md      text,
  simple_guide_md  text,
  watch_out_for_md text,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint elements_slug_shape       check (slug ~ '^[a-j][1-3]$'),
  constraint elements_focus_area_shape check (focus_area_code ~ '^[A-J]$')
);

-- RLS: enable + default-deny. No client policy on purpose — elements is never
-- read directly by a client session; the SECURITY DEFINER RPCs below are the
-- only read path, and each gates on is_approved().
alter table public.elements enable row level security;

-- List view: metadata only (no bodies), approved partners only. A non-approved
-- caller passes the is_approved() guard as false, so the WHERE yields zero rows
-- (no leak). Ordered by focus area then topic for the Plan / Operate /
-- focus-area surfaces.
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

-- Single element with full tab bodies, approved partners only. Returns zero
-- rows for an unknown slug or a non-approved caller. The slug argument selects
-- the row; it never grants access — is_approved() does.
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
