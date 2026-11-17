/* One page-scroll lock shared by every modal layer of the platform: the search
   overlay (pw-search.tsx) and the video player (pw-video-player.tsx).

   showModal() makes the page inert but does not stop a wheel or a trackpad from
   scrolling it, so an open overlay sets overflow:hidden on <html>. When each layer
   saved and restored that value on its own, two layers open at once could restore
   in the wrong order: open the player, press Ctrl/⌘+K, go Back (the player
   unmounts, the search stays open), close the search, and the search put back the
   "hidden" it had saved, leaving the page unscrollable with nothing open (the L1
   Codex review, round 1). Here the first lock saves the page's own value and only
   the last release puts it back, whatever order the layers close in.

   Client-only: call it from an effect, and return what it returns as the
   effect's cleanup. Releasing twice is harmless, which keeps StrictMode's double
   effects balanced. */

let locks = 0;
let saved = "";

export function lockPageScroll(): () => void {
  const root = document.documentElement;
  if (locks === 0) {
    saved = root.style.overflow;
    root.style.overflow = "hidden";
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) root.style.overflow = saved;
  };
}
