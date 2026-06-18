-- 0015_academy_modules.up.sql
-- S5 (5e): the optional Academy video library — one module per topic (30).
--
-- A reference, not a course: no progress, no quizzes, no certificate. Each
-- module maps 1:1 to an element (unique element_id) and carries the video link
-- + the script body. youtube_url is nullable — when null the card shows the
-- approved "video's coming" empty state and the written guide stands in. body_md
-- holds the topic's video script (the owner adds video links where scripts
-- exist; videos are filmed later).
--
-- Gated exactly like the other content: RLS default-deny, NO client policy, read
-- only through the is_approved()-gated get_academy_modules() RPC.

create table if not exists public.academy_modules (
  id          uuid    primary key default gen_random_uuid(),
  element_id  uuid    not null unique references public.elements (id) on delete cascade,
  title       text    not null,
  one_line    text,
  length      text,
  youtube_url text,
  body_md     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS: enable + default-deny. No client policy — read via get_academy_modules().
alter table public.academy_modules enable row level security;

-- The library, approved partners only, joined to its element for topic labels +
-- links. Narrow return (no body_md — the card view needs only the metadata +
-- whether a video exists). A non-approved caller passes the is_approved() guard
-- as false → zero rows.
create or replace function public.get_academy_modules()
returns table (
  id            uuid,
  element_id    uuid,
  element_slug  text,
  element_code  text,
  element_title text,
  title         text,
  one_line      text,
  length        text,
  youtube_url   text,
  sort_order    integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select am.id, am.element_id, e.slug, e.code, e.title,
         am.title, am.one_line, am.length, am.youtube_url, am.sort_order
  from public.academy_modules am
  join public.elements e on e.id = am.element_id
  where public.is_approved()
  order by e.focus_area_code, e.sort_order, am.sort_order;
$$;

revoke execute on function public.get_academy_modules() from public, anon;
grant execute on function public.get_academy_modules() to authenticated;
