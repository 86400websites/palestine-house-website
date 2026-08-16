/**
 * scripts/lib/shift.ts — has the code→document mapping moved under us?
 *
 * THE HAZARD
 * ----------
 * A template's code (`t01`, `t02`, …) comes from ALPHABETICAL FILENAME ORDER in
 * the delivered folder. So adding, removing or renaming one source document
 * re-letters every document after it. If the loader then writes the spec's
 * titles onto rows matched by code, it attaches one document's name to another
 * document's bytes — a partner downloads "Beta" and gets Alpha.
 *
 * WHAT PP7 CHANGED (finding M1)
 * -----------------------------
 * The original detector raised only when the displaced title reappeared in the
 * SAME focus area's spec under a different code — a clean two-way swap, which it
 * can name precisely. Everything else was waved through as "a pure rename: the
 * old title simply disappeared from the spec".
 *
 * But that is exactly what a DELETION-INDUCED SHIFT looks like. Delete `Alpha`
 * (t03) and `Beta` (t04) slides down to t03. The database still says t03 =
 * "Alpha"; the spec now says t03 = "Beta"; and "Alpha" is nowhere in the spec,
 * so the swap branch never fires. The row holding Alpha's bytes was retitled
 * Beta and Beta's real document never landed.
 *
 * A rename and a shift are genuinely indistinguishable from title and code
 * alone: `resources` stores no filename and no content hash, and
 * `admin_list_resource_files` withholds the storage path by design (D-PP-i).
 * So this stops guessing and asks — `allowRetitle` is a human saying "I know
 * this one is a rename".
 */

export interface ShiftTemplate {
  code: string;
  title: string;
}

export interface ShiftRegistered {
  code: string | null;
  title: string;
  doc_key: string | null;
}

/** Throws if the code→title mapping disagrees with the spec. */
export function assertCodesHaveNotShifted(
  focusAreaTitle: string,
  templates: readonly ShiftTemplate[],
  registered: readonly ShiftRegistered[],
  allowRetitle: boolean,
): void {
  for (const t of templates) {
    const clash = registered.find((r) => r.doc_key === null && r.code === t.code);
    if (!clash || clash.title === t.title) continue;

    /* THE DETECTABLE SWAP: the displaced title is still in this focus area's
       spec under a different code, so both ends of the exchange can be named. */
    const movedTo = templates.find((x) => x.title === clash.title && x.code !== t.code);
    if (movedTo) {
      throw new Error(
        `Template codes have shifted on "${focusAreaTitle}". ${t.code} is registered as ` +
          `"${clash.title}", which the spec now calls ${movedTo.code}. Codes come from ` +
          `alphabetical filename order, so a renamed or inserted file re-labels the ones ` +
          `after it — continuing would attach each file's name to the other's bytes. ` +
          `Fix the codes in the CMS, or delete this focus area's files and re-load it. ` +
          `Nothing has been written.`,
      );
    }

    /* AND THE ONE THAT USED TO PASS. */
    if (!allowRetitle) {
      throw new Error(
        `${t.code} on "${focusAreaTitle}" is registered as "${clash.title}" but the spec calls it ` +
          `"${t.title}", and "${clash.title}" is nowhere in this focus area's spec.\n\n` +
          `That is EITHER a file renamed in place (harmless) OR a deleted file having ` +
          `re-lettered every code after it (harmful: ${t.code} would keep "${clash.title}"'s ` +
          `bytes under "${t.title}"'s name). Title and code cannot tell those apart — the ` +
          `database stores neither a filename nor a content hash.\n\n` +
          `If you know it is a rename, pass --allow-retitle. If files were added or removed, ` +
          `fix the codes in the CMS or delete this focus area's files and re-load it. ` +
          `Nothing has been written.`,
      );
    }
  }
}
