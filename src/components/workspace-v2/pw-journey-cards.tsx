"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import { PLATFORM_JOURNEY } from "@/lib/workspace-v2/spec";
import { usePwToast } from "@/components/workspace-v2/pw-toast";

/* The About landing's four navigation cards (PP2 2h) — the mockup's final
   compact treatment: a square photo beside the copy, with Explore and Watch
   Video actions.

   Copy, images and focal points come from the generated spec (mockup verbatim).
   Explore is a real link into the section. Watch Video toasts "Video coming
   soon." — the mockup's own string — because platform_sections.youtube_url is
   NULL until the owner adds URLs through CMS v2 in PP6. */

const SECTION_HREF: Record<string, string> = {
  setup: "/setup",
  operate: "/operate",
  program: "/program",
  support: "/support",
};

const VIDEO_SOON = "Video coming soon.";

export function PwJourneyCards() {
  const { showToast } = usePwToast();

  return (
    <div className="pw-journey-grid">
      {PLATFORM_JOURNEY.map((item) => (
        <article className="pw-journey-card" key={item.page}>
          <span className="pw-journey-media" aria-hidden="true">
            <Image
              src={item.image}
              alt=""
              width={440}
              height={440}
              style={{ objectPosition: item.imagePosition }}
            />
          </span>
          <div className="pw-journey-copy">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <div className="pw-journey-actions">
              <Link href={SECTION_HREF[item.page]} className="pw-journey-link">
                {item.action}
                <ArrowRight className="pw-icon" aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="pw-journey-link pw-journey-video"
                onClick={() => showToast(VIDEO_SOON)}
              >
                Watch Video
                <PlayCircle className="pw-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
