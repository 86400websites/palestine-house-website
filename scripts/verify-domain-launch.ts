/**
 * scripts/verify-domain-launch.ts — is the live site really served, and described,
 * from the address it should be? L1 built it for the custom-domain launch
 * (docs/DOMAIN-LAUNCH-RUNBOOK.md runs it after every owner step); it works for
 * any later domain change too.
 *
 *   pnpm exec tsx scripts/verify-domain-launch.ts
 *       the live site on https://www.palestine-house.com, describing itself as www
 *   pnpm exec tsx scripts/verify-domain-launch.ts --base https://palestine-house-website.vercel.app
 *       the old address, which must point search engines at www
 *   pnpm exec tsx scripts/verify-domain-launch.ts --base <local or Preview URL> --canonical <origin>
 *       any other build, against the origin it was built for
 *
 * Production has described itself as www since before L1 (read live, 2026-11-17):
 * NEXT_PUBLIC_SITE_URL in Vercel Production was switched at an unrecorded date.
 *
 * WHAT IT CHECKS (each one PASS or FAIL, exit 1 on any FAIL)
 * --------------
 *  1. The apex (palestine-house.com) redirects permanently to www, when --base is www.
 *  2. The six security headers, by shape rather than frozen text (PR-004's rule:
 *     SYS3 will widen the CSP for Sentry, and that must not fail this).
 *  3. Every indexable public page answers 200, with one title, a canonical and an
 *     og:url equal to the canonical origin + its own path, and no noindex.
 *  4. The sign-in page and an anonymous /dashboard carry noindex.
 *  5. JSON-LD names the canonical origin for the Organization, its logo and the WebSite.
 *  6. sitemap.xml lists exactly the indexable public pages, on the canonical origin.
 *  7. robots.txt allows crawling and names the canonical sitemap.
 *  8. The Search Console verification file is served byte for byte.
 *  9. The share image (og:image) is a 1200x630 PNG.
 *
 * Read only: plain GET requests to public addresses. No credentials, no database,
 * no form is submitted, nothing is written anywhere.
 */

import { PUBLIC_ROUTES } from "../src/lib/site";

const WWW = "https://www.palestine-house.com";
const APEX = "https://palestine-house.com";
/* The owner's Google Search Console file (public/), served forever: Google re-checks it. */
const GOOGLE_FILE = "/google777f049a86d5990c.html";
const GOOGLE_BODY = "google-site-verification: google777f049a86d5990c.html";
const NOINDEX_ROUTES = ["/login", "/forgot-password", "/update-password"];
const INDEXABLE = PUBLIC_ROUTES.filter((r) => !NOINDEX_ROUTES.includes(r));
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 palestine-house-launch-check";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const base = (arg("--base") ?? WWW).replace(/\/+$/, "");
const canonical = (arg("--canonical") ?? WWW).replace(/\/+$/, "");

let failures = 0;
function check(ok: boolean, label: string, detail = ""): void {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

async function get(url: string, redirect: RequestRedirect = "follow") {
  const res = await fetch(url, { redirect, headers: { "user-agent": UA } });
  return { res, body: await res.text() };
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

/* Values are read from the whole document, because Next 15 streams a dynamic
   page's metadata into <body> for browsers and for Googlebot (only "HTML-limited"
   bots, a list that leaves Googlebot out, get it in <head>), and it stays there
   after rendering. Where the canonical sits is then checked on its own: Google
   reads a canonical only from <head>. Among the indexable pages only /apply is
   dynamic; that is PROJECT-STATUS §7 #19, closed when next.config.ts adds
   Googlebot to htmlLimitedBots, so until then it is reported as a NOTE, not a
   PASS. Any other page with its canonical outside <head> FAILS. */
const KNOWN_BODY_METADATA = new Set(["/apply"]);
const canonicalInHead = (html: string) => {
  const at = html.search(/<link\b[^>]*\brel="canonical"/i);
  const headEnd = html.indexOf("</head>");
  return at >= 0 && headEnd >= 0 && at < headEnd;
};
function tagValues(html: string, re: RegExp, attr: string): string[] {
  return [...html.matchAll(re)].map((m) => {
    const v = m[0].match(new RegExp(`\\b${attr}="([^"]*)"`, "i"));
    return v ? decode(v[1]) : "";
  });
}
const canonicals = (html: string) =>
  tagValues(html, /<link\b[^>]*\brel="canonical"[^>]*>/gi, "href");
const ogUrls = (html: string) =>
  tagValues(html, /<meta\b[^>]*\bproperty="og:url"[^>]*>/gi, "content");
const ogImages = (html: string) =>
  tagValues(html, /<meta\b[^>]*\bproperty="og:image"[^>]*>/gi, "content");
const robotsMeta = (html: string) =>
  tagValues(html, /<meta\b[^>]*\bname="robots"[^>]*>/gi, "content");
const titleCount = (html: string) => (html.match(/<title\b/gi) ?? []).length;

/* The home page's canonical is the bare origin; Next writes it without the slash. */
const expected = (route: string) => (route === "/" ? canonical : `${canonical}${route}`);
const sameUrl = (a: string, b: string) => a.replace(/\/$/, "") === b.replace(/\/$/, "");

async function main(): Promise<void> {
  console.log(`Serving address:   ${base}`);
  console.log(`Canonical origin:  ${canonical}\n`);

  // 1. Apex → www, permanently.
  if (base === WWW) {
    const { res } = await get(`${APEX}/`, "manual");
    const location = res.headers.get("location") ?? "";
    check(
      [301, 308].includes(res.status) && sameUrl(location, `${WWW}/`),
      "apex redirects permanently to www",
      `${res.status} → ${location || "no Location"}`,
    );
  }

  // 2. Security headers, by shape.
  const home = await get(`${base}/`);
  const h = home.res.headers;
  const csp = h.get("content-security-policy") ?? "";
  check(
    csp.includes("default-src 'self'") &&
      csp.includes("frame-ancestors 'none'") &&
      csp.includes("frame-src https://www.youtube-nocookie.com"),
    "Content-Security-Policy present and shaped as shipped",
  );
  const hsts = h.get("strict-transport-security") ?? "";
  const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1] ?? 0);
  check(maxAge >= 31536000, "Strict-Transport-Security, at least a year", hsts || "missing");
  check(h.get("x-frame-options") === "DENY", "X-Frame-Options: DENY");
  check(h.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
  check(
    h.get("referrer-policy") === "strict-origin-when-cross-origin",
    "Referrer-Policy: strict-origin-when-cross-origin",
  );
  check(Boolean(h.get("permissions-policy")), "Permissions-Policy present");

  // 3. Every indexable public page describes itself on the canonical origin.
  let shareImage = "";
  for (const route of INDEXABLE) {
    const { res, body } = route === "/" ? home : await get(`${base}${route}`);
    const c = canonicals(body);
    const o = ogUrls(body);
    const r = robotsMeta(body).join(",");
    const ok =
      res.status === 200 &&
      titleCount(body) === 1 &&
      c.length === 1 &&
      sameUrl(c[0], expected(route)) &&
      o.length === 1 &&
      sameUrl(o[0], expected(route)) &&
      !/noindex/i.test(r);
    const inHead = canonicalInHead(body);
    check(
      ok && (inHead || KNOWN_BODY_METADATA.has(route)),
      `${route} indexable and canonical`,
      !ok
        ? `status ${res.status}, titles ${titleCount(body)}, canonical ${c.join(" ") || "none"}, og:url ${o.join(" ") || "none"}, robots ${r || "none"}`
        : inHead
          ? ""
          : KNOWN_BODY_METADATA.has(route)
            ? "values right; canonical outside <head>"
            : "canonical outside <head>, where Google ignores it",
    );
    if (ok && !inHead && KNOWN_BODY_METADATA.has(route)) {
      console.log(
        `NOTE  ${route}: its canonical is streamed into <body>, which Google ignores (PROJECT-STATUS §7 #19, fix due in SYS1.5)`,
      );
    }
    if (route === "/") shareImage = ogImages(body)[0] ?? "";
  }

  // 4. Private and utility pages stay out of search.
  for (const route of ["/login", "/dashboard"]) {
    const { body } = await get(`${base}${route}`);
    check(/noindex/i.test(robotsMeta(body).join(",")), `${route} carries noindex`);
  }

  // 5. Structured data names the canonical origin.
  const ld = [...home.body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  let ldOk = false;
  try {
    const graph = (JSON.parse(ld[0]?.[1] ?? "{}")["@graph"] ?? []) as Array<Record<string, string>>;
    const org = graph.find((g) => g["@type"] === "Organization");
    const site = graph.find((g) => g["@type"] === "WebSite");
    ldOk =
      Boolean(org && site) &&
      sameUrl(org!.url, canonical) &&
      sameUrl(site!.url, canonical) &&
      String(org!.logo).startsWith(`${canonical}/`);
  } catch {
    ldOk = false;
  }
  check(ldOk, "JSON-LD Organization + WebSite on the canonical origin");

  // 6. The sitemap: exactly the indexable pages, on the canonical origin.
  const sitemap = await get(`${base}/sitemap.xml`);
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const wanted = INDEXABLE.map(expected);
  const sitemapOk =
    sitemap.res.status === 200 &&
    locs.length === wanted.length &&
    wanted.every((w) => locs.some((l) => sameUrl(l, w)));
  check(sitemapOk, "sitemap.xml lists exactly the indexable pages", `${locs.length} of ${wanted.length}`);

  // 7. robots.txt.
  const robots = await get(`${base}/robots.txt`);
  check(
    robots.res.status === 200 &&
      /^Allow: \/$/m.test(robots.body) &&
      !/^Disallow: \/$/m.test(robots.body) &&
      robots.body.includes(`Sitemap: ${canonical}/sitemap.xml`),
    "robots.txt allows crawling and names the canonical sitemap",
  );

  // 8. The Search Console file, byte for byte.
  const google = await get(`${base}${GOOGLE_FILE}`);
  check(
    google.res.status === 200 && google.body === GOOGLE_BODY,
    "Search Console verification file served exactly",
    `${google.res.status}, ${google.body.length} bytes`,
  );

  // 9. The share image.
  if (!shareImage) {
    check(false, "share image (og:image) present on the home page");
  } else {
    const res = await fetch(shareImage, { headers: { "user-agent": UA } });
    const buf = Buffer.from(await res.arrayBuffer());
    const png = buf.subarray(1, 4).toString() === "PNG";
    const size = png ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}` : "not a PNG";
    check(res.status === 200 && size === "1200x630", "share image is a 1200x630 PNG", size);
  }

  console.log(
    failures === 0
      ? "\nALL CHECKS PASSED"
      : `\n${failures} CHECK${failures === 1 ? "" : "S"} FAILED`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error("FAIL  could not complete:", error instanceof Error ? error.message : error);
  process.exit(1);
});
