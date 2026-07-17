import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Photo, PHOTO_SOURCES, ART_SOURCES } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/sections/home/home-hero";
import { InsideStrip } from "@/components/sections/home/inside-strip";
import { StageCards } from "@/components/sections/stage-cards";
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

/* Labels owner-approved (copy overhaul, 2026-07-17); the numbers themselves
   are locked proof numbers and never change. */
const HOME_PROOF = [
  { n: "10", label: "Focus areas" },
  { n: "30", label: "Core topics" },
  { n: "200+", label: "Checklist actions" },
  { n: "267", label: "Ready-to-use templates" },
  { n: "120", label: "Day guided launch plan" },
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
              Palestinian culture is too rich to exist only through occasional
              events, temporary pop-ups, or moments of attention. We are
              building a global network of permanent Palestine Houses: living
              cultural homes that nourish identity, support creativity, and
              bring communities together.
            </p>
            <p className="v3-split-line">
              A pop-up ends. A post disappears. A Palestine House stays.
            </p>
            <p className="v3-split-body">
              It is a real place, open throughout the year: a café, a venue, and
              a home for culture and community under one roof.
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
          owner's stages-section mockup; cards extracted to the shared
          StageCards in DR2.1-4 — /bring-ph renders the same cards) */}
      <section className="ph-section-lg v3-stages-section">
        <div className="ph-container">
          <Reveal className="sec-head is-center">
            <h2>One path. Three clear stages.</h2>
            <p className="ph-lead">
              The Palestine House system guides you from your first idea to
              opening day and supports you as the House grows.
            </p>
          </Reveal>
          <div className="v3-stages-layout">
            <StageCards sizes="(max-width: 880px) 100vw, (max-width: 1100px) 33vw, 24vw" />
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
        {/* Mobile-only bookends (owner, 2026-07-06): the small olive sprig
            sits once at the top of the band and once, mirrored, at the very
            bottom — the desktop corner branches are hidden on mobile. */}
        <Image
          src={ART_SOURCES["ph-art-branch-3"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={317}
          sizes="240px"
          className="home-proof-branch home-proof-branch--m-top"
        />
        <Image
          src={ART_SOURCES["ph-art-branch-3"]}
          alt=""
          aria-hidden="true"
          width={1200}
          height={317}
          sizes="240px"
          className="home-proof-branch home-proof-branch--m-bottom"
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
          {/* The caption is a single centered serif line (owner, 2026-07-06 —
              the desktop flanking sprigs were removed). */}
          <div className="home-proof-caption">
            <div className="home-proof-caption-text">
              <h2 id="home-proof-title">
                Everything you need, in one connected system.
              </h2>{" "}
              <p className="ph-lead">
                From planning and permissions to staffing, programming, finance,
                and launch, everything is organised in one place with your
                progress saved as you build.
              </p>
            </div>
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
              Every House must be financially responsible, professionally run,
              and rooted in the same shared standards.
            </p>
            <p>
              But a Palestine House should never feel corporate or distant. It
              should carry the warmth, generosity, and hospitality of a
              Palestinian home.
            </p>
            <p>
              A serious cultural business. A welcoming community space. A
              permanent home built to last.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="ph-card home-platform-card">
              <h2 className="home-platform-title">
                The full system opens to approved partners.
              </h2>
              <p>
                You can explore the Palestine House model freely and learn what
                it takes to bring one to your city.
              </p>
              <p>
                When you are ready, submit an application. Every application is
                reviewed by HQ to make sure the model, location, and partnership
                are a strong fit.
              </p>
              <p>
                Once approved, you receive access to the complete playbook,
                toolkit, templates, training, and partner platform.
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
