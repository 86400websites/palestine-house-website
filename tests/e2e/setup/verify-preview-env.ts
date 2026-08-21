/* Environment-separation probe — SETUP-CHECKLIST Part 2's "confirm
   environment separation before a single test runs", made repeatable.
   Run: pnpm exec tsx tests/e2e/setup/verify-preview-env.ts
        (PLAYWRIGHT_BASE_URL = the deployed Preview under test)

   It fetches the Preview through the sanctioned bypass header and reports
   which Supabase project ref the served client bundle embeds. Both refs are
   public record (PROJECT-STATUS.md §6); no secret is ever read beyond passing
   the bypass value into the request header, and nothing secret is printed. */

const NON_PRODUCTION_REF = "sdszcralogcrujtyghig";
const PRODUCTION_REF = "jwogtqizqujwhbvpoziu";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI supplies env directly */
}

const base = process.env.PLAYWRIGHT_BASE_URL;
if (!base) {
  console.error("PLAYWRIGHT_BASE_URL is not set. Nothing was probed.");
  process.exit(1);
}

/* Header only — no x-vercel-set-bypass-cookie here: that variant answers
   with a 307 cookie-setting hop, which a plain fetch has no use for. */
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers: Record<string, string> = bypass
  ? { "x-vercel-protection-bypass": bypass }
  : {};

async function main() {
  console.log(`Probing ${base} (bypass header: ${bypass ? "SENT" : "absent"})`);

  const home = await fetch(`${base}/`, { headers, redirect: "manual" });
  if (home.status >= 300 && home.status < 400) {
    const target = home.headers.get("location") ?? "";
    if (target.includes("vercel.com/sso")) {
      console.error(
        "BLOCKED: the Preview still redirects to Vercel SSO. The bypass " +
          "secret is missing from the runner's environment (.env.local) or " +
          "was rejected. Nothing further was checked.",
      );
      process.exit(1);
    }
    console.error(`Unexpected redirect (${home.status} -> ${target}).`);
    process.exit(1);
  }
  if (home.status !== 200) {
    console.error(`Unexpected HTTP ${home.status} from the Preview homepage.`);
    process.exit(1);
  }

  /* The homepage is fully public and may not ship the Supabase browser
     client; /login does. Scan both pages' chunks. */
  let sawTest = false;
  let sawProd = false;
  const seen = new Set<string>();
  let scanned = 0;

  for (const pagePath of ["/", "/login"]) {
    const page =
      pagePath === "/" ? home : await fetch(`${base}${pagePath}`, { headers });
    if (page.status !== 200) continue;
    const html = await page.text();
    if (html.includes(NON_PRODUCTION_REF)) sawTest = true;
    if (html.includes(PRODUCTION_REF)) sawProd = true;

    const chunkPaths = [
      ...new Set(
        [...html.matchAll(/\/_next\/static\/[^"'\s\\]+\.js/g)].map((m) => m[0]),
      ),
    ];
    for (const path of chunkPaths) {
      if (seen.has(path) || seen.size >= 40 || sawTest || sawProd) continue;
      seen.add(path);
      const res = await fetch(`${base}${path}`, { headers });
      if (!res.ok) continue;
      scanned += 1;
      const js = await res.text();
      if (js.includes(NON_PRODUCTION_REF)) sawTest = true;
      if (js.includes(PRODUCTION_REF)) sawProd = true;
    }
  }

  console.log(`Homepage: HTTP 200. Chunks scanned: ${scanned}.`);
  if (sawProd) {
    console.error(
      `FAIL: the Preview bundle embeds the PRODUCTION Supabase ref ` +
        `(${PRODUCTION_REF}). Environment separation is broken — STOP AND ` +
        "REPORT (ENV-VARS-SAFETY.md / SECURITY-CHECKLIST.md §12). Do not run " +
        "a single test against this Preview.",
    );
    process.exit(1);
  }
  if (sawTest) {
    console.log(
      `OK: the Preview points at the NON-PRODUCTION Supabase project ` +
        `(${NON_PRODUCTION_REF}). Environment separation confirmed.`,
    );
    process.exit(0);
  }
  /* This site keeps its whole Supabase surface server-side (server actions +
     middleware) — verified 2026-08-22: no client chunk embeds any
     supabase.co URL. So "no ref found" is the EXPECTED result here, and this
     probe is a tripwire that hard-fails only if the PRODUCTION ref ever
     leaks into a served bundle. The conclusive separation proof is
     behavioral and runs next in the suite: the robot accounts exist ONLY in
     the non-production project, so their sign-in succeeding on this Preview
     proves which database serves it. */
  console.log(
    "PASS (tripwire): no Supabase ref appears in any served bundle — " +
      "expected for this all-server-side site; no PRODUCTION leak. " +
      "Conclusive proof = the robot sign-in in auth.setup.ts (runs with the " +
      "suite): those accounts exist only in the non-production project.",
  );
  process.exit(0);
}

void main();
