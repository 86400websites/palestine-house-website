import type { Metadata } from "next";
import Link from "next/link";
import { Artwork } from "@/components/shared/artwork";
import { PageDivider } from "@/components/shared/page-divider";
import { ApplyCta } from "@/components/sections/apply-cta";
import { PageHero } from "@/components/sections/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* The Model (/model) — copy verbatim from docs/page-copy/01-public-pages/model.md;
   layout from docs/page-designs/public/TheModel.app.jsx (approved mockup). */

export const metadata: Metadata = {
  title: "The Model",
  description:
    "One name. Many Houses. One standard. How Palestine House fits together — three layers, one license, three rules that never bend.",
};

const MODEL_ROLES = [
  {
    n: "01",
    kicker: "Steward & Custodian",
    title: "Global HQ",
    text: "Owns and protects the brand, sets the standards, builds the toolkit and this platform, and holds the Aswātna relationship.",
  },
  {
    n: "02",
    kicker: "Licensee & Operator",
    title: "The Local Partner",
    text: "Brings the venue, the team, the local relationships, and the daily work of running a real business.",
  },
  {
    n: "03",
    kicker: "People & Community",
    title: "Aswātna",
    text: "The cultural-programming partner who curates the launch and keeps the creative standard high.",
  },
] as const;

const MODEL_NEVER = [
  {
    n: "01",
    title: "No politics.",
    text: "No party, no endorsement, anywhere. This is a cultural and community space.",
  },
  {
    n: "02",
    title: "HQ approves the brand.",
    text: "Brand use is approved by HQ. If an agreement ends, the branding comes down.",
  },
  {
    n: "03",
    title: "You report.",
    text: "Audit access, KPI thresholds, and minimum reporting are standard across every House.",
  },
] as const;

export default function ModelPage() {
  return (
    <>
      {/* 1 — v3 photo hero (DR1-9) */}
      <PageHero
        photo="ph-photo-model"
        alt="Hands embroidering red tatreez patterns at a workshop table."
        position="50% 55%"
        eyebrow="The Model"
        title="One name. Many Houses. One standard."
        lead="Every Palestine House is owned and run by people who know their own city. What holds the network together is a shared way of working — here’s how it fits."
        support="Every application is reviewed by HQ."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to bring a House</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <Link href="/our-support">See our support</Link>
        </Button>
      </PageHero>

      {/* 2 — A cultural embassy (feature row) */}
      <section className="ph-section-lg">
        <Reveal className="ph-container feature-row is-reverse">
          <div className="feature-row-copy">
            <p className="ph-eyebrow">What a House carries</p>
            <h2 className="model-h2">A cultural embassy, not a themed café.</h2>
            <p>
              Each House is a real café, a real venue, a real community anchor.
              It carries the weight of representing a culture — and the joy of
              it.
            </p>
            <p>
              Every plate served, every dabke night, every exhibition is a small
              act of permanence.
            </p>
          </div>
          <div className="feature-row-art">
            <Artwork
              assetId="PH-FOOD-01"
              alt="An ink-wash illustration of a platter of musakhan on the long table of a House, light from a tall window."
              ratio="4 / 5"
              sizes="(max-width: 880px) 100vw, 50vw"
            />
          </div>
        </Reveal>
      </section>

      {/* 3 — Three layers, one team (artwork section — white per owner scheme) */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <p className="ph-eyebrow">How it fits together</p>
            <h2>Three layers, one team.</h2>
            <p className="ph-lead">
              One name across the network, held up by three roles that each do
              their part — and stay in their lane.
            </p>
          </Reveal>
          <Reveal className="model-diagram-art">
            <Artwork
              assetId="PH-MODEL-02"
              alt="A line diagram of three pointed arches — Global HQ (steward & custodian), the Local Partner (licensee & operator), and Aswātna (people & community) — linked by license and support. Three layers, one mission."
              ratio="1456 / 900"
              fit="contain"
              sizes="(max-width: 960px) 100vw, 960px"
            />
          </Reveal>
          <Reveal className="editorial-cols model-roles">
            {MODEL_ROLES.map((r) => (
              <div key={r.n} className="editorial-col">
                <span className="editorial-index">{r.n}</span>
                <span className="editorial-kicker">{r.kicker}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 4 — Run under license */}
      <section className="ph-section-lg">
        <Reveal className="ph-container model-license">
          <p className="ph-eyebrow">The agreement</p>
          <p className="model-license-line">
            HQ licenses the brand to partners it has vetted.{" "}
            <span>You run your House.</span> HQ makes sure every House meets the
            same standard — so the name means the same thing in every city.
          </p>
        </Reveal>
      </section>

      <PageDivider />

      {/* 5 — What never bends */}
      <section className="ph-section-lg">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">What never bends</p>
            <h2>Three things, never negotiable.</h2>
          </Reveal>
          <Reveal className="editorial-cols">
            {MODEL_NEVER.map((r) => (
              <div key={r.n} className="editorial-col">
                <span className="editorial-index">{r.n}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 6 — What it is, and what it isn't */}
      <section className="ph-section-lg bg-muted">
        <Reveal className="ph-container statement">
          <p className="ph-eyebrow">Plainly</p>
          <h2 className="model-statement-h">What it is, and what it isn’t.</h2>
          <p className="statement-sub">
            A sustainable business built on one of the world’s great cuisines
            and most resilient cultures.
          </p>
          <ul className="model-isnt">
            <li>Not charity.</li>
            <li>Not a franchise you buy without doing the work.</li>
            <li>Not a campaign.</li>
          </ul>
          <p className="model-leads">Culture leads.</p>
          <ApplyCta secondaryHref="/our-support" secondaryLabel="See our support" />
        </Reveal>
      </section>
    </>
  );
}
