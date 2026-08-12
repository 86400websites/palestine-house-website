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
