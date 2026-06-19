/* Route-transition loading fallback (S7 Step 6). A calm, centered brand mark
   with a gentle pulse; respects prefers-reduced-motion. Shown briefly while a
   dynamic route's server work resolves — the static marketing pages render
   instantly, so this is mostly seen entering the gated workspace. */

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Loading…
      </span>
      <svg
        className="ph-route-loading"
        width="40"
        height="50"
        viewBox="0 0 48 60"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 57 V30 A32 32 0 0 1 24 2.5 A32 32 0 0 1 40 30 V57"
          stroke="#1A6B4A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 57 V34 A15.5 15.5 0 0 1 24 20.6 A15.5 15.5 0 0 1 31.5 34 V57"
          stroke="#1A6B4A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </svg>
      <style
        dangerouslySetInnerHTML={{
          __html: `.ph-route-loading{animation:ph-route-pulse 1.2s ease-in-out infinite}@keyframes ph-route-pulse{0%,100%{opacity:.35}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.ph-route-loading{animation:none;opacity:.6}}`,
        }}
      />
    </div>
  );
}
