-- 0012_checklist.up.sql
-- S5 (5b): the launch checklist catalog + per-user saved progress.
--
-- checklist_items is the gated catalog (the 200+ items across the 30 topics,
-- grouped, each optionally mapped to one of the 3 gates). Like elements (0011)
-- it is RLS default-deny with NO client policy and is read only through the
-- is_approved()-gated RPC get_checklist().
--
-- checklist_progress is the ONLY per-user write in the whole app (the saved
-- launch progress in Stages > Design & Build). It is owner-scoped: a session
-- reads only its own rows (RLS select policy), and writes go ONLY through the
-- hardened set_checklist_progress() RPC, which gates on is_approved(), forces
-- ownership to auth.uid() (never an argument), and locks status to the allowed
-- set — the mutable column is constrained in the function, not just by RLS
-- ownership (the S2 lesson from applications/0007).
--
-- The catalog uses a content-stable natural key (element_id, item_text) so the
-- one-time ingestion (S5 step 6) can re-run as an upsert WITHOUT changing item
-- ids — preserving every user's checklist_progress across re-ingestion.

create table if not exists public.checklist_items (
  id                uuid primary key default gen_random_uuid(),
  element_id        uuid    not null references public.elements (id) on delete cascade,
  group_label       text,
  gate              integer,
  item_text         text    not null,
  required_document text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  constraint checklist_items_gate_range check (gate is null or gate between 1 and 3),
  constraint checklist_items_natural_key unique (element_id, item_text)
);

-- Items are queried per element (the element page) and per focus area (Build).
create index if not exists checklist_items_element_id_idx
  on public.checklist_items (element_id);

-- RLS: enable + default-deny. No client policy — read only via get_checklist().
alter table public.checklist_items enable row level security;

create table if not exists public.checklist_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid    not null references auth.users (id) on delete cascade,
  checklist_item_id uuid    not null references public.checklist_items (id) on delete cascade,
  status            text    not null default 'not_started'
                      check (status in ('not_started', 'in_progress', 'complete', 'blocked')),
  blocked_note      text,
  updated_at        timestamptz not null default now(),
  constraint checklist_progress_owner_item unique (user_id, checklist_item_id)
);

create index if not exists checklist_progress_user_id_idx
  on public.checklist_progress (user_id);

-- RLS: enable + default-deny. A session may READ only its own progress rows.
-- There is intentionally NO client insert/update/delete policy — every write
-- goes through set_checklist_progress() (below), which sets the owner and locks
-- the status.
alter table public.checklist_progress enable row level security;

create policy checklist_progress_select_own
  on public.checklist_progress
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- The whole gated catalog, approved partners only, joined to its element for
-- focus-area grouping + topic labels. A non-approved caller passes the
-- is_approved() guard as false, so the WHERE yields zero rows (no leak).
create or replace function public.get_checklist()
returns table (
  id                uuid,
  element_id        uuid,
  element_code      text,
  element_title     text,
  focus_area_code   text,
  group_label       text,
  gate              integer,
  item_text         text,
  required_document text,
  sort_order        integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select ci.id, ci.element_id, e.code, e.title, e.focus_area_code,
         ci.group_label, ci.gate, ci.item_text, ci.required_document,
         ci.sort_order
  from public.checklist_items ci
  join public.elements e on e.id = ci.element_id
  where public.is_approved()
  order by e.focus_area_code, e.sort_order, ci.sort_order;
$$;

revoke execute on function public.get_checklist() from public, anon;
grant execute on function public.get_checklist() to authenticated;

-- Save the caller's progress on one item. Hardened: SECURITY DEFINER, pinned
-- search_path, fully-qualified objects. Authorization + ownership come from
-- is_approved()/auth.uid() INSIDE the function — never from arguments — and the
-- status is validated against the allowed set before any write. blocked_note is
-- kept only for the 'blocked' status. Upserts on the (user, item) owner key so
-- repeated saves update in place.
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
