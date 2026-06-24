-- 0022_programming_publish_url_guard.up.sql
-- S9 (9g, post-Codex hardening): enforce the YouTube-link contract at the
-- authoritative RPC boundary, not only in the Next.js Server Action.
--
-- The publish action validates the link (parseYouTubeId) and caps it at 500
-- chars, but publish_programming_session is granted to `authenticated` and
-- exposed via PostgREST — so an approved partner could call the RPC directly and
-- store an arbitrary / unbounded URL string in stream_url / recording_url (which
-- the anon public projection returns). It is not XSS or a leak — the watch view
-- always rebuilds the embed from a re-validated 11-char id and a non-YouTube
-- link degrades to a graceful state — but the column should hold what it claims.
-- This re-creates the RPC to (1) cap the URL at 500 chars and (2) reject a
-- non-YouTube host in-function, matching how title/summary/venue are already
-- left()-capped and status/mode are validated. No signature change. EXECUTE
-- grants are preserved by CREATE OR REPLACE and re-asserted below to be explicit.

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
