"use client";

import * as React from "react";
import { PlayCircle, X } from "lucide-react";
import { usePwToast } from "@/components/workspace-v2/pw-toast";
import { youTubeEmbedUrl } from "@/lib/live/youtube";

/* Watch Video, on each focus-area card (22) and on the Overview's four section
   cards (4). L1 (owner, 2026-11-17): a finished video plays here, on the
   platform, in a player that closes back to the card, instead of sending the
   partner off to YouTube in a new tab.

   Three states, decided by the link the gated data layer returned (already
   through safeHttpUrl, so an http(s) URL or nothing):

   1. No link: the placeholder the handover asks for, unchanged — the action
      disabled with the mockup's "Video coming soon." message. aria-disabled,
      not disabled, so the message can still be reached by keyboard and by
      pointer.
   2. A YouTube link: a button that opens a <dialog> holding the privacy-enhanced
      player. The frame's address is REBUILT from the parsed 11-character video
      id on www.youtube-nocookie.com by youTubeEmbedUrl(); the stored URL never
      reaches the frame, and that host is the only one the CSP's frame-src
      allows. The iframe exists only while the dialog is open, so nothing is
      requested from YouTube until the partner asks for the video, and closing
      the dialog removes the frame, which stops playback.
   3. Any other http(s) link: the CMS refuses these, so only hand-written SQL
      could store one. The CSP forbids framing it, so it keeps the previous
      behaviour: a link that opens in a new tab.

   The dialog copies pw-search.tsx: a real <dialog> opened with showModal(), so
   the browser owns the focus trap, Escape, the inert page and the top layer;
   focus goes back to Watch Video on close (see the effect below for WebKit);
   the page behind is scroll-locked while it is open. The overlay fills the viewport, so a click that lands on it
   rather than on the panel is a click on the backdrop, and closes the player.
   Escape works while focus is in this document (it starts on Close video); once
   a partner clicks into the player, keys go to YouTube's own frame, as with any
   embedded video, and Close video or the backdrop closes it. */

const COPY = {
  label: "Watch Video",
  /* The mockup's own string. */
  soon: "Video coming soon.",
  close: "Close video",
} as const;

/* autoplay: the partner has just asked for this video, and the frame is granted
   autoplay below. rel=0 keeps the closing suggestions to the same channel.
   playsinline keeps an iPhone inside the dialog instead of forcing fullscreen. */
const PLAYER_PARAMS = "autoplay=1&rel=0&playsinline=1";

export function PwWatchVideo({
  url,
  title,
  className,
}: {
  url: string | null | undefined;
  /* The card's own title: the dialog's heading and the frame's accessible name. */
  title: string;
  className: string;
}) {
  const { showToast } = usePwToast();

  if (!url) {
    return (
      <button
        type="button"
        className={className}
        aria-disabled="true"
        aria-label={`${COPY.label}. ${COPY.soon}`}
        title={COPY.soon}
        onClick={() => showToast(COPY.soon)}
      >
        {COPY.label}
        <PlayCircle className="pw-icon" aria-hidden="true" />
      </button>
    );
  }

  const embedUrl = youTubeEmbedUrl(url);
  if (!embedUrl) {
    return (
      <a
        className={className}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {COPY.label}
        <PlayCircle className="pw-icon" aria-hidden="true" />
      </a>
    );
  }

  return (
    <PlayerButton embedUrl={embedUrl} title={title} className={className} />
  );
}

function PlayerButton({
  embedUrl,
  title,
  className,
}: {
  embedUrl: string;
  title: string;
  className: string;
}) {
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  /* The dialog is mounted only while open, so showModal() runs once it exists.
     Escape, Close video and the backdrop all end in the dialog's own `close`
     event, so state follows the element rather than predicting it.

     Focus goes back to Watch Video. Chromium does that itself: a click focuses
     the button, showModal() remembers it and close() restores it. WebKit (Safari,
     and every browser on an iPhone or iPad) does not focus a button on a click
     or tap, so there is nothing to restore, and at this moment focus is still on
     the dialog or on something inside it, which is about to be unmounted. So
     whenever focus is nowhere, or still in the dialog, it is put back by hand. */
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const onClose = () => {
      setOpen(false);
      const active = document.activeElement;
      if (!active || active === document.body || dialog.contains(active)) {
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    dialog.addEventListener("close", onClose);
    if (!dialog.open) dialog.showModal();
    return () => dialog.removeEventListener("close", onClose);
  }, [open]);

  /* showModal() makes the page inert but does not stop a wheel or a trackpad
     from scrolling it; same lock as the search overlay, previous value restored. */
  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {COPY.label}
        <PlayCircle className="pw-icon" aria-hidden="true" />
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          className="pw-overlay pw-video-overlay"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="pw-modal pw-video-modal">
            <div className="pw-modal-head">
              <h2 className="pw-video-title" id={titleId}>
                {title}
              </h2>
              <button
                type="button"
                className="pw-modal-close"
                aria-label={COPY.close}
                onClick={close}
              >
                <X className="pw-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="pw-video-frame">
              {/* No referrerPolicy="no-referrer": YouTube refuses to play in a
                  frame that sends no referrer. The site-wide
                  strict-origin-when-cross-origin sends only the origin. */}
              <iframe
                src={`${embedUrl}?${PLAYER_PARAMS}`}
                title={title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
