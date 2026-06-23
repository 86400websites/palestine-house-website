import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/sections/lead-form";
import { SITE_TAGLINE } from "@/lib/site";

/* Home (/) — copy verbatim from docs/page-copy/01-public-pages/home.md;
   layout from docs/page-designs/public/Home.app.jsx (approved mockup). */

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
    id: "PH-HIW-01",
    name: "Plan & Prepare",
    text: "the model, your city, and what running a House really takes.",
    alt: "An illustration of a person reading in the quiet study corner of the House by an arched window.",
  },
  {
    id: "PH-HIW-02",
    name: "Design & Build",
    text: "a clear 120-day launch plan, tracked task by task.",
    alt: "An illustration of hands building and preparing the House’s room, the same arched window behind them.",
  },
  {
    id: "PH-HIW-03",
    name: "Operate & Program",
    text: "run your House day to day, to the standard every House shares.",
    alt: "An illustration of the House’s room in full life, people gathered at the long table under the arched window.",
  },
] as const;

const HOME_FEELS = [
  {
    key: "cafe",
    id: "PH-FOOD-02",
    text: "A café where the recipes are here to stay.",
    alt: "A still-life illustration of knafeh and za’atar on the House’s long table in warm light.",
  },
  {
    key: "stage",
    id: "PH-LIVE-01",
    text: "A stage where the oud plays on a Friday night.",
    alt: "An illustration of a musician playing the oud on the low stage of Palestine House, an audience gathered close.",
  },
  {
    key: "room",
    id: "PH-EXP-01",
    text: "A room your city can always come back to.",
    alt: "An illustration of the café-and-stage room of Palestine House, warm and full of life.",
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
      {/* 1 — Hero — headline + CTAs left, large art right */}
      <section className="home-hero">
        <div className="ph-container home-hero-grid">
          <Reveal className="home-hero-copy">
            <h1>A fixed address for Palestinian culture, in every city.</h1>
            <div className="home-hero-ctas">
              <Button asChild size="lg">
                <Link href="/apply">
                  Apply to bring a House
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#booklet">
                  <Download aria-hidden="true" />
                  Download The House Promise (free)
                </a>
              </Button>
            </div>
          </Reveal>
          <Reveal className="home-hero-art">
            <Artwork
              assetId="PH-HOME-01"
              alt="An illustration of people gathered around a long table in the café of Palestine House, sharing a meal in warm late light."
              ratio="16 / 9"
              sizes="(max-width: 920px) 100vw, 60vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 2 — Culture deserves more than a moment (feeling cards) */}
      <section className="ph-section-lg home-feels">
        <div className="ph-container">
          <Reveal className="home-feels-head">
            <p className="ph-eyebrow">A living place</p>
            <h2>Culture deserves more than a moment.</h2>
            <p className="ph-lead">
              Pop-ups end. Hashtags scroll past. A Palestine House stays.
            </p>
          </Reveal>
          <div className="home-feels-grid">
            {HOME_FEELS.map((f, i) => (
              <Reveal key={f.key} delay={i * 0.09}>
                <article
                  data-feel={f.key}
                  className="ph-card ph-card--lift home-feel-card"
                >
                  <div className="home-feel-art">
                    <Artwork assetId={f.id} alt={f.alt} ratio="3 / 2" />
                  </div>
                  <p className="home-feel-text">{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="home-feels-close">
            <p className="home-feels-close-lead">
              It’s a real place, open every day — food, music, art, and a living
              community under one roof. Not a protest. Not a campaign. A home.
            </p>
            <p className="home-feels-close-statement">
              Palestine House is how that room gets built — and we give you
              everything you need to build it.
            </p>
          </Reveal>
        </div>
      </section>

      <PageDivider />

      {/* 3 — One path, three stages */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="home-stages-head">
            <h2>One path, three stages.</h2>
            <p className="ph-lead">
              The entire playbook is a guided path, so you always know the next
              step.
            </p>
          </Reveal>
          <div className="home-stages">
            {HOME_STAGES.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.09}>
                <article className="home-stage">
                  <Artwork assetId={s.id} alt={s.alt} ratio="4 / 5" />
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — A complete system, not a binder (proof numbers) */}
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

      {/* 5 — The work is real / A private platform for partners */}
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
                Not sure yet? Start with a free read below, or explore how it
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

      <PageDivider />

      {/* 6 — Lead-magnet capture */}
      <section className="ph-section-lg home-leadmagnet" id="booklet">
        <div className="ph-container">
          <Reveal className="home-leadmagnet-inner">
            <h2>Get The House Promise — free.</h2>
            <LeadForm single idPrefix="home-lead" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
