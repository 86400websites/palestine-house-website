/* Placeholder sample videos (S10 10-5).
 *
 * The academy modules carry no real `youtube_url` yet, so every Videos card and
 * every element Video tab falls back to one of these neutral, openly-licensed
 * clips — purely so the videos feature reads as populated. They are CLEARLY
 * MARKED "Sample" in the UI, and are trivially swapped for the real per-topic
 * videos later: set `academy_modules.youtube_url` in the DB (it takes priority),
 * or replace this list. No database, no migration.
 *
 * NOTE (owner): verify these IDs on Preview or swap for your own clips.
 */

// Neutral, openly-licensed clips (Blender Foundation open movies) — placeholders.
const SAMPLE_VIDEO_IDS = [
  "aqz-KE-bpKQ", // Big Buck Bunny
  "R6MlUcmOul8", // Tears of Steel
  "eRsGyueVLvQ", // Sintel
] as const;

// Deterministic pick per topic code so a card always shows the same sample —
// no Math.random (keeps server + client render identical, no hydration drift).
function hashCode(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) {
    h = (h * 31 + code.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function sampleVideoUrl(code: string): string {
  const id = SAMPLE_VIDEO_IDS[hashCode(code) % SAMPLE_VIDEO_IDS.length];
  return `https://www.youtube.com/watch?v=${id}`;
}
