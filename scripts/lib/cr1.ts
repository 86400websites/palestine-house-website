/**
 * scripts/lib/cr1.ts — what the CR1 content-refresh scripts share.
 *
 * WHERE THE PRIVATE MATERIAL LIVES
 * --------------------------------
 * The delivery, the identity map, the generated spec, row snapshots, the byte
 * archive and the run ledger all sit under `docs/source-assets/content-refresh-cr1/`,
 * which `.gitignore` covers. This repository is public: these scripts carry the
 * logic and nothing else — no guide body, no filename map, no id, no storage key.
 *
 * THE KEY SHAPE IS HOW THE EXACT DOWNLOAD FILENAME SURVIVES WITHOUT A SCHEMA CHANGE
 * ---------------------------------------------------------------------------------
 * `getResourceDownloadUrl` names the download after the LAST SEGMENT of the
 * storage path. So a replacement object goes to
 *
 *     <element-slug>/cr1-<delivery fingerprint>/<the supplied filename, verbatim>
 *
 * The folder carries the version, so a later delivery can sit beside this one and
 * a rollback only has to repoint rows; the last segment is the owner's filename,
 * unsuffixed, which is what a partner's browser saves it as.
 */

import path from "node:path";
export { OVERVIEW_CODE } from "../../src/lib/workspace-v2/shared-resources";

const ROOT = process.cwd();

export const CR1_ROOT = path.join(ROOT, "docs/source-assets/content-refresh-cr1");
export const DELIVERY = path.join(CR1_ROOT, "New Content");
export const LEARNER_ROOT = path.join(DELIVERY, "Palestine House Content");
export const COPY_ROOT = path.join(DELIVERY, "Website Copy");
export const PRIVATE_DIR = path.join(CR1_ROOT, "_private");
export const SPEC_PATH = path.join(PRIVATE_DIR, "cr1-spec.json");
export const IDENTITY_PATH = path.join(PRIVATE_DIR, "cr1-identity-map.json");
export const DELIVERY_MANIFEST_PATH = path.join(PRIVATE_DIR, "delivery-manifest.json");
export const VIDEO_MAP_PATH = path.join(PRIVATE_DIR, "cr1-video-map.json");

export const BUCKET = "resources";

export type SectionSlug = "setup" | "operate" | "program" | "support";

/** The 22 focus areas: numbers, sections and slugs are frozen. A title changes on
 *  a card without changing an address, because a partner's bookmark is a promise. */
export const TOPICS: readonly { number: string; section: SectionSlug; slug: string }[] = [
  { number: "1.1", section: "setup", slug: "get-legally-ready" },
  { number: "1.2", section: "setup", slug: "plan-the-money" },
  { number: "1.3", section: "setup", slug: "find-and-prepare-the-space" },
  { number: "1.4", section: "setup", slug: "build-a-small-team" },
  { number: "1.5", section: "setup", slug: "get-ready-to-open" },
  { number: "2.1", section: "operate", slug: "money" },
  { number: "2.2", section: "operate", slug: "daily-house-operations" },
  { number: "2.3", section: "operate", slug: "food-beverages" },
  { number: "2.4", section: "operate", slug: "members-and-visitors" },
  { number: "2.5", section: "operate", slug: "team" },
  { number: "2.6", section: "operate", slug: "monthly-check-up" },
  { number: "3.1", section: "program", slug: "plan-the-calendar" },
  { number: "3.2", section: "program", slug: "plan-an-event" },
  { number: "3.3", section: "program", slug: "work-with-artists-and-speakers" },
  { number: "3.4", section: "program", slug: "promote-the-event" },
  { number: "3.5", section: "program", slug: "learn-the-event" },
  { number: "3.6", section: "program", slug: "connect-to-the-wider-palestine-house-network" },
  { number: "4.1", section: "support", slug: "marketing" },
  { number: "4.2", section: "support", slug: "sponsorship-fundraising" },
  { number: "4.3", section: "support", slug: "partnerships" },
  { number: "4.4", section: "support", slug: "ask-community-support-for-help" },
  { number: "4.5", section: "support", slug: "learn-from-other-palestine-houses" },
];

export const EXPECTED = {
  files: 156,
  overviews: 22,
  guides: 22,
  templates: 83,
  templateDocx: 80,
  templatePng: 1,
  templateSvg: 2,
  learner: 127,
  scripts: 26,
  copyDocs: 3,
  retired: 12,
  replacedTemplates: 76,
  addedTemplates: 7,
} as const;

export const CONTENT_TYPE: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export interface SpecFile {
  /** Exactly as supplied. Also the last segment of `storageKey`. */
  fileName: string;
  /** Relative to the learner root, forward slashes. */
  relPath: string;
  storageKey: string;
  contentType: string;
  bytes: number;
  sha256: string;
  md5: string;
  title: string;
}

export interface SpecTemplate extends SpecFile {
  code: string;
  sortOrder: number;
  /** The row this replaces, or null for a genuinely new resource. */
  oldCode: string | null;
  oldTitle: string | null;
}

export interface SpecRetired {
  code: string;
  oldTitle: string;
  reason: string;
}

export interface SpecCrossLink {
  fileName: string;
  homeNumber: string;
  homeSlug: string;
  code: string;
}

export interface SpecTopic {
  number: string;
  section: SectionSlug;
  slug: string;
  title: string;
  oldTitle: string;
  summary: string;
  introMd: string;
  guideMd: string;
  guide: SpecFile & { oldTitle: string };
  overview: SpecFile;
  templates: SpecTemplate[];
  retired: SpecRetired[];
  crossLinks: SpecCrossLink[];
}

export interface Cr1Spec {
  generatedBy: string;
  deliveryFingerprint: string;
  keyFolder: string;
  totals: { topics: number; overviews: number; guides: number; templates: number; learner: number };
  topics: SpecTopic[];
}

/** A stable label for a target's private run folder. */
export function targetDir(target: string): string {
  return path.join(PRIVATE_DIR, target);
}

/* THE DISPLAY-TITLE RULE (Private copy section 8): "use its meaningful title
   without the extension or Template Sample suffix; do not add an invented version
   label." The package has four packaging labels of the same kind, and the
   document's own prose names the files without them (1.2's worked example, 4.4's
   contacts resource, the logo), so all four come off the CARD. The downloaded
   filename keeps every one of them, exactly as supplied. */
export function displayTitle(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/\s+-\s+(Template Sample|Sample|Reference|From Supplied Documents)$/i, "")
    .trim();
}

export function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Word stream for a fidelity comparison: case, spacing and quote glyphs do not
 *  count, words and their order do. */
export function wordsOf(text: string): string[] {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}
