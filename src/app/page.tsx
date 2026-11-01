import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Photo, PHOTO_SOURCES } from "@/components/shared/photo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/sections/home/home-hero";
import { InsideStrip } from "@/components/sections/home/inside-strip";

/* Home (/) — v3 design refresh (DR1, 2026-07-02): layout from the owner's
   reference images (docs/source-assets/design-refs/v3/); copy is the owner's
   CR1 public copy. The pre-v3 page followed
   docs/page-copy/01-public-pages/home.md + the retired mockup. */

/* This title already names the site, so it is absolute — the root layout's
   "%s · Palestine House" template would otherwise double it. Set only title +
   description + canonical here; do NOT override openGraph — a page-level
   openGraph object replaces (not deep-merges) the root's, which would drop
   og:type/og:site_name/og:locale. Inheriting it and letting Next derive
   og:title/og:description from this page is both complete and correct
   (matches every other page) — S7 Step 6 polish, fixed at the smoke-test. */
export const metadata: Metadata = {
  title: { absolute: "Palestine House - Culture, Community and Local Homes" },
  description:
    "Apply to join the Palestine House community for practical resources and connections as you build your own local cultural House.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* 1 — Hero — full-bleed tatreez photo under the transparent header */}
      <HomeHero />

      {/* 2 — Give cultural moments somewhere to continue (cream / photo split) */}
      <section className="v3-split">
        <div className="v3-split-panel">
          <Reveal>
            <p className="ph-eyebrow">A living place</p>
            <h2>Give cultural moments somewhere to continue.</h2>
            <p className="ph-lead">
              One event can bring people together. A permanent House gives those
              connections a place to grow over time.
            </p>
            <p className="v3-split-line">
              The ambition is a lasting Palestinian cultural presence in the
              life of a city: a place for artists and audiences, for memory and
              new ideas, and for people meeting one another through culture.
            </p>
            <p className="v3-split-body">
              You build that place locally. The wider community offers resources
              and opportunities to exchange experience along the way.
            </p>
          </Reveal>
        </div>
        <div className="v3-split-photo">
          <Photo
            assetId="ph-photo-arch-cafe"
            alt="An arched stone doorway opening into the warm room of a Palestine House."
            sizes="(max-width: 880px) 100vw, 55vw"
          />
        </div>
      </section>

      {/* 3 — What could happen in your House? (photo strip) */}
      <InsideStrip />

      {/* 4 — Your House. Your local decisions. / A simple way to begin — photo
          band. Film-screening (DR1-10): its dark audience texture sits under
          the copy and the glowing screen falls behind the white card — and
          unlike oud-night it doesn't repeat a recognizable marquee image on
          the same page. */}
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
            <h2>Your House. Your local decisions.</h2>
            <p>
              Your local team chooses the space, manages the finances, looks
              after the people and shapes the program. It also handles the
              permissions, safety arrangements and commitments that apply to its
              activities.
            </p>
            <p>
              The community shares tools and experience. It does not manage
              local Houses or approve their{" "}
              <span className="whitespace-nowrap">day-to-day</span> decisions.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="ph-card home-platform-card">
              <h2 className="home-platform-title">A simple way to begin</h2>
              <p>
                Apply to join the community with a short introduction to
                yourself, your city and your interest in developing a Palestine
                House.
              </p>
              <p>
                Once your community access is confirmed, sign in to the guides,
                templates and community connections. Choose the resources that
                help the next decision in front of you.
              </p>
              <p>
                You can apply while your idea is still taking shape. A finished
                venue or complete team is not needed to begin learning. Your
                application is for community access, not permission to open or
                operate a House.
              </p>
              {/* Apply button + its HQ support line removed (owner, 2026-07-21)
                  — the hero and footer CTAs carry the apply path on Home. */}
              <div className="home-platform-ctas">
                <Button asChild variant="outline">
                  <Link href="/model">Explore the Model</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
