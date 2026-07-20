import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* Three-stages photo cards — moss panels with arch-notch number plates
   (DR2-3 Home build; extracted to a shared section in DR2.1-4). /bring-ph §4
   is the sole consumer since Home's stages section was removed (owner dedupe,
   2026-07-20) — Home's default copy left with it, so the copy is a required
   prop. */
export type StageCopy = {
  name: string;
  /** optional bold lead line above the description (/bring-ph) */
  lead?: string;
  text: string;
  photo: PhotoId;
  alt: string;
};

type StageCardsProps = {
  /** next/image sizes for the card photos — set per host layout (the grid
   *  shares its row with the Al-Aqsa line-art column ≥1100px). */
  sizes: string;
  stages: readonly StageCopy[];
};

export function StageCards({ sizes, stages }: StageCardsProps) {
  return (
    <div className="v3-stages">
      {stages.map((s, i) => (
        <Reveal key={s.name} delay={i * 0.09}>
          <article className="v3-stage-card">
            <div className="v3-stage-photo">
              <Image src={PHOTO_SOURCES[s.photo]} alt={s.alt} fill sizes={sizes} />
            </div>
            <div className="v3-stage-panel">
              <span className="v3-stage-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{s.name}</h3>
              {s.lead ? <p className="v3-stage-lead">{s.lead}</p> : null}
              <p>{s.text}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
