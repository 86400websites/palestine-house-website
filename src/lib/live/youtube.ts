/* YouTube link → privacy-enhanced embed (S9 9a, decision D-S9-a / D1).
   Partners publish a plain YouTube, YouTube-Live, or youtu.be link; we NEVER
   embed the raw URL. We parse it, extract the 11-char video id, validate it, and
   rebuild the embed URL from scratch on the youtube-nocookie origin — the single
   origin the S9 CSP frame-src allows. This mirrors the scheme-validation
   discipline of safeHttpUrl in src/lib/workspace/content.ts: anything that isn't
   a recognised YouTube link returns null, and every consumer falls back to a
   graceful "video unavailable" state rather than crashing. Pure and
   dependency-free, so it runs server-side and is unit-checkable. */

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/* The path prefixes that carry the id as the next segment. */
const ID_SEGMENTS = new Set(["live", "embed", "shorts", "v"]);

/* Extract a valid 11-char YouTube video id from a watch / live / embed / shorts
   / youtu.be link, or null when the input isn't a usable YouTube video. */
export function parseYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!YT_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  let id: string | null = null;
  if (parsed.hostname.toLowerCase() === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    const v = parsed.searchParams.get("v");
    if (v) {
      id = v;
    } else {
      const segs = parsed.pathname.split("/").filter(Boolean);
      if (segs.length >= 2 && ID_SEGMENTS.has(segs[0])) id = segs[1];
    }
  }

  return id && VIDEO_ID.test(id) ? id : null;
}

/* Privacy-enhanced embed URL on the youtube-nocookie origin (the only host the
   S9 CSP frame-src permits), or null when the link isn't a usable video. */
export function youTubeEmbedUrl(url: string | null | undefined): string | null {
  const id = parseYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
