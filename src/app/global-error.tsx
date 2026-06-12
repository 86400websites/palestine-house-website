"use client";

// Top-level error boundary. Replaces the root layout when it throws, so it
// must render its own <html> and <body>. Self-contained inline styles only,
// using the recorded token values (docs/DESIGN.md §3) — no imports.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "#FFFFFF",
          color: "#1A1A17",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
          That didn’t work.
        </h1>
        <p
          style={{
            color: "#6B6A63",
            fontFamily: "system-ui, sans-serif",
            margin: 0,
          }}
        >
          Something broke on our side, not yours. Try again — if it keeps
          happening, come back a little later.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.625rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#1A6B4A",
            color: "#FFFFFF",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
