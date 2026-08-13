/* View-model shapes for the workspace v2 toolkit pages (PP3).

   Kept apart from content.ts — which is "server-only" — so the client
   components that render this data can import their prop types without the
   compiler having to erase an import from a module that must never reach the
   browser. Same split as src/lib/workspace/types.ts vs content.ts. */

export type PwSectionSlug = "setup" | "operate" | "program" | "support";

/* One downloadable file in a topic's templates grid. `code` is non-null by
   construction — the D-PP-i grid predicate in content.ts requires it. */
export type PwTemplate = {
  id: string;
  title: string;
  code: string;
};

/* The single doc_key='guide' file behind Download Now. None are uploaded yet
   (PP6's CMS adds them), so this is null on all 33 topics today and the card
   falls back to an honest coming-soon state. The title names the file on hover,
   as the mockup's download controls do. */
export type PwGuideFile = {
  id: string;
  title: string;
};

export type PwTopic = {
  id: string;
  slug: string;
  title: string;
  /* The D-PP-f summary is the topic's own description + intro. There is no
     Overview card, and elements.overview_md is rendered nowhere. */
  description: string | null;
  intro: string | null;
  /* platform_topics.icon is deliberately NOT carried: the card renders the
     topic's photo, and its no-image fallback uses one generic mark rather than
     33 lucide imports for a state nobody should see. PP6 may need it again. */
  imagePath: string | null;
  imagePosition: string | null;
  /* Validated http(s) only — see safeHttpUrl. NULL until PP6 adds URLs. */
  youtubeUrl: string | null;
  guide: PwGuideFile | null;
  templates: PwTemplate[];
};

export type PwGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  topics: PwTopic[];
};

/* One entry in the global search index (PP4).

   The mockup's own index shape, minus what this platform does not have. Its
   `filter` field is dropped because kind maps 1:1 onto the four chips here
   (the mockup needed both because several resource kinds shared one chip), and
   dropping it saves a field on all ~363 entries.

   Nothing identifying travels with an entry: no resource id, no storage path,
   no bucket name. A hit navigates to a page — the reader for a guide, the
   focus-area card for a topic or a template — and the download still happens
   only through the existing signed-URL server action, from the card. */
export type PwSearchKind = "TOPIC" | "GUIDE" | "TEMPLATE";

export type PwSearchItem = {
  kind: PwSearchKind;
  title: string;
  /* The mockup's breadcrumb: "Setup › Foundations" for a focus area, and
     "Setup › Launching a New House" for a guide or a template. */
  path: string;
  href: string;
  /* Focus areas only. D-PP-j (owner, 2026-08-13) puts the topic's own
     description + intro in the match text, which is what lets a partner find a
     focus area by what it is about rather than only by its title. Guides and
     templates match on title + path + kind alone, so they carry none. */
  summary?: string;
};

/* Everything the reader at /{section}/{topic}/guide renders (PP4).

   Assembled server-side, so the page never handles raw Markdown and cannot
   forget to sanitize it. The element slug behind the body deliberately does NOT
   appear here: the reader is a platform surface addressed by topic, and the
   legacy /elements/[slug] route is deleted at PP5. */
export type PwGuideDoc = {
  section: PwSectionSlug;
  topicSlug: string;
  /* The topic's own title — what the focus-area card says, not the element's. */
  title: string;
  description: string | null;
  intro: string | null;
  /* The accordion group the topic sits in, for the reader's breadcrumb. */
  groupName: string;
  /* Sanitized server-side through the existing renderMarkdown. An empty string
     is an honest "nothing to read yet" state, NOT a 404 — the topic exists and
     its card links here, so a missing body must not read as a missing page. */
  bodyHtml: string;
  /* The doc_key='guide' download offered under the body, or null — which is all
     33 topics today, until PP6's CMS uploads the files. */
  file: PwGuideFile | null;
};
