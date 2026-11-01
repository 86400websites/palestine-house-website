/* At 980px and below the admin screens stack (globals.css), so a detail panel opens
   below the whole list, out of sight, and a tap on Edit looks as if it did nothing.
   This brings the panel into view, at that width only. */
export function revealWhenStacked(panel: HTMLElement | null) {
  if (panel && window.matchMedia("(max-width: 980px)").matches) {
    panel.scrollIntoView({ block: "start" });
  }
}
