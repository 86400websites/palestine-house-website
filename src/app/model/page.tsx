import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CircleCheck,
  CircleX,
  Handshake,
  House,
  Key,
  ShieldCheck,
} from "lucide-react";
import { ART_SOURCES, Photo } from "@/components/shared/photo";
import { PageDivider } from "@/components/shared/page-divider";
import { PageHero } from "@/components/sections/page-hero";
import { EmbassyGallery } from "@/components/sections/model/embassy-gallery";
import { FadeIn, Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/* The Model (/model) — CR1 content refresh 2026-10-30 (owner's Public Website
   Copy §3 + §12); v3 layout retained from the DR3.1 rebuild. */

export const metadata: Metadata = {
  title: { absolute: "The Model - Palestine House" },
  description:
    "Independent local Houses, shared cultural purpose, and community resources that support local decisions.",
};

const MODEL_NEVER = [
  {
    n: "01",
    title: "Cultural independence",
    text: "Make room for Palestinian voices, creativity, heritage and contemporary life with dignity and care. Welcome conversation, learning and artistic expression without turning the House into an endorsement platform for political parties or electoral candidates.",
    tone: "olive",
  },
  {
    n: "02",
    title: "Respectful identity",
    text: "Use names, logos, artwork and other shared materials within the permissions that apply. Present your local House clearly and do not imply authority to speak for every House.",
    tone: "terra",
  },
  {
    n: "03",
    title: "Responsible local practice",
    text: "Look after people, meet local commitments and keep the records your own operation needs. Shared learning is voluntary; local accountability remains real. Your own funders, contracts and local authorities may have requirements separate from community participation.",
    tone: "terra",
  },
] as const;

const MODEL_IS = [
  "A lasting local home for Palestinian culture.",
  "A welcoming place for artists, audiences and community.",
  "A venue for a cultural program shaped by its local team.",
  "An independently run local operation with real responsibilities.",
  "A place that can learn from and contribute to a wider community.",
] as const;

const MODEL_ISNOT = [
  "A branch office run by the community.",
  "A centrally assigned program or compulsory partnership.",
  "A guarantee of funding, staff, artists or specialist advice.",
  "A shortcut around local permissions or asset-use rights.",
  "A requirement to complete every resource before asking a question.",
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
        title="Independent Houses. Shared cultural purpose."
        lead="Every Palestine House is shaped by the people who build and run it locally. The community connects those people through practical resources, shared learning and a commitment to Palestinian culture, hospitality and belonging."
        support="Apply for community access, not permission to operate a House."
      >
        <Button asChild size="lg" className="v3-cta">
          <Link href="/apply">Apply to Join</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="v3-cta">
          <Link href="/our-support">Explore the Community</Link>
        </Button>
      </PageHero>

      {/* 2 — A cultural home (café · venue · community collage) */}
      <section className="ph-section-lg model-embassy">
        <div className="ph-container model-embassy-grid">
          <Reveal className="model-embassy-copy">
            <p className="ph-eyebrow">What a House carries</p>
            <svg
              className="model-embassy-star"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 1.5l1.9 6.3 6.3-1.9-4.5 4.6 4.5 4.6-6.3-1.9L12 22.5l-1.9-6.3-6.3 1.9 4.5-4.6-4.5-4.6 6.3 1.9z"
                fill="currentColor"
              />
            </svg>
            <h2 className="model-h2">
              A cultural home, <em>shaped by the people around it.</em>
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative fixed-size flourish */}
            <img
              className="model-embassy-sprig"
              src={ART_SOURCES["ph-art-model-branch"]}
              alt=""
              aria-hidden="true"
            />
            <p className="model-embassy-lead">
              A House is a lasting cultural home, not simply a name on a venue.
              Its purpose is visible in the program, the welcome, the
              relationships and the way Palestinian stories and creativity are
              shared.
            </p>
            <p className="model-embassy-lead">
              It can bring together cultural activities, everyday gathering and
              food or hospitality where those fit the local model. The size and
              mix will vary. The aim is a place that can serve its city over
              time.
            </p>
          </Reveal>
          <FadeIn className="model-embassy-gallery">
            <EmbassyGallery />
          </FadeIn>
        </div>
      </section>

      {/* 3 — Your local House, the community, direct collaborators (the arches) */}
      <section className="ph-section-lg model-network">
        <div className="ph-container">
          <Reveal className="sec-head">
            <p className="ph-eyebrow">HOW THE COMMUNITY WORKS</p>
            <h2>
              Local ownership. Resources to share. <br />
              People to learn from.
            </h2>
            <p className="ph-lead">
              You build and run your House locally. The community brings
              practical resources together and gives members opportunities to
              exchange experience. Collaborations happen directly between the
              people who choose to take part.
            </p>
          </Reveal>
          <Reveal className="model-arches">
            <div className="model-arch model-arch--green">
              <Key className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">Your local House</h3>
              <p className="model-arch-role">Your team. Your decisions.</p>
              <p className="model-arch-text">
                Your local team is responsible for the venue, people, finances,
                program and local relationships. It arranges the relevant
                permissions, contracts, safety measures and professional advice
                for its circumstances.
              </p>
            </div>
            <div className="model-arch model-arch--cream">
              <House className="model-arch-icon" aria-hidden="true" />
              <h3 className="model-arch-title">The community</h3>
              <p className="model-arch-role">Shared resources and experience.</p>
              <p className="model-arch-text">
                Guides explain practical decisions. Editable templates help you
                avoid starting from a blank page. Members may share experience,
                ideas or introductions when they are able to help. The community
                does not manage your House or require routine progress reports.
              </p>
            </div>
            <div className="model-arch model-arch--terra">
              {/* decorative olive branch; fixed height keeps the card text in place */}
              <Image
                className="model-arch-seal"
                src={ART_SOURCES["ph-art-branch-2"]}
                alt=""
                aria-hidden="true"
                width={1106}
                height={1131}
                sizes="46px"
                style={{ width: "auto", height: 42 }}
              />
              <h3 className="model-arch-title">Direct collaborators</h3>
              <p className="model-arch-role">Useful connections, agreed together.</p>
              <p className="model-arch-text">
                Choose the collaborators who fit your House. Aswātna is one
                optional provider of cultural programming and events; you may
                also work with your own team, independent artists or other
                providers. Agree scope, fees, availability and responsibilities
                directly.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 — Local ownership (dark moss band) */}
      <section className="model-promise">
        <div className="ph-container model-promise-grid">
          <Reveal className="model-promise-head">
            <p className="ph-eyebrow">LOCAL OWNERSHIP</p>
            <h2 className="model-promise-h">
              Community access is one step. <br />
              Operating a House is another.
            </h2>
            <p className="model-promise-lead">
              Applying to join the community is how you request access to the
              private resources and connections. It is not an operating licence
              or venue approval.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative branch */}
            <img
              className="model-promise-branch"
              src={ART_SOURCES["ph-art-model-branch"]}
              alt=""
              aria-hidden="true"
            />
          </Reveal>
          <Reveal className="model-promise-cols">
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <Handshake aria-hidden="true" />
              </span>
              <p>
                Your local team handles the practical arrangements for its own
                House. It checks the usage terms for any names, logos, artwork
                or other protected materials it plans to use.
              </p>
            </div>
            <div className="model-promise-col">
              <span className="model-promise-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <p>
                Use the resources that fit your next step. You do not need to
                complete the whole toolkit or submit routine progress reports to
                the community.
              </p>
            </div>
          </Reveal>
        </div>
        {/* The doc's emphasized line closes the band rather than sitting as a
            third peer column. */}
        <Reveal className="ph-container model-promise-close">
          <p className="model-promise-principle">
            Local ownership. Shared learning. Cultural integrity.
          </p>
        </Reveal>
      </section>

      <PageDivider />

      {/* 5 — Shared principles */}
      <section className="ph-section-lg">
        <Reveal className="ph-container">
          <p className="ph-eyebrow">Shared principles</p>
          <div className="model-never-cards">
            {MODEL_NEVER.map((r) => (
              <div key={r.n} className="model-never-card">
                <span className="model-never-num">{r.n}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <span className={`model-never-rule is-${r.tone}`} aria-hidden="true" />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 6 — A cultural home built to last (what it is / what it is
          not) + the closing still life (copy overhaul 2026-07-17; the
          "Culture leads" lockup + reciprocity pair were removed as repeated
          copy — owner dedupe, 2026-07-20) */}
      <section className="ph-section-lg bg-muted model-plainly">
        <Reveal className="ph-container model-plainly-layout">
          <div className="model-plainly-main">
            <p className="ph-eyebrow">What it is</p>
            <h2 className="model-plainly-title">
              A cultural home built to last.
            </h2>
            <div className="model-plainly-grid">
              <div className="model-plainly-col">
                <p className="model-plainly-head is-olive">A Palestine House is:</p>
                <ul className="model-is">
                  {MODEL_IS.map((t) => (
                    <li key={t}>
                      <CircleCheck aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="model-plainly-col">
                <p className="model-plainly-head is-terra">It is not:</p>
                <ul className="model-isnot">
                  {MODEL_ISNOT.map((t) => (
                    <li key={t}>
                      <CircleX aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <aside className="model-plainly-aside">
            <Photo
              assetId="ph-photo-model-culture"
              alt="A cup of Palestinian coffee and a decorated vase on an embroidered tatreez cloth."
              sizes="(max-width: 880px) 100vw, 32vw"
              className="model-plainly-photo"
            />
          </aside>
        </Reveal>
      </section>
    </>
  );
}
