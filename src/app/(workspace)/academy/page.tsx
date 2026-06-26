import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";
import { getMyProfile } from "@/lib/auth/profile";
import { getAcademyModules, getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import { Stagger } from "@/components/motion/reveal";
import type { AcademyRow } from "@/lib/workspace/types";

/* /academy — the optional video library (docs/page-copy/03-member-workspace/academy.md).
   A reference, never a course: no progress, quizzes, certificate, or "next
   lesson". One card per topic, grouped by the ten focus areas. Gated before any
   fetch. Today every module's youtube_url is null, so each card shows the
   graceful "video coming" state and links to the topic's guide instead (the
   Academy body reuses each topic's Simple Guide). When a video lands, the card
   opens it on YouTube (a normal outbound link — no embed, so no CSP change). */

export const metadata: Metadata = { title: "Videos" };

function AcademyCard({ module: m }: { module: AcademyRow }) {
  const inner = (
    <>
      <span className="vid-thumb" aria-hidden="true">
        <Play size={30} />
        {m.length && <span className="vid-runtime">{m.length}</span>}
      </span>
      <span className="vid-body">
        <span className="vid-title">{m.title}</span>
        {m.one_line && <span className="vid-line">{m.one_line}</span>}
        {m.youtube_url ? (
          <span className="vid-cta">
            <Play size={14} aria-hidden="true" /> Open this video
          </span>
        ) : (
          <span className="vid-cta is-muted">Video coming · read the guide</span>
        )}
      </span>
    </>
  );

  if (m.youtube_url) {
    return (
      <a
        className="vid-card"
        href={m.youtube_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link className="vid-card" href={`/elements/${m.element_slug}`}>
      {inner}
    </Link>
  );
}

export default async function AcademyPage() {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const [modules, elements] = await Promise.all([
    getAcademyModules(),
    getElements(),
  ]);

  const areaName = new Map<string, string>();
  for (const e of elements) areaName.set(e.focus_area_code, e.focus_area_name);

  // Group modules by focus area (the first character of the topic code),
  // preserving the catalog order get_academy_modules() already returns.
  const byArea = new Map<string, AcademyRow[]>();
  for (const m of modules) {
    const code = m.element_code[0];
    const list = byArea.get(code);
    if (list) list.push(m);
    else byArea.set(code, [m]);
  }
  const areaCodes = Array.from(byArea.keys()).sort();

  return (
    <div>
      <header className="ws-pagehead">
        <p className="ph-eyebrow">Videos</p>
        <h1 className="ws-h1">Watch, when it helps.</h1>
        <p className="ws-lead">
          Short videos that walk through the same topics as the playbook — for
          when you&rsquo;d rather watch than read. Dip in anywhere. There&rsquo;s
          nothing to complete.
        </p>
      </header>

      <section style={{ marginTop: "var(--space-10)" }}>
        <h2 className="ws-section-h" style={{ fontSize: "var(--text-lg)" }}>
          How it&rsquo;s organised
        </h2>
        <p
          style={{
            font: "var(--text-body)",
            color: "var(--muted-foreground)",
            margin: "var(--space-2) 0 0",
            maxWidth: "var(--measure)",
            textWrap: "pretty",
          }}
        >
          Videos follow the same ten focus areas and thirty topics as the rest of
          the platform. Find the topic you&rsquo;re working on; watch the video
          that goes with it.
        </p>
      </section>

      {areaCodes.map((code) => (
        <section key={code} style={{ marginTop: "var(--space-10)" }}>
          <h2 className="ws-section-h" style={{ fontSize: "var(--text-lg)" }}>
            <span className="vid-area-code">{code}</span>
            {areaName.get(code)}
          </h2>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Stagger className="vid-grid">
              {byArea.get(code)!.map((m) => (
                <AcademyCard module={m} key={m.id} />
              ))}
            </Stagger>
          </div>
        </section>
      ))}

      <p className="vid-note">
        <em>
          Videos are being added topic by topic. The written guides and templates
          are complete and ready in the meantime.
        </em>
      </p>
    </div>
  );
}
