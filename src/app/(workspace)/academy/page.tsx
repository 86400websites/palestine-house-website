import type { Metadata } from "next";
import { getMyProfile } from "@/lib/auth/profile";
import { getAcademyModules, getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import { Stagger } from "@/components/motion/reveal";
import type { AcademyRow } from "@/lib/workspace/types";
import { AcademyCard } from "./academy-card";

/* /academy — the optional video library (docs/page-copy/03-member-workspace/academy.md).
   Labelled "Videos" in the sidebar (S10). A reference, never a course: no
   progress, quizzes, certificate, or "next lesson". One card per topic, grouped
   by the ten focus areas. Gated before any fetch. Real per-topic videos aren't
   produced yet, so each card falls back to a clearly-marked neutral "Sample"
   clip (src/lib/workspace/sample-videos.ts); a real academy_modules.youtube_url
   takes priority. Cards open the video on YouTube (a normal outbound link — no
   embed, so no CSP change). */

export const metadata: Metadata = { title: "Videos" };

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
          The clips marked &ldquo;Sample&rdquo; are placeholders while each
          topic&rsquo;s own video is produced. The written guides and templates
          are complete and ready now.
        </em>
      </p>
    </div>
  );
}
