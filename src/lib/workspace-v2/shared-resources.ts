/* How the private library tells its rows apart with the schema it already has (CR1).

   A focus area holds one Simple Guide (doc_key='guide'), one Overview, and its
   practical resources. `doc_key` can only ever be 'guide' and CR1 adds no column, so
   the row's `code` carries the difference:

     OV            the Overview: an ordinary private row, kept out of the 83
     LOGO          the supplied PNG logo
     SVG-n         an editable SVG layout
     T01, T02…     everything else, all Word documents

   No "server-only" here: the data layer, the client cards and the content scripts
   all read these, and none of it is private. */

export const OVERVIEW_CODE = "OV";

/* What "no video" looks like on a section's row. admin_update_platform_section reads
   a blank as "keep what is there" and 0029 is applied, so a link could never be taken
   off with a blank. This is stored instead: it is not a URL, so safeHttpUrl, the check
   every reader goes through, turns it back into nothing. */
export const NO_VIDEO_LINK = "none";

export type PwFileKind = "word" | "logo" | "layout";

export function fileKindOf(code: string | null): PwFileKind {
  if (code === "LOGO") return "logo";
  if (code?.startsWith("SVG-")) return "layout";
  return "word";
}

/* The handover's own wording (Private copy section 8). */
export const DOWNLOAD_LABEL: Record<PwFileKind, string> = {
  word: "Download Word File",
  logo: "Download Logo",
  layout: "Download Editable Layout",
};

/* Resources that belong to one focus area and are offered from others.

   The handover keeps ONE file for each canonical resource and links to it from
   wherever it helps: "Link to the same uploaded resource; do not create a second
   copy or another form." So there is one `resources` row and one object, and this
   map is what makes it appear on a second card. Nothing here is a copy of anything.

   Keyed by topic slug and code. Titles and ids come from the same approval-gated
   read as the rest of the card, so this table carries no private content and adds
   no path to a file. scripts/cr1-extract.ts fails if it disagrees with the
   document's own lists. */

export type SharedResourceRef = { topicSlug: string; code: string };

export const SHARED_RESOURCES: Readonly<Record<string, readonly SharedResourceRef[]>> = {
  "get-legally-ready": [{ topicSlug: "get-ready-to-open", code: "T01" }],
  "find-and-prepare-the-space": [{ topicSlug: "get-ready-to-open", code: "T01" }],
  money: [{ topicSlug: "monthly-check-up", code: "T01" }],
  "members-and-visitors": [{ topicSlug: "learn-the-event", code: "T02" }],
  "plan-the-calendar": [{ topicSlug: "plan-an-event", code: "T04" }],
  "plan-an-event": [
    { topicSlug: "learn-the-event", code: "T02" },
    { topicSlug: "learn-the-event", code: "T01" },
  ],
  "connect-to-the-wider-palestine-house-network": [
    { topicSlug: "ask-community-support-for-help", code: "T01" },
  ],
  marketing: [
    { topicSlug: "promote-the-event", code: "T04" },
    { topicSlug: "promote-the-event", code: "SVG-1" },
    { topicSlug: "promote-the-event", code: "SVG-2" },
  ],
  "sponsorship-fundraising": [{ topicSlug: "partnerships", code: "T02" }],
  "learn-from-other-palestine-houses": [
    { topicSlug: "ask-community-support-for-help", code: "T01" },
  ],
};
