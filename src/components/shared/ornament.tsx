import Image from "next/image";
import { ART_SOURCES } from "@/components/shared/photo";

/* Bring-a-House editorial ornaments (DR — bring-ph redesign).
   Server-safe inline SVG marks, colored by `currentColor` so each call site
   just sets `color`. The star reproduces the Palestine House "khatam" seal
   (rounded 8-point star) from the owner's star-logo + mockups; olive branches
   reuse the gold line-art branch shared with /model. All decorative. */

type MarkProps = { className?: string };

/* One rounded 8-point khatam star (concave, curved sides) — the outer seal
   shape. Used single inside the §5 medallions (framing the numeral). */
const STAR_PATH =
  "M12 1 Q14.49 6 19.78 4.22 Q18 9.51 23 12 Q18 14.49 19.78 19.78 Q14.49 18 12 23 Q9.51 18 4.22 19.78 Q6 14.49 1 12 Q6 9.51 4.22 4.22 Q9.51 6 12 1 Z";

export function StarMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} />
    </svg>
  );
}

/* The full seal: the rounded 8-point star with a smaller concentric star
   rotated 22.5° inside it — the star-logo mark. Section-head ornaments,
   "We bring", and the §7 wordmark lockup use this. */
export function SealMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} />
      <path
        d={STAR_PATH}
        transform="translate(12 12) rotate(22.5) scale(0.52) translate(-12 -12)"
      />
    </svg>
  );
}

/* Four-point sparkle (✦) — list bullets, divider centers, connector marks,
   and the small diamond that floats outside the §7 arch. */
export function SparkMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2 C 12.7 8, 16 11.3, 22 12 C 16 12.7, 12.7 16, 12 22 C 11.3 16, 8 12.7, 2 12 C 8 11.3, 11.3 8, 12 2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Gold line-art olive branch (the /model "What a House carries" branch),
   reused for every olive on the page. `flip` mirrors it for the left flank. */
export function OliveBranch({
  className,
  flip,
}: MarkProps & { flip?: boolean }) {
  return (
    <Image
      src={ART_SOURCES["ph-art-model-branch"]}
      alt=""
      aria-hidden="true"
      width={900}
      height={659}
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}
