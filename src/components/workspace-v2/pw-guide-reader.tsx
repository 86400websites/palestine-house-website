import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMyProfile } from "@/lib/auth/profile";
import { getTopicGuide } from "@/lib/workspace-v2/content";
import { getPlatformPages } from "@/lib/workspace-v2/content";
import { RESOURCE_KINDS } from "@/lib/workspace-v2/spec";
import { PwGuideDownload } from "@/components/workspace-v2/pw-guide-download";
import { PwSectionPending } from "@/components/workspace-v2/pw-section-page";
import type { PwGuideDoc, PwSectionSlug } from "@/lib/workspace-v2/types";

/* The Simple guide reader (PP4) — /{section}/{topic}/guide.

   The mockup has no reader: it opened a file-preview modal instead, which PP3
   dropped. The ROADMAP licenses this ONE page as Claude's own design, so it is
   built from the existing workspace-v2 tokens and adds no colour or font value
   the system does not already have.

   What the bodies actually are drove every decision here (measured on TEST at
   step 4b, across all 33):

     - they are LONG — 13k to 47k characters, average 26k, roughly 2,000 to
       7,500 words. So this is a reading column at a comfortable measure, not a
       card: one focused page with nothing competing for attention.

     - 30 of the 33 carry NO Markdown headings. The DOCX ingest turned Word's
       headings into bold-only lines (`__LIKE THIS__`), 72 per body on average,
       so renderMarkdown emits them as `<p><strong>` paragraphs. The CSS gives
       `p > strong:only-child` a heading's shape, which recovers the structure
       without editing a single character of the owner's content. It also rules
       out a heading-derived table of contents — there are no headings to
       derive one from.

   The lead is the topic's `description`, deliberately not its `intro`: the
   intro is written for the focus-area card ("Read the guide, then use the
   templates below…") and would promise templates this page does not carry. */

const GUIDE = RESOURCE_KINDS[0];

const COPY = {
  back: "Back to",
  downloadHeading: "Keep a copy.",
  emptyHeading: "This guide is on its way.",
  emptyBody:
    "The written guide for this focus area is being prepared. Check back shortly.",
} as const;

/* The body arrives already rendered AND sanitized by the data layer, through
   the same allow-list every DB body has passed since S6 — the page never sees
   raw Markdown, so it cannot forget to scrub it. */
function GuideBody({ html }: { html: string }) {
  if (!html) {
    return (
      <div className="pw-notice">
        <div>
          <h2 className="pw-notice-h">{COPY.emptyHeading}</h2>
          <p className="pw-notice-p">{COPY.emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pw-reader-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export async function PwGuideReader({ doc }: { doc: PwGuideDoc }) {
  const page = (await getPlatformPages())[doc.section];
  /* Back to the focus area itself, not just the section: the explorer opens
     the topic's group, expands its card and flashes it on this fragment. */
  const backHref = `/${doc.section}#topic-${encodeURIComponent(doc.topicSlug)}`;

  return (
    <article className="pw-reader">
      <div className="pw-container">
        <div className="pw-reader-shell">
          <nav className="pw-reader-crumb" aria-label="Breadcrumb">
            <Link className="pw-reader-back" href={backHref}>
              <ArrowLeft className="pw-icon" aria-hidden="true" />
              {COPY.back} {page.label}
            </Link>
            <span className="pw-reader-crumb-sep" aria-hidden="true">
              ·
            </span>
            <span>{doc.groupName}</span>
          </nav>

          <header className="pw-reader-head">
            <p className="pw-reader-eyebrow">{GUIDE.title}</p>
            <h1 className="pw-reader-title">{doc.title}</h1>
            {doc.description ? (
              <p className="pw-reader-lead">{doc.description}</p>
            ) : null}
          </header>

          <GuideBody html={doc.bodyHtml} />

          <footer className="pw-reader-foot">
            <div className="pw-reader-download">
              <div>
                <h2 className="pw-reader-download-h">
                  {COPY.downloadHeading}
                </h2>
                {/* The mockup's own line for this card, verbatim from the spec. */}
                <p className="pw-reader-download-p">{GUIDE.use}</p>
              </div>
              <PwGuideDownload
                guide={doc.file}
                className="pw-action pw-action--secondary"
              />
            </div>

            {/* A 7,500-word read ends a long way from the breadcrumb. */}
            <Link className="pw-reader-return" href={backHref}>
              <ArrowLeft className="pw-icon" aria-hidden="true" />
              {COPY.back} {page.label}
            </Link>
          </footer>
        </div>
      </div>
    </article>
  );
}

/* The four routes are thin wrappers over these two, so the gate is written
   ONCE. Four copies of an approval check is four chances for one to drift. */

type GuideParams = Promise<{ topic: string }>;

export async function guideMetadata(
  section: PwSectionSlug,
  params: GuideParams,
): Promise<Metadata> {
  const { topic } = await params;
  const profile = await getMyProfile();
  /* A caller who may not see this must not learn from the page title whether
     the slug exists, so both the unapproved and the unknown case return the
     same neutral title. */
  if (!profile?.is_approved) return { title: GUIDE.title };
  const doc = await getTopicGuide(section, topic);
  return { title: doc ? doc.title : GUIDE.title };
}

export async function PwGuidePage({
  section,
  params,
}: {
  section: PwSectionSlug;
  params: GuideParams;
}) {
  const { topic } = await params;

  /* Gate BEFORE the lookup, exactly as /elements/[slug] has since S6: a pending
     session sees the under-review notice and never a 404, so it cannot probe
     which topic slugs are real. get_platform_topics() and get_element() both
     re-check is_approved server-side underneath this. */
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PwSectionPending />;

  const doc = await getTopicGuide(section, topic);
  if (!doc) notFound();

  return <PwGuideReader doc={doc} />;
}
