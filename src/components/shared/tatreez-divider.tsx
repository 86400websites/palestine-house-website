/* A hairline divider carrying the abstracted tatreez motif — heritage accent
   in place of a plain rule (design-system TatreezDivider.jsx, ported).
   Low-opacity; never behind reading text. */

const TATREEZ_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="18" viewBox="0 0 120 18">' +
  '<g fill="none" stroke-dasharray="2.4 2.2" stroke-linecap="round">' +
  '<g stroke="#1A6B4A" opacity="0.5"><path d="M12 9 L21 1 L30 9 L21 17 Z"/><path d="M72 9 L81 1 L90 9 L81 17 Z"/></g>' +
  '<g stroke="#A8322D" opacity="0.42"><path d="M42 9 L51 1 L60 9 L51 17 Z"/><path d="M102 9 L111 1 L120 9 L111 17 Z"/></g>' +
  "</g>" +
  '<g fill="#1A6B4A" opacity="0.45"><rect x="19.5" y="7.5" width="3" height="3"/><rect x="79.5" y="7.5" width="3" height="3"/></g>' +
  "</svg>";

const TATREEZ_URL = `url(data:image/svg+xml;utf8,${encodeURIComponent(TATREEZ_SVG)})`;

export function TatreezDivider({
  width = "100%",
  opacity = 0.85,
}: {
  width?: string | number;
  opacity?: number;
}) {
  return (
    <div
      role="separator"
      style={{
        width,
        height: 18,
        backgroundImage: TATREEZ_URL,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
        opacity,
      }}
    />
  );
}
