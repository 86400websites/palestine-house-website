import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { PHOTO_SOURCES } from "@/components/shared/photo";

/* "One path, three stages" photo cards — moss panels with arch-notch number
   plates (DR2-3 Home build; extracted to a shared section in DR2.1-4 so
   /bring-ph renders the same cards). Cards only: the Al-Aqsa line-art beside
   Home's grid stays a Home-side flourish. Copy + photo alts are the
   owner-approved DR2 copy table (2026-07-06), shared verbatim by both pages
   (DR2.1-4 copy gate). */
const STAGES = [
  {
    name: "Plan & Prepare",
    text: "We help you lay the foundation for a strong and sustainable House.",
    photo: "ph-photo-stage-plan",
    alt: "A planning studio wall of maps, sketches and tile samples for a new Palestine House.",
  },
  {
    name: "Design & Build",
    text: "We guide the creation of a beautiful, functional and welcoming space.",
    photo: "ph-photo-stage-build",
    alt: "A workshop of patterned tiles, timber and lanterns mid-build.",
  },
  {
    name: "Operate & Program",
    text: "We support you to run meaningful programs and build lasting community.",
    photo: "ph-photo-stage-cafe",
    alt: "A candlelit café room set for an evening performance.",
  },
] as const;

type StageCardsProps = {
  /** next/image sizes for the card photos — set per host layout (Home's grid
   *  shares its row with the line-art column; bring-ph runs full-width). */
  sizes: string;
};

export function StageCards({ sizes }: StageCardsProps) {
  return (
    <div className="v3-stages">
      {STAGES.map((s, i) => (
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
              <p>{s.text}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
