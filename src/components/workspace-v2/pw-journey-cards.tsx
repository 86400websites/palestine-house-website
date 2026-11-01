"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import { PLATFORM_JOURNEY } from "@/lib/workspace-v2/spec";
import { usePwToast } from "@/components/workspace-v2/pw-toast";

/* The Overview landing's four navigation cards (PP2 2h) — the mockup's final
   compact treatment: a square photo beside the copy, with Explore and Watch
   Video actions.

   Copy, images and focal points come from the spec (maintained by hand since CR1).
   Explore is a real link into the section. Watch Video opens the section's video
   once the owner has pasted its link at /admin/content/pages. Until then it is the
   placeholder the handover asks for, the action disabled with a clear message:
   "Video coming soon." is the mockup's own string. aria-disabled, not disabled, so
   the message can still be reached by keyboard and by pointer. */

const SECTION_HREF: Record<string, string> = {
  setup: "/setup",
  operate: "/operate",
  program: "/program",
  support: "/support",
};

const VIDEO_SOON = "Video coming soon.";

export function PwJourneyCards({
  videoUrls,
}: {
  /* Already through safeHttpUrl at the data layer. */
  videoUrls: Record<string, string | null | undefined>;
}) {
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
              {videoUrls[item.page] ? (
                <a
                  className="pw-journey-link pw-journey-video"
                  href={videoUrls[item.page] as string}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch Video
                  <PlayCircle className="pw-icon" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  className="pw-journey-link pw-journey-video"
                  aria-disabled="true"
                  aria-label={`Watch Video. ${VIDEO_SOON}`}
                  title={VIDEO_SOON}
                  onClick={() => showToast(VIDEO_SOON)}
                >
                  Watch Video
                  <PlayCircle className="pw-icon" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
