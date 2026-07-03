/* A hairline divider carrying the abstracted tatreez motif — heritage accent
   in place of a plain rule (design-system TatreezDivider.jsx, ported).
   Low-opacity; never behind reading text.
   DR1-10: the motif colors are a palette prop — the public v3 shell passes
   "v3" (olive + copper) via PageDivider/apply; the gated workspace keeps the
   default heritage green/red untouched. */

const PALETTES = {
  heritage: { primary: "#1A6B4A", accent: "#A8322D" },
  v3: { primary: "#5F6E49", accent: "#B0713D" },
} as const;

type Palette = keyof typeof PALETTES;

function tatreezUrl(palette: Palette): string {
  const { primary, accent } = PALETTES[palette];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="18" viewBox="0 0 120 18">' +
    '<g fill="none" stroke-dasharray="2.4 2.2" stroke-linecap="round">' +
    `<g stroke="${primary}" opacity="0.5"><path d="M12 9 L21 1 L30 9 L21 17 Z"/><path d="M72 9 L81 1 L90 9 L81 17 Z"/></g>` +
    `<g stroke="${accent}" opacity="0.42"><path d="M42 9 L51 1 L60 9 L51 17 Z"/><path d="M102 9 L111 1 L120 9 L111 17 Z"/></g>` +
    "</g>" +
    `<g fill="${primary}" opacity="0.45"><rect x="19.5" y="7.5" width="3" height="3"/><rect x="79.5" y="7.5" width="3" height="3"/></g>` +
    "</svg>";
  return `url(data:image/svg+xml;utf8,${encodeURIComponent(svg)})`;
}

const TATREEZ_URLS: Record<Palette, string> = {
  heritage: tatreezUrl("heritage"),
  v3: tatreezUrl("v3"),
};

export function TatreezDivider({
  width = "100%",
  opacity = 0.85,
  palette = "heritage",
}: {
  width?: string | number;
  opacity?: number;
  palette?: Palette;
}) {
  return (
    <div
      role="separator"
      style={{
        width,
        height: 18,
        backgroundImage: TATREEZ_URLS[palette],
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
        opacity,
      }}
    />
  );
}
