"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PLATFORM_JOURNEY } from "@/lib/workspace-v2/spec";
import { PwWatchVideo } from "@/components/workspace-v2/pw-video-player";

/* The Overview landing's four navigation cards (PP2 2h) — the mockup's final
   compact treatment: a square photo beside the copy, with Explore and Watch
   Video actions.

   Copy, images and focal points come from the spec (maintained by hand since CR1).
   Explore is a real link into the section. Watch Video plays the section's video
   on the page once the owner has pasted its link at /admin/content/pages (L1);
   until then it is the placeholder the handover asks for, "Video coming soon."
   Both states live in pw-video-player.tsx. */

const SECTION_HREF: Record<string, string> = {
  setup: "/setup",
  operate: "/operate",
  program: "/program",
  support: "/support",
};

export function PwJourneyCards({
  videoUrls,
}: {
  /* Already through safeHttpUrl at the data layer. */
  videoUrls: Record<string, string | null | undefined>;
}) {
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
              <PwWatchVideo
                url={videoUrls[item.page]}
                title={item.title}
                className="pw-journey-link pw-journey-video"
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
