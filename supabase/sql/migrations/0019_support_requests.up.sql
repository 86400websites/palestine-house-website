-- 0019_support_requests.up.sql
-- S6 (6g): the /support contact form's storage + write path.
--
-- support_requests holds one row per submitted help request. RLS default-deny
-- with NO client policy — never read or written directly by a client. Two
-- hardened RPCs:
--   * submit_support_request(p_subject, p_message): APPROVED-only insert (the
--     anti-abuse posture for launching without rate-limit/Turnstile — see
--     PROJECT-STATUS §7 / D-S6-a). user_id always comes from auth.uid(), never
--     an argument; subject/message are required + length-capped. Returns the new
--     id. Email delivery is deferred to the post-launch email sprint — requests
--     are STORED, not lost.
--   * admin_list_support_requests(): is_admin()-gated read for the owner (zero
--     rows for non-admins), newest first.
-- Both: SECURITY DEFINER, search_path = '', EXECUTE revoked from public/anon
-- then granted to authenticated (the S2/S4 hardened-RPC pattern).

create table if not exists public.support_requests (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  subject    text        not null,
  message    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists support_requests_user_id_idx on public.support_requests (user_id);
create index if not exists support_requests_created_at_idx on public.support_requests (created_at desc);

-- RLS: enable + default-deny. No client policy — access only via the RPCs.
alter table public.support_requests enable row level security;

-- Approved-only insert; user_id is forced from auth.uid().
create or replace function public.submit_support_request(
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_id      uuid;
begin
  if v_uid is null or not public.is_approved() then
    raise exception 'not authorized';
  end if;
  if v_subject = '' or v_message = '' then
    raise exception 'subject and message are required';
  end if;
  insert into public.support_requests (user_id, subject, message)
  values (v_uid, left(v_subject, 200), left(v_message, 5000))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.submit_support_request(text, text) from public, anon;
grant execute on function public.submit_support_request(text, text) to authenticated;

-- Admin-only read for the owner (zero rows for non-admins).
create or replace function public.admin_list_support_requests()
returns table (
  id         uuid,
  user_id    uuid,
  subject    text,
  message    text,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.user_id, r.subject, r.message, r.created_at
  from public.support_requests r
  where public.is_admin()
  order by r.created_at desc;
$$;

revoke execute on function public.admin_list_support_requests() from public, anon;
grant execute on function public.admin_list_support_requests() to authenticated;
