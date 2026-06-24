-- 0020_programming_publish.up.sql
-- S9 (9e): the partner publishing write path for Live Programming.
--
-- Builds on 0013 (the programming_sessions table + owner-scoped RLS + the anon
-- public_programming_sessions() projection). Adds two things:
--
--   * a mode CHECK constraint — 0013 left mode free-text (a flagged design gap);
--     S9 finalises the vocabulary, so mode is now constrained to the four
--     publishable threads the /live filter chips + the publish form use. NULL is
--     allowed (a session need not declare a category).
--
--   * publish_programming_session(...): the hardened insert-or-update RPC an
--     APPROVED partner calls to publish or edit its OWN session. Same pattern as
--     submit_support_request (0019): SECURITY DEFINER + search_path = '', auth
--     enforced in-function (is_approved() AND created_by = auth.uid()) because
--     DEFINER bypasses RLS, length-capped via left(), EXECUTE revoked from
--     public/anon then granted to authenticated. p_id NULL inserts; non-NULL
--     updates only the caller's own row (created_by = auth.uid()) and bumps
--     updated_at by hand (this schema has no updated_at trigger — 0009/0012/0018
--     maintain it the same way). One YouTube link is stored in the column the
--     watch view reads for that status (past -> recording_url, else stream_url).
--
-- No RLS policy change: 0013's owner-scoped policies already authorise the
-- effective writes, and the public read path (the RPC) is untouched.
--
-- PRE-FLIGHT before applying to prod: the CHECK validates existing rows at
-- apply time. Confirm none fall outside the vocabulary first --
--   select distinct mode from public.programming_sessions
--    where mode is not null and mode not in ('Music','Talks','Performance','Food');
-- reconcile any offending rows before running this migration. (Re-runnable: the
-- constraint is dropped-if-exists first; the function uses create or replace.)

alter table public.programming_sessions
  drop constraint if exists programming_sessions_mode_check;
alter table public.programming_sessions
  add constraint programming_sessions_mode_check
  check (mode is null or mode in ('Music', 'Talks', 'Performance', 'Food'));

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
  v_url       text := nullif(btrim(coalesce(p_youtube_url, '')), '');
  v_stream    text;
  v_recording text;
  v_id        uuid;
begin
  -- AuthN/Z: SECURITY DEFINER bypasses RLS, so the gate lives here.
  if v_uid is null or not public.is_approved() then
    raise exception 'not authorized';
  end if;
  if v_title is null then
    raise exception 'title is required';
  end if;
  if p_status is null or p_status not in ('scheduled', 'live', 'past') then
    raise exception 'invalid status';
  end if;
  -- '' normalised to NULL above; validate the rest for parity with title/status
  -- (the CHECK constraint is the backstop for any direct write).
  if v_mode is not null
     and v_mode not in ('Music', 'Talks', 'Performance', 'Food') then
    raise exception 'invalid mode';
  end if;

  -- One link, stored where the watch view reads it for this status.
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

    -- No row updated => not the caller's session (or it doesn't exist).
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
