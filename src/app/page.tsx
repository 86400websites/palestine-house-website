import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/sections/home/home-hero";
import { InsideStrip } from "@/components/sections/home/inside-strip";
import { SITE_TAGLINE } from "@/lib/site";

/* Home (/) — v3 design refresh (DR1, 2026-07-02): layout + hero/split copy
   from the owner's reference images (docs/source-assets/design-refs/v3/);
   the retained sections keep their locked copy verbatim. The pre-v3 page
   followed docs/page-copy/01-public-pages/home.md + the retired mockup. */

/* The root layout's title.default already resolves the home title to
   "Palestine House". Set only description + canonical here; do NOT override
   openGraph — a page-level openGraph object replaces (not deep-merges) the
   root's, which would drop og:type/og:site_name/og:locale. Inheriting it and
   letting Next derive og:title/og:description from this page is both complete
   and correct (matches every other page) — S7 Step 6 polish, fixed at the
   smoke-test. */
export const metadata: Metadata = {
  description: SITE_TAGLINE,
  alternates: { canonical: "/" },
};

const HOME_STAGES = [
  {
    name: "Plan & Prepare",
    text: "the model, your city, and what running a House really takes.",
  },
  {
    name: "Design & Build",
    text: "a clear 120-day launch plan, tracked task by task.",
  },
  {
    name: "Operate & Program",
    text: "run your House day to day, to the standard every House shares.",
  },
] as const;

const HOME_PROOF = [
  { n: "10", label: "focus areas" },
  { n: "30", label: "topics" },
  { n: "200+", label: "checklist items" },
  { n: "267", label: "templates" },
  { n: "120", label: "day launch" },
] as const;


export default function HomePage() {
  return (
    <>
      {/* 1 — Hero — full-bleed tatreez photo under the transparent header */}
      <HomeHero />

      {/* 2 — Culture deserves more than a moment (cream / photo split) */}
      <section className="v3-split">
        <div className="v3-split-panel">
          <Reveal>
            <p className="ph-eyebrow">A living place</p>
            <h2>Culture deserves more than a moment.</h2>
            <p className="ph-lead">
              We are building a global network of Palestine Houses—permanent
              cultural homes that nourish identity, celebrate creativity, and
              strengthen communities.
            </p>
            <p className="v3-split-line">
              Pop-ups end. Hashtags scroll past. A Palestine House stays.
            </p>
            <p className="v3-split-body">
              It’s a real place, open every day — food, music, art, and a
              living community under one roof. Not a protest. Not a campaign.
              A home.
            </p>
          </Reveal>
        </div>
        <div className="v3-split-photo">
          <Photo
            assetId="ph-photo-arch-cafe"
            alt="An arched stone doorway opening into the warm café room of a Palestine House."
            sizes="(max-width: 880px) 100vw, 55vw"
          />
        </div>
      </section>

      {/* 3 — Inside a Palestine House (photo strip) */}
      <InsideStrip />

      {/* 4 — One path, three stages (editorial columns, copper numerals) */}
      <section className="ph-section-lg v3-stages-section">
        <div className="ph-container">
          <Reveal className="sec-head">
            <h2>One path, three stages.</h2>
            <p className="ph-lead">
              The entire playbook is a guided path, so you always know the next
              step.
            </p>
          </Reveal>
          <div className="v3-stages">
            {HOME_STAGES.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.09}>
                <article className="v3-stage">
                  <span className="v3-stage-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — A complete system, not a binder (proof numbers) */}
      <section className="ph-section-lg ph-section-dark home-proof">
        <Reveal className="ph-container home-proof-inner">
          <div className="home-proof-head">
            <h2>A complete system, not a binder.</h2>
            <p className="ph-lead">
              Everything it takes to open and run a House, in one place, with
              your progress saved as you build.
            </p>
          </div>
          <dl className="home-proof-strip">
            {HOME_PROOF.map((p) => (
              <div key={p.label} className="home-proof-item">
                <dt>{p.label}</dt>
                <dd>{p.n}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* 6 — The work is real / A private platform for partners */}
      <section className="ph-section-lg">
        <div className="ph-container home-split">
          <Reveal className="home-split-copy">
            <h2>The work is real. So is the welcome.</h2>
            <p>
              Every checklist and template carries the same standards used
              across the network. A serious business that also carries real
              cultural weight.
            </p>
            <p>
              It isn’t charity. It isn’t a franchise you buy and forget. It’s a
              House you build — and then keep.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="ph-card home-platform-card">
              <h2 className="home-platform-title">
                A private platform for partners.
              </h2>
              <p>
                Palestine House isn’t open to the public — it’s built for the
                people opening Houses. You apply, HQ reviews every application,
                and once you’re approved the full playbook, the toolkit, and the
                Academy open to you.
              </p>
              <p>
                Not sure yet? Start with a free read, or explore how it
                works — no account needed.
              </p>
              <div className="home-platform-ctas">
                <div>
                  <Button asChild>
                    <Link href="/apply">
                      Apply to bring a House
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                  <p className="home-cta-support">
                    Every application is reviewed by HQ.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/model">Explore the model</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
