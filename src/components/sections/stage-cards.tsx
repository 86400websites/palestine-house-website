import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { PHOTO_SOURCES, type PhotoId } from "@/components/shared/photo";

/* "One path, three stages" photo cards — moss panels with arch-notch number
   plates (DR2-3 Home build; extracted to a shared section in DR2.1-4 so
   /bring-ph renders the same cards). Cards only: the Al-Aqsa line-art beside
   Home's grid stays a Home-side flourish.

   Copy overhaul (2026-07-17): the two pages now carry different stage copy, so
   the copy is a prop. The default below is Home's copy; /bring-ph passes its
   own fuller set (with an optional bold lead line per stage). */
export type StageCopy = {
  name: string;
  /** optional bold lead line above the description (/bring-ph) */
  lead?: string;
  text: string;
  photo: PhotoId;
  alt: string;
};

const STAGES: readonly StageCopy[] = [
  {
    name: "Plan & Prepare",
    text: "Understand the model, assess your city, build your team, and prepare a viable plan.",
    photo: "ph-photo-stage-plan",
    alt: "A planning studio wall of maps, sketches and tile samples for a new Palestine House.",
  },
  {
    name: "Design & Build",
    text: "Shape the space, secure suppliers and permissions, and follow a clear 120-day launch programme.",
    photo: "ph-photo-stage-build",
    alt: "A workshop of patterned tiles, timber and lanterns mid-build.",
  },
  {
    name: "Operate & Program",
    text: "Run the café, venue, team, finances, and cultural programme to the shared Palestine House standard.",
    photo: "ph-photo-stage-cafe",
    alt: "A candlelit café room set for an evening performance.",
  },
];

type StageCardsProps = {
  /** next/image sizes for the card photos — set per host layout (Home's grid
   *  shares its row with the line-art column; bring-ph runs full-width). */
  sizes: string;
  /** copy override — defaults to Home's stage copy */
  stages?: readonly StageCopy[];
};

export function StageCards({ sizes, stages = STAGES }: StageCardsProps) {
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
