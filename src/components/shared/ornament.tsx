/* Bring-a-House editorial ornaments (DR — bring-ph redesign).
   Server-safe inline SVG marks, colored by `currentColor` so each call site
   just sets `color`. The 8-point star path is the same one used on /model
   (.model-embassy-star); the octafoil rosette mirrors the embassy-gallery
   generator. All are aria-hidden — purely decorative. */

type MarkProps = { className?: string };

/** Khatam 8-point star (rub-el-hizb, two overlapping squares) — a fat star with
 *  a large octagonal centre, matching the owner's mockups + the star-logo mark.
 *  No inline fill — call sites set `fill`/`stroke` in CSS (rendered as a copper
 *  outline; the §5 medallion frames its numeral inside the open centre). */
export function StarMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 1.5 L14.91 4.98 L19.42 4.58 L19.02 9.09 L22.5 12 L19.02 14.91 L19.42 19.42 L14.91 19.02 L12 22.5 L9.09 19.02 L4.58 19.42 L4.98 14.91 L1.5 12 L4.98 9.09 L4.58 4.58 L9.09 4.98 Z" />
    </svg>
  );
}

/** Rounded octafoil rosette (kept as the softer alternative to StarMark). */
export function RosetteMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path
            key={a}
            d="M12 12 C 10.2 8.6, 10.2 4.9, 12 3.4 C 13.8 4.9, 13.8 8.6, 12 12 Z"
            transform={`rotate(${a} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="1.5" />
      </g>
    </svg>
  );
}

/** Four-point sparkle (✦) — list bullets, divider centers, connector marks. */
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

/** Small olive leaf-sprig for eyebrows and dividers (line-art + filled leaves). */
export function SprigMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 22 C 9 19, 16 13, 26 2.5" />
      <path d="M9.5 16.4 C 12.3 12.9, 12.6 9.9, 10.8 7.6 C 8.4 10.4, 8 13.6, 9.5 16.4 Z" fill="currentColor" stroke="none" />
      <path d="M14.6 12.2 C 17.4 8.9, 17.7 6, 15.9 3.7 C 13.5 6.4, 13.1 9.5, 14.6 12.2 Z" fill="currentColor" stroke="none" />
      <path d="M19.6 8.6 C 22.1 5.9, 22.6 3.8, 21.4 1.9 C 19.2 4, 18.3 6.2, 19.6 8.6 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
