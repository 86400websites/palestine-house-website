import { PLATFORM_PAGES, type PlatformPageKey } from "@/lib/workspace-v2/spec";

/* Workspace v2 page hero (PP2) — the mockup's photo band.

   The About landing uses the tall variant; the four toolkit sections use the
   shorter `internal` one. Copy (title + lead) and the photo + its focal point
   come from the generated spec, which is the mockup verbatim.

   The photo is a CSS background rather than <Image> because the mockup layers
   two gradient scrims and a tatreez strip over it via ::before/::after; the
   element is decorative and the h1 carries the meaning. */

export function PwHero({ page }: { page: PlatformPageKey }) {
  const meta = PLATFORM_PAGES[page];
  const internal = page !== "about";

  return (
    <section
      className={`pw-hero${internal ? " pw-hero--internal" : ""}`}
      style={
        {
          "--pw-hero-image": `url('${meta.heroImage}')`,
          "--pw-hero-position": meta.heroPosition,
        } as React.CSSProperties
      }
    >
      <div className="pw-hero-media" aria-hidden="true" />
      <div className="pw-container pw-hero-inner">
        <div className="pw-hero-copy">
          <h1>{meta.title}</h1>
          <p className="pw-hero-lead">{meta.lead}</p>
        </div>
      </div>
    </section>
  );
}
