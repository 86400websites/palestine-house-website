-- 0033_contraction.down.sql
-- Reverses 0033 — the SCHEMA, not the data.
--
-- ⚠️ WHAT THIS CANNOT BRING BACK
-- ------------------------------
-- Structure comes back exactly: three tables with their RLS and policies, the
-- seven functions, the four `programming_sessions` policies, and the two
-- `elements` columns.
--
-- **The CONTENT of `overview_md` and `watch_out_for_md` does not.** `DROP COLUMN`
-- destroys the values, and no `.down.sql` can invent them. That is survivable
-- only because `0033` REFUSES TO RUN unless both columns are empty on every row
-- — so if it ran at all, there was nothing in them to lose.
--
-- The three tables come back EMPTY, which is also what `0030` left them as: 0
-- checklist_items, 0 checklist_progress, 0 academy_modules. Nothing is lost that
-- `0030` had not already deleted.
--
-- `programming_sessions` rows are untouched throughout — 0033 only dropped its
-- policies, and this puts them back.
--
-- Run this only to restore the shape, e.g. if a caller turns out to have needed
-- one of the retired RPCs.

begin;

-- ---------------------------------------------------------------------------
-- 1. The two columns, and the four element functions that carried them.
-- ---------------------------------------------------------------------------
alter table public.elements
  add column if not exists overview_md      text,
  add column if not exists watch_out_for_md text;

drop function if exists public.get_element(text);
create function public.get_element(p_slug text)
returns table (
  id uuid, slug text, code text, focus_area_code text, focus_area_name text,
  title text, one_line text, overview_md text, simple_guide_md text,
  watch_out_for_md text, sort_order integer
)
language sql security definer set search_path = '' stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name, e.title,
         e.one_line, e.overview_md, e.simple_guide_md, e.watch_out_for_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_approved()
    and exists (select 1 from public.platform_topics t
                join public.platform_groups g on g.id = t.group_id
                where t.element_id = e.id and t.published and g.published);
$$;
revoke execute on function public.get_element(text) from public, anon;
grant  execute on function public.get_element(text) to authenticated;

drop function if exists public.admin_list_elements();
create function public.admin_list_elements()
returns table (
  id uuid, slug text, code text, focus_area_code text, focus_area_name text,
  title text, one_line text, sort_order integer,
  has_overview boolean, has_simple_guide boolean, has_watch_out_for boolean
)
language sql security definer set search_path = '' stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.sort_order,
         (e.overview_md      is not null and btrim(e.overview_md)      <> ''),
         (e.simple_guide_md  is not null and btrim(e.simple_guide_md)  <> ''),
         (e.watch_out_for_md is not null and btrim(e.watch_out_for_md) <> '')
  from public.elements e
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, e.code;
$$;
revoke execute on function public.admin_list_elements() from public, anon;
grant  execute on function public.admin_list_elements() to authenticated;

drop function if exists public.admin_get_element(text);
create function public.admin_get_element(p_slug text)
returns table (
  id uuid, slug text, code text, focus_area_code text, focus_area_name text,
  title text, one_line text, overview_md text, simple_guide_md text,
  watch_out_for_md text, sort_order integer
)
language sql security definer set search_path = '' stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.overview_md, e.simple_guide_md,
         e.watch_out_for_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_admin();
$$;
revoke execute on function public.admin_get_element(text) from public, anon;
grant  execute on function public.admin_get_element(text) to authenticated;

drop function if exists public.admin_upsert_element(text, text, text, text, text, text, text, integer);
create function public.admin_upsert_element(
  p_slug text, p_code text, p_focus_area_code text, p_focus_area_name text,
  p_title text, p_one_line text default null, p_overview_md text default null,
  p_simple_guide_md text default null, p_watch_out_for_md text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql security definer set search_path = ''
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

  insert into public.elements (slug, code, focus_area_code, focus_area_name, title, one_line, overview_md, simple_guide_md, watch_out_for_md, sort_order)
  values (
    v_slug, left(v_code, 16), v_fac, left(v_fan, 120), left(v_title, 200),
    nullif(btrim(coalesce(p_one_line, '')), ''),
    (case when btrim(coalesce(p_overview_md, '')) = '' then null else left(p_overview_md, 100000) end),
    (case when btrim(coalesce(p_simple_guide_md, '')) = '' then null else left(p_simple_guide_md, 100000) end),
    (case when btrim(coalesce(p_watch_out_for_md, '')) = '' then null else left(p_watch_out_for_md, 100000) end),
    coalesce(p_sort_order, 0)
  )
  on conflict (slug) do update set
    code = excluded.code, focus_area_code = excluded.focus_area_code,
    focus_area_name = excluded.focus_area_name, title = excluded.title,
    one_line = excluded.one_line, overview_md = excluded.overview_md,
    simple_guide_md = excluded.simple_guide_md,
    watch_out_for_md = excluded.watch_out_for_md,
    sort_order = excluded.sort_order, updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) from public, anon;
grant  execute on function public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. The three tables, empty, with RLS default-deny as they had it.
-- ---------------------------------------------------------------------------
/* These three definitions were read back out of the live TEST catalogue before
   0033 dropped them (pg_attribute + pg_constraint + pg_index), NOT reconstructed
   from the 0012 / 0015 migration files. A first draft written from memory got
   two of the three wrong — checklist_items has `item_text`, `group_label`,
   `gate` and `required_document`, not `label`/`detail`; checklist_progress has a
   uuid primary key with a separate unique constraint, `blocked_note`, and a
   four-value status CHECK defaulting to 'not_started'. A down-migration that
   recreates the wrong shape is worse than none: it looks like a restore. */

create table if not exists public.checklist_items (
  id                uuid primary key default gen_random_uuid(),
  element_id        uuid not null references public.elements (id) on delete cascade,
  group_label       text,
  gate              integer,
  item_text         text not null,
  required_document text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  constraint checklist_items_gate_range check (gate is null or (gate >= 1 and gate <= 3)),
  constraint checklist_items_natural_key unique (element_id, item_text)
);
alter table public.checklist_items enable row level security;
create index if not exists checklist_items_element_id_idx on public.checklist_items (element_id);

create table if not exists public.checklist_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  status            text not null default 'not_started'
                      check (status in ('not_started', 'in_progress', 'complete', 'blocked')),
  blocked_note      text,
  updated_at        timestamptz not null default now(),
  constraint checklist_progress_owner_item unique (user_id, checklist_item_id)
);
alter table public.checklist_progress enable row level security;
create index if not exists checklist_progress_user_id_idx on public.checklist_progress (user_id);
/* Ownership AND approval — read back from pg_policy, not assumed. A first draft
   wrote ownership alone, which is precisely the shape `0031` had to fix on
   programming_sessions after the review found it failing open. */
create policy checklist_progress_select_own on public.checklist_progress
  for select to authenticated
  using (user_id = (select auth.uid()) and public.is_approved());

create table if not exists public.academy_modules (
  id          uuid primary key default gen_random_uuid(),
  element_id  uuid not null unique references public.elements (id) on delete cascade,
  title       text not null,
  one_line    text,
  length      text,
  youtube_url text,
  body_md     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.academy_modules enable row level security;

-- ---------------------------------------------------------------------------
-- 3. The programming_sessions policies (0013, as corrected by 0031 — the
--    SELECT policy checks approval as well as ownership).
-- ---------------------------------------------------------------------------
create policy programming_sessions_select_own on public.programming_sessions
  for select to authenticated
  using (created_by = (select auth.uid()) and public.is_approved());
create policy programming_sessions_insert_own on public.programming_sessions
  for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_approved());
create policy programming_sessions_update_own on public.programming_sessions
  for update to authenticated
  using (created_by = (select auth.uid()) and public.is_approved())
  with check (created_by = (select auth.uid()) and public.is_approved());
create policy programming_sessions_delete_own on public.programming_sessions
  for delete to authenticated
  using (created_by = (select auth.uid()) and public.is_approved());


-- ---------------------------------------------------------------------------
-- 4. The seven retired RPCs (review round 4, M2). The header promised exact
--    schema restoration and the first version of this file silently omitted
--    them — a rollback that recreates the tables but not the functions leaves
--    a rediscovered caller just as broken as before the rollback. Bodies are
--    copied verbatim from their last-shipped definitions: 0012
--    (set_checklist_progress), 0023 (the four academy admin RPCs), 0025
--    (member_programming_sessions), 0022 (publish_programming_session, the
--    URL-guard version).
-- ---------------------------------------------------------------------------
create or replace function public.set_checklist_progress(
  p_item_id uuid,
  p_status  text,
  p_note    text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_approved() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_status not in ('not_started', 'in_progress', 'complete', 'blocked') then
    raise exception 'invalid status: %', p_status using errcode = '22023';
  end if;

  insert into public.checklist_progress (user_id, checklist_item_id, status, blocked_note, updated_at)
  values (
    v_uid,
    p_item_id,
    p_status,
    case when p_status = 'blocked' then p_note else null end,
    now()
  )
  on conflict (user_id, checklist_item_id) do update
    set status       = excluded.status,
        blocked_note = excluded.blocked_note,
        updated_at   = now();

  return p_status;
end;
$$;

revoke execute on function public.set_checklist_progress(uuid, text, text) from public, anon;
grant execute on function public.set_checklist_progress(uuid, text, text) to authenticated;

create or replace function public.admin_list_academy_modules()
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
  has_body      boolean,
  sort_order    integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select am.id, am.element_id, e.slug, e.code, e.title,
         am.title, am.one_line, am.length, am.youtube_url,
         (am.body_md is not null and btrim(am.body_md) <> ''),
         am.sort_order
  from public.academy_modules am
  join public.elements e on e.id = am.element_id
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, am.sort_order;
$$;
revoke execute on function public.admin_list_academy_modules() from public, anon;
grant execute on function public.admin_list_academy_modules() to authenticated;

create or replace function public.admin_get_academy_module(p_element_id uuid)
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
  body_md       text,
  sort_order    integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select am.id, am.element_id, e.slug, e.code, e.title,
         am.title, am.one_line, am.length, am.youtube_url, am.body_md, am.sort_order
  from public.academy_modules am
  join public.elements e on e.id = am.element_id
  where am.element_id = p_element_id
    and public.is_admin();
$$;
revoke execute on function public.admin_get_academy_module(uuid) from public, anon;
grant execute on function public.admin_get_academy_module(uuid) to authenticated;

create or replace function public.admin_upsert_academy_module(
  p_element_id  uuid,
  p_title       text,
  p_one_line    text default null,
  p_length      text default null,
  p_youtube_url text default null,
  p_body_md     text default null,
  p_sort_order  integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_url   text := nullif(btrim(coalesce(p_youtube_url, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_element_id is null then
    raise exception 'element is required' using errcode = '22023';
  end if;
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.elements e where e.id = p_element_id) then
    raise exception 'element not found' using errcode = 'P0002';
  end if;
  if v_url is not null
     and v_url !~* '^https?://([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)(/|$)' then
    raise exception 'invalid video link' using errcode = '22023';
  end if;

  insert into public.academy_modules
    (element_id, title, one_line, length, youtube_url, body_md, sort_order)
  values
    (p_element_id, left(v_title, 200),
     nullif(btrim(coalesce(p_one_line, '')), ''),
     nullif(btrim(coalesce(p_length, '')), ''),
     left(v_url, 500),
     (case when btrim(coalesce(p_body_md, '')) = '' then null else left(p_body_md, 100000) end),
     coalesce(p_sort_order, 0))
  on conflict (element_id) do update
    set title       = excluded.title,
        one_line    = excluded.one_line,
        length      = excluded.length,
        youtube_url = excluded.youtube_url,
        body_md     = excluded.body_md,
        sort_order  = excluded.sort_order
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer) from public, anon;
grant execute on function public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer) to authenticated;

create or replace function public.admin_delete_academy_module(p_element_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.academy_modules where element_id = p_element_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;
revoke execute on function public.admin_delete_academy_module(uuid) from public, anon;
grant execute on function public.admin_delete_academy_module(uuid) to authenticated;



/* This one was silently MISSING from the first version of this block: its
   source grant line in 0025 reads `grant  execute` (two spaces), the extraction
   searched for one, and an unmatched index sliced an empty string. Caught by
   grepping the output for all seven names rather than trusting the count. */
create or replace function public.member_programming_sessions()
returns table (
  id            uuid,
  title         text,
  summary       text,
  mode          text,
  status        text,
  venue         text,
  stream_url    text,
  recording_url text,
  starts_at     timestamptz,
  cover_path    text,
  is_mine       boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select s.id, s.title, s.summary, s.mode, s.status, s.venue,
         s.stream_url, s.recording_url, s.starts_at, s.cover_path,
         (s.created_by = (select auth.uid())) as is_mine
  from public.programming_sessions s
  where public.is_approved()          -- pending/revoked callers: zero rows
  order by s.starts_at desc nulls last;
$$;

revoke execute on function public.member_programming_sessions() from public, anon;
grant  execute on function public.member_programming_sessions() to authenticated;

create or replace function public.publish_programming_session(
  p_title       text,
  p_status      text,
  p_id          uuid        default null,
  p_youtube_url text        default null,
  p_summary     text        default null,
  p_mode        text        default null,
  p_venue       text        default null,
  p_starts_at   timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_title     text := nullif(btrim(coalesce(p_title, '')), '');
  v_summary   text := nullif(btrim(coalesce(p_summary, '')), '');
  v_venue     text := nullif(btrim(coalesce(p_venue, '')), '');
  v_mode      text := nullif(btrim(coalesce(p_mode, '')), '');
  v_url       text := left(nullif(btrim(coalesce(p_youtube_url, '')), ''), 500);
  v_stream    text;
  v_recording text;
  v_id        uuid;
begin
  if v_uid is null or not public.is_approved() then
    raise exception 'not authorized';
  end if;
  if v_title is null then
    raise exception 'title is required';
  end if;
  if p_status is null or p_status not in ('scheduled', 'live', 'past') then
    raise exception 'invalid status';
  end if;
  if v_mode is not null
     and v_mode not in ('Music', 'Talks', 'Performance', 'Food') then
    raise exception 'invalid mode';
  end if;
  -- A stored video link must be a YouTube host (the watch view only embeds the
  -- youtube-nocookie player, and the 11-char id is re-validated at render). This
  -- backstops the Server Action so a direct PostgREST call can't store junk.
  if v_url is not null
     and v_url !~* '^https?://([a-z0-9-]+\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)(/|\?|$)' then
    raise exception 'invalid video link';
  end if;

  if p_status = 'past' then
    v_recording := v_url;
  else
    v_stream := v_url;
  end if;

  if p_id is null then
    insert into public.programming_sessions
      (created_by, title, summary, mode, status, venue,
       stream_url, recording_url, starts_at)
    values
      (v_uid, left(v_title, 200), left(v_summary, 1000), v_mode, p_status,
       left(v_venue, 200), v_stream, v_recording, p_starts_at)
    returning id into v_id;
  else
    update public.programming_sessions
       set title         = left(v_title, 200),
           summary       = left(v_summary, 1000),
           mode          = v_mode,
           status        = p_status,
           venue         = left(v_venue, 200),
           stream_url    = v_stream,
           recording_url = v_recording,
           starts_at     = p_starts_at,
           updated_at    = now()
     where id = p_id
       and created_by = v_uid
    returning id into v_id;
    if v_id is null then
      raise exception 'session not found';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.publish_programming_session(
  text, text, uuid, text, text, text, text, timestamptz
) from public, anon;
grant execute on function public.publish_programming_session(
  text, text, uuid, text, text, text, text, timestamptz
) to authenticated;

commit;

-- (superseded note — the seven RPCs ARE now restored above, review round 4 M2)
-- ⚠️ Previously not restored: the retired RPCs
--    set_checklist_progress, the four admin_*_academy_module functions,
--    member_programming_sessions and publish_programming_session. Their bodies
--    are in 0012 / 0015 / 0023 / 0025 / 0022 if one is ever genuinely needed —
--    but every surface that called them was deleted at PP5, so restoring them
--    blind would put back an unreachable write path.
