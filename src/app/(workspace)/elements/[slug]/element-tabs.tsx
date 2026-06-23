"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Compass,
  Download,
  FileText,
  Info,
  ListChecks,
  Play,
  Square,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/app/(workspace)/resources/resource-library";

/* Client tab shell for the element page. It owns ONLY the tab state + panel
   switching and the secondary actions; all body content is server-rendered +
   sanitized and arrives as serializable props (no Supabase client, no secret).
   The interactive saved-progress checklist + the "Add to Design & Build"
   action land with /build (S6 Step 2); here the checklist is read-only and the
   cross-page links (Build / Operate / Resources / Plan) are inert text until
   those routes ship in later sub-steps. */

export type ElementTabsData = {
  overviewHtml: string;
  simpleGuideHtml: string;
  watchOutHtml: string; // "" when the source body is empty
  checklistGroups: {
    label: string;
    items: { id: string; text: string; requiredDocument: string | null }[];
  }[];
  checklistCount: number;
  templates: { id: string; title: string; type: string; version: string | null }[];
  templatesCount: number;
  video: { length: string | null; youtubeUrl: string | null } | null;
  focusAreaCode: string;
  focusAreaName: string;
  nextSlug: string | null;
  nextTitle: string | null;
};

const TABS = [
  { value: "overview", label: "Overview", Icon: BookOpen },
  { value: "guide", label: "Simple Guide", Icon: Compass },
  { value: "checklist", label: "Checklist", Icon: ListChecks },
  { value: "watch", label: "Watch Out For", Icon: AlertTriangle },
  { value: "video", label: "Video", Icon: Play },
  { value: "templates", label: "Templates", Icon: FileText },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const TEMPLATE_TYPE_LABEL: Record<string, string> = {
  form: "Form",
  script: "Script",
  log: "Log",
  report: "Report",
  approval: "Approval",
  guide: "Guide",
  booklet: "Booklet",
};

/* Section banner — opens each content tab with an icon + title + intro. The
   icon panel doubles as the slot for a per-section illustration later (same
   across all 30 topics). */
function SectionBanner({
  Icon,
  title,
  intro,
}: {
  Icon: LucideIcon;
  title: string;
  intro: string;
}) {
  return (
    <div className="ws-section-banner">
      <span className="ws-section-banner-art" aria-hidden="true">
        <Icon size={26} />
      </span>
      <div className="ws-section-banner-text">
        <h2 className="ws-section-banner-title">{title}</h2>
        <p className="ws-section-banner-intro">{intro}</p>
      </div>
    </div>
  );
}

export function ElementTabs({ data }: { data: ElementTabsData }) {
  const [tab, setTab] = React.useState<TabValue>("overview");
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA APG tablist keyboard support: arrows move + select, focus follows.
  function onTabKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = TABS.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setTab(TABS[next].value);
    tabRefs.current[next]?.focus();
  }

  const badge = (v: TabValue): number | null =>
    v === "checklist"
      ? data.checklistCount
      : v === "templates"
        ? data.templatesCount
        : null;

  return (
    <>
      <div className="ws-actionbar">
        <Button variant="secondary" size="sm" onClick={() => setTab("video")}>
          <Play size={16} aria-hidden="true" /> Watch the video
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTab("templates")}
        >
          <Download size={16} aria-hidden="true" /> View templates
        </Button>
        <span className="ws-actionbar-meta">
          {data.checklistCount} checklist{" "}
          {data.checklistCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div
        className="ws-tabs"
        role="tablist"
        aria-label="Topic sections"
        style={{ marginTop: "var(--space-8)" }}
      >
        {TABS.map((t, index) => {
          const count = badge(t.value);
          const active = tab === t.value;
          const { Icon } = t;
          return (
            <button
              key={t.value}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.value}`}
              aria-selected={active}
              aria-controls={`panel-${t.value}`}
              tabIndex={active ? 0 : -1}
              className={`ws-tab${active ? " is-active" : ""}`}
              onClick={() => setTab(t.value)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
            >
              <Icon size={15} aria-hidden="true" />
              {t.label}
              {count !== null && <span className="ws-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      <div
        className="ws-tabpanel"
        role="tabpanel"
        key={tab}
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "overview" && (
          <>
            <SectionBanner
              Icon={BookOpen}
              title="Overview"
              intro="What this is, and why it matters."
            />
            <div className="ws-readingcard">
              <div
                className="ws-prose"
                dangerouslySetInnerHTML={{ __html: data.overviewHtml }}
              />
            </div>
          </>
        )}

        {tab === "guide" && (
          <>
            <SectionBanner
              Icon={Compass}
              title="Simple Guide"
              intro="A plain walk-through of how to put this into practice."
            />
            <div className="ws-readingcard">
              <div
                className="ws-prose"
                dangerouslySetInnerHTML={{ __html: data.simpleGuideHtml }}
              />
            </div>
          </>
        )}

        {tab === "checklist" && (
          <>
            <SectionBanner
              Icon={ListChecks}
              title="Checklist"
              intro="The operational items that feed your Design & Build tracker."
            />
            {data.checklistGroups.length === 0 ? (
              <p className="ws-intro">No checklist items for this topic yet.</p>
            ) : (
              data.checklistGroups.map((group) => (
                <div className="ws-checkgroup" key={group.label}>
                  {group.label && (
                    <p className="ws-checkgroup-label">{group.label}</p>
                  )}
                  <div className="ws-rows">
                    {group.items.map((item) => (
                      <div className="ws-checkrow" key={item.id}>
                        <span className="ws-checkrow-box" aria-hidden="true">
                          <Square size={18} />
                        </span>
                        <div className="ws-checkrow-body">
                          <p className="ws-checkrow-text">{item.text}</p>
                          {item.requiredDocument && (
                            <p className="ws-checkrow-meta">
                              Document: {item.requiredDocument}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "watch" && (
          <>
            <SectionBanner
              Icon={AlertTriangle}
              title="Watch Out For"
              intro="Common mistakes and red flags to avoid."
            />
            {data.watchOutHtml ? (
              <div className="ws-readingcard">
                <div
                  className="ws-prose"
                  dangerouslySetInnerHTML={{ __html: data.watchOutHtml }}
                />
              </div>
            ) : (
              <div className="ws-placeholder" role="note">
                <span
                  style={{
                    display: "inline-flex",
                    flexShrink: 0,
                    marginTop: 1,
                    color: "var(--status-warning)",
                  }}
                >
                  <Info size={18} aria-hidden="true" />
                </span>
                <span>
                  We&rsquo;re still writing this one. For now, the Simple Guide
                  and Checklist cover what you need.
                </span>
              </div>
            )}
          </>
        )}

        {tab === "video" &&
          (data.video?.youtubeUrl ? (
            <div className="ws-empty">
              <span className="ws-empty-icon">
                <Play size={22} aria-hidden="true" />
              </span>
              <p className="ws-empty-text">
                Watch this topic&rsquo;s Academy video
                {data.video.length ? ` (${data.video.length})` : ""}.
              </p>
              <Button asChild variant="secondary" size="sm">
                <a
                  href={data.video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch on YouTube
                </a>
              </Button>
            </div>
          ) : (
            <div className="ws-empty">
              <span className="ws-empty-icon">
                <Play size={22} aria-hidden="true" />
              </span>
              <p className="ws-empty-text">
                Video&rsquo;s coming — the full guide is in Simple Guide.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setTab("guide")}>
                Open Simple Guide
              </Button>
            </div>
          ))}

        {tab === "templates" && (
          <>
            <SectionBanner
              Icon={FileText}
              title="Templates"
              intro="Ready-to-use documents for this topic — download any you need."
            />
            {data.templates.length === 0 ? (
              <p className="ws-intro">
                Templates for this topic will appear here.
              </p>
            ) : (
              <div className="ws-rows">
                {data.templates.map((t) => (
                  <div className="ws-templaterow" key={t.id}>
                    <span className="ws-templaterow-icon" aria-hidden="true">
                      <FileText size={18} />
                    </span>
                    <div className="ws-templaterow-body">
                      <p className="ws-templaterow-title">{t.title}</p>
                      <p className="ws-templaterow-meta">
                        {TEMPLATE_TYPE_LABEL[t.type] ?? t.type}
                        {t.version ? ` · ${t.version}` : ""}
                      </p>
                    </div>
                    <DownloadButton resourceId={t.id} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: "var(--space-12)" }}>
        <p className="ws-help">
          <span className="ws-help-icon">
            <Info size={17} aria-hidden="true" />
          </span>
          <span>
            Part of{" "}
            <strong>
              Focus Area {data.focusAreaCode} — {data.focusAreaName}
            </strong>
            . See it in context in <strong>Build</strong> /{" "}
            <strong>Operate</strong>.
          </span>
        </p>
      </div>

      {data.nextSlug && (
        <Link className="ws-nexttopic" href={`/elements/${data.nextSlug}`}>
          <span className="ws-nexttopic-body">
            <span className="ws-nexttopic-eyebrow">Next topic</span>
            <span className="ws-nexttopic-title">{data.nextTitle}</span>
          </span>
          <span className="ws-nexttopic-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </span>
        </Link>
      )}
    </>
  );
}
