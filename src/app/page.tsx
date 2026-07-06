import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Photo, PHOTO_SOURCES, ART_SOURCES } from "@/components/shared/photo";
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

/* DR2-3 — stage-card copy + photo alts owner-approved (copy table, 2026-07-06) */
const HOME_STAGES = [
  {
    name: "Plan & Prepare",
    text: "We help you lay the foundation for a strong and sustainable House.",
    photo: "ph-photo-stage-plan",
    alt: "A planning studio wall of maps, sketches and tile samples for a new Palestine House.",
  },
  {
    name: "Design & Build",
    text: "We guide the creation of a beautiful, functional and welcoming space.",
    photo: "ph-photo-stage-build",
    alt: "A workshop of patterned tiles, timber and lanterns mid-build.",
  },
  {
    name: "Operate & Program",
    text: "We support you to run meaningful programs and build lasting community.",
    photo: "ph-photo-stage-cafe",
    alt: "A candlelit café room set for an evening performance.",
  },
] as const;

/* DR2-4 — label wording/casing owner-approved (copy table, 2026-07-06);
   the numbers themselves are locked proof numbers. */
const HOME_PROOF = [
  { n: "10", label: "Focus areas" },
  { n: "30", label: "Topics" },
  { n: "200+", label: "Checklist items" },
  { n: "267", label: "Templates" },
  { n: "120", label: "Day launch plan" },
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

      {/* 4 — One path, three stages (DR2-3: photo cards with moss arch-notch
          number plates + the Al-Aqsa line-art beside the grid, per the
          owner's stages-section mockup) */}
      <section className="ph-section-lg v3-stages-section">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <h2>One path, three stages.</h2>
            <p className="ph-lead">
              A replicable blueprint. Local at heart. Global in spirit.
            </p>
          </Reveal>
          <div className="v3-stages-layout">
            <div className="v3-stages">
              {HOME_STAGES.map((s, i) => (
                <Reveal key={s.name} delay={i * 0.09}>
                  <article className="v3-stage-card">
                    <div className="v3-stage-photo">
                      <Image
                        src={PHOTO_SOURCES[s.photo]}
                        alt={s.alt}
                        fill
                        sizes="(max-width: 880px) 100vw, (max-width: 1100px) 33vw, 24vw"
                      />
                    </div>
                    <div className="v3-stage-panel">
                      <span className="v3-stage-num" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3>{s.name}</h3>
                      <p>{s.text}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className="v3-stages-art" aria-hidden="true">
              <Image
                src={ART_SOURCES["ph-art-line-alaqsa"]}
                alt=""
                width={1095}
                height={1309}
                sizes="(max-width: 1100px) 0px, 30vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5 — A complete system, not a binder (DR2-4: olive proof band —
          stats over the centered caption, olive-branch ornaments clipped at
          the band edges, per the owner's proof-band mockup) */}
      {/* aria-labelledby: the caption h2 sits AFTER the stats in the DOM
          (mockup layout) — naming the section keeps screen-reader users
          oriented before the bare numbers (DR2-7 exit-gate review). */}
      <section
        className="ph-section-lg ph-section-dark ph-section-olive home-proof"
        aria-labelledby="home-proof-title"
      >
        <Image
          src={ART_SOURCES["ph-art-branch-4"]}
          alt=""
          aria-hidden="true"
          width={792}
          height={1200}
          sizes="190px"
          className="home-proof-branch home-proof-branch--left"
        />
        <Image
          src={ART_SOURCES["ph-art-branch-1"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={914}
          sizes="270px"
          className="home-proof-branch home-proof-branch--right"
        />
        {/* Mobile-only third ornament (owner, 2026-07-06 — "more olive on
            mobile"): the horizontal branch garlands the band's top-right
            padding strip; desktop (≥1001px) keeps its two-branch layout. */}
        <Image
          src={ART_SOURCES["ph-art-branch-3"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={317}
          sizes="430px"
          className="home-proof-branch home-proof-branch--top"
        />
        <Reveal className="ph-container home-proof-inner">
          <dl className="home-proof-strip">
            {HOME_PROOF.map((p) => (
              <div key={p.label} className="home-proof-item">
                <dt>{p.label}</dt>
                <dd>{p.n}</dd>
              </div>
            ))}
          </dl>
          {/* Desktop: an olive sprig flanks the caption on each side (owner,
              2026-07-06); on narrow layouts they yield to the band's three
              edge ornaments. */}
          <div className="home-proof-caption">
            <Image
              src={ART_SOURCES["ph-art-branch-3"]}
              alt=""
              aria-hidden="true"
              width={1200}
              height={317}
              sizes="140px"
              className="home-proof-caption-branch is-left"
            />
            <div className="home-proof-caption-text">
              <h2 id="home-proof-title">A complete system, not a binder.</h2>{" "}
              <p className="ph-lead">
                Everything it takes to open and run a House, in one place, with
                your progress saved as you build.
              </p>
            </div>
            <Image
              src={ART_SOURCES["ph-art-branch-3"]}
              alt=""
              aria-hidden="true"
              width={1200}
              height={317}
              sizes="140px"
              className="home-proof-caption-branch"
            />
          </div>
        </Reveal>
      </section>

      {/* 6 — The work is real / A private platform for partners — photo band.
          Film-screening (DR1-10): its dark audience texture sits under the
          copy and the glowing screen falls behind the white card — and unlike
          oud-night it doesn't repeat a recognizable marquee image on the
          same page. */}
      <section className="ph-section-lg v3-platform">
        <Image
          src={PHOTO_SOURCES["ph-photo-film-screening"]}
          alt=""
          aria-hidden="true"
          fill
          quality={70}
          sizes="100vw"
          className="v3-platform-img"
        />
        <div className="v3-platform-scrim" aria-hidden="true" />
        <div className="ph-container home-split v3-platform-inner">
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
              <p>Not sure yet? Explore how it works — no account needed.</p>
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
