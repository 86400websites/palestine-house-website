-- 0022_programming_publish_url_guard.down.sql — restores the 0020 RPC body
-- (no URL length cap, no YouTube-host guard). The mode CHECK (0020) and the
-- approval-symmetric delete policy (0021) are unaffected.

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
