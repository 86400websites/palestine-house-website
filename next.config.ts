import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* Tight allow-list (SECURITY-CHECKLIST / TECH-ARCHITECTURE §13). The only
   planned extension is the YouTube embed origin for Live Programming — added in
   Sprint 9 (frame-src, decision D1): the privacy-enhanced youtube-nocookie
   player only, nothing else. Mailchimp/Resend/etc. run server-side via Route
   Handlers, so connect-src/form-action stay 'self'. 'unsafe-inline' for
   scripts/styles is the Next.js baseline without a nonce pipeline; 'unsafe-eval'
   is dev-only. */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // The YouTube privacy-enhanced player only (S9 9c/9g, D1): no 'self', since
  // the app embeds no same-origin frames. frame-ancestors below still forbids
  // US being framed. PP5 deleted /live/[id], the watch view this was opened
  // for, so nothing embeds a video at this moment — the directive stays because
  // D-PP-b ③ puts YouTube links back on the focus areas through PP6's CMS, and
  // narrowing then re-widening a CSP buys nothing.
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    /* PP6a (6a-g) — CONFIG CHANGE, called out deliberately.
       This was dropped from the sprint scope at 6a-a on the evidence available
       then: no experimental block existed, the Next.js default is 1 MB, and the
       largest delivered content file is 188 KB. Building the actual upload path
       is the condition that was named for revisiting it, and it has arrived —
       the Files screen accepts Word documents and PDFs, and a PDF with images
       passes 1 MB easily.
       ⚠️ Corrected at the exit gate: this was 12mb against a 10 MB app limit,
       which was internally consistent and wrong about the DEPLOY TARGET.
       Vercel rejects a serverless function request body over ~4.5 MB with a 413
       before our code runs, and bodySizeLimit cannot raise a platform edge
       limit — so a 10 MB promise would have produced the opaque framework error
       this comment claimed to prevent. THREE numbers have to agree: 4 MB
       enforced in src/lib/admin/file-actions.ts, 4.5mb of body here to cover
       multipart overhead, and the host's own ceiling. The delivered content is
       183–188 KB per file. A genuinely large file would need a direct-to-
       storage signed upload URL, which bypasses the function body entirely.
       Server Actions only; no route, header or CSP value changes. */
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  images: {
    /* AVIF first, WebP fallback — ~20-30% smaller for the illustrated PNG art,
       a CWV/LCP win on the image-heavy marketing pages. Optimised images are
       served same-origin via /_next/image, so img-src 'self' covers them (no
       CSP change). */
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  /* PP5 cutover. The legacy workspace routes were deleted this sprint; they had
     already lost every entry point at PP2 (D-PP-d), but each still resolved by
     direct URL, and approved partners have had months to bookmark them. Rather
     than 404 someone who saved /elements/c2, send them to the About landing,
     which is the one page that explains where everything moved.

     /dashboard for all of them, deliberately. A cleverer map is tempting —
     /live to /program, /plan to /setup — but the old 33 element slugs do not
     map onto the new topic slugs without a database read, which a static
     redirect cannot do, and a guess that lands on the wrong section is worse
     than an honest hub.

     permanent: false (307). These are gated, noindexed URLs, so there is no SEO
     reason to burn a 308 into every partner's browser cache for a model that
     has changed twice this stage already.

     Each parent is listed separately from its children because ':path*' matching
     on the parent alone is easy to get subtly wrong. */
  async redirects() {
    const gone = [
      "/plan",
      "/build",
      "/food",
      "/programming",
      "/academy",
      "/tools",
      "/live",
      "/elements",
      "/resources",
    ];
    /* PP8 8-e: /academy was in `gone` but not here, so /academy/[slug] — a real
       route until PP5, and one a partner could have bookmarked exactly as
       easily as /elements/c2 — answered 404 while /live/123 redirected. Found
       by requesting the children rather than the parents. The omission
       contradicted this block's own stated intention, so it is corrected rather
       than documented. */
    const withChildren = ["/live", "/elements", "/resources", "/academy"];
    return [
      ...gone.map((source) => ({
        source,
        destination: "/dashboard",
        permanent: false,
      })),
      ...withChildren.map((base) => ({
        source: `${base}/:path*`,
        destination: "/dashboard",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
