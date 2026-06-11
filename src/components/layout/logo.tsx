import Link from "next/link";

/* Brand mark recreated from the bound design system (Logo.jsx): the
   Palestinian arch, outer stroke with a faint inner echo. */
function ArchMark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 48 60"
      width={size * 0.8}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M8 57 V30 A32 32 0 0 1 24 2.5 A32 32 0 0 1 40 30 V57"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 57 V34 A15.5 15.5 0 0 1 24 20.6 A15.5 15.5 0 0 1 31.5 34 V57"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}

type LogoProps = {
  /** "green" (default) for the header, "white" for the dark footer. */
  tone?: "green" | "white";
  size?: number;
  href?: string;
};

export function Logo({ tone = "green", size = 30, href }: LogoProps) {
  const markColor = tone === "white" ? "var(--white)" : "var(--brand-primary)";
  const wordColor = tone === "white" ? "var(--white)" : "var(--foreground)";

  const content = (
    <>
      <span style={{ color: markColor, display: "inline-flex" }}>
        <ArchMark size={size} />
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
          fontSize: size * 0.62,
          letterSpacing: "-0.01em",
          color: wordColor,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Palestine House
      </span>
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: size * 0.4,
    textDecoration: "none",
  };

  if (href) {
    return (
      <Link href={href} aria-label="Palestine House — Home" style={style}>
        {content}
      </Link>
    );
  }
  return (
    <span aria-label="Palestine House" style={style}>
      {content}
    </span>
  );
}
