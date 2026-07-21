import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Photo, PHOTO_SOURCES } from "@/components/shared/photo";
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

      {/* 4 — The work is real / A private platform for partners — photo band.
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
              {/* Apply button + its HQ support line removed (owner, 2026-07-21)
                  — the hero and footer CTAs carry the apply path on Home. */}
              <div className="home-platform-ctas">
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
