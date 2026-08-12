/**
 * scripts/extract-mockup-spec.ts — PP1 spec/seed/asset extraction (Private Platform Revamp).
 *
 * The owner's final private-pages prototype ("PH - Palestine House Final Mockup.html",
 * kept in the gitignored docs/page-designs/ — OneDrive is canon, never committed) embeds
 * the entire new workspace IA as JSON (#appData) plus base64 image assets (__ASSETS__).
 * This script extracts all of it into reviewable, committed artifacts so the build never
 * reads the 7.7MB mockup again:
 *
 *   docs/workspace-spec.json                          — the canonical extracted IA spec
 *   supabase/sql/migrations/0028_platform_seed.up.sql — generated idempotent seed (+ .down.sql)
 *   public/assets/workspace/topics/<topic-slug>.jpg   — 33 topic photos (from the owner's PNG masters)
 *   public/assets/workspace/sections/<section>.jpg    — 4 section/journey photos (PNG masters)
 *   public/assets/workspace/heroes/<page>.jpg         — 5 page heroes (base64-only in the mockup)
 *   public/assets/workspace/misc/*                    — tatreez pattern, footer photo, branch,
 *                                                       sprig, generic topic fallback
 *
 * The 33-row ELEMENT_MAP below is the integrity spine of the whole revamp: it pins each
 * new topic slug to an existing elements.slug (a1..k3), verified against the live DB on
 * 2026-08-10 (titles match 1:1; the new IA is a pure regrouping). The seed keys on
 * elements.slug -> element_id, so a wrong mapping cannot silently attach the wrong
 * bodies — it would fail the asserts here or the FK/unique constraints on apply.
 *
 * Per-kind card copy is CONSTANT across all topics in the mockup — it ships as app
 * constants in PP3, not DB rows. Only structural metadata is seeded.
 *
 * Workspace chrome copy (PP2, 2026-08-12): the header/footer strings live in the
 * mockup's markup + render functions rather than #appData, so PP1 never captured them.
 * They are extracted into spec.chrome (asserted, so mockup drift fails loudly) and the
 * app reads them from the committed spec — the 7.7MB mockup is never a build input.
 *
 * 3-card transform (D-PP-c, owner 2026-08-11): the mockup still shows 4 standard
 * cards + "More guides" extras per topic; the owner's instruction supersedes it.
 * The emitted spec/seed keep only Overview + Simple guide and synthesize the single
 * Template card (download-only, owner-populated via CMS v2 in PP6). Extras are
 * dropped entirely. The raw-shape asserts stay pinned to the mockup as source-drift
 * guards; everything emitted is post-transform.
 *
 * Sources absent on disk (fresh clone without the OneDrive folders) fail with a clear
 * message — outputs are committed, so re-running is only needed when the mockup changes.
 *
 * Usage:
 *   pnpm tsx scripts/extract-mockup-spec.ts
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const MOCKUP = path.join(ROOT, "docs/page-designs/PH - Palestine House Final Mockup.html");
const TOPIC_MASTERS = path.join(ROOT, "docs/source-assets/design-refs/workspace/topic-masters");
const OUT_SPEC = path.join(ROOT, "docs/workspace-spec.json");
const OUT_SEED_UP = path.join(ROOT, "supabase/sql/migrations/0028_platform_seed.up.sql");
const OUT_SEED_DOWN = path.join(ROOT, "supabase/sql/migrations/0028_platform_seed.down.sql");
const OUT_ASSETS = path.join(ROOT, "public/assets/workspace");
const OUT_APP_SPEC = path.join(ROOT, "src/lib/workspace-v2/spec.ts");

/** topic_slug -> elements.slug. Verified against the live DB 2026-08-10 (33/33 titles match). */
const ELEMENT_MAP: Record<string, string> = {
  "launching-a-new-house": "i2",
  "operating-model": "b1",
  "mission-values-and-guest-promise": "a1",
  "brand-experience-standards": "a3",
  "technology-stack-and-data": "i1",
  "facility-operations": "f1",
  "food-and-beverage-operations": "f2",
  "inventory-and-procurement": "f3",
  "customer-service-and-recovery": "e2",
  "org-structure-and-roles": "c1",
  "hiring-onboarding-and-training": "c2",
  "performance-management-and-culture": "c3",
  "business-model-and-revenue": "h1",
  "financial-operations-and-controls": "h2",
  "reporting-kpis-and-audits": "h3",
  "governance-and-ethics": "b2",
  "legal-compliance-and-risk": "b3",
  "menu-and-palestinian-culinary-identity": "k1",
  "coffee-tea-and-beverage-program": "k2",
  "catering-private-events-and-culinary-programming": "k3",
  "programming-model-and-pillars": "d1",
  "aswatna-studio-collaboration": "d2",
  "event-production-sops": "d3",
  "guest-journey-and-member-journey": "a2",
  "membership-model-and-benefits": "e1",
  "community-partnerships": "e3",
  "local-marketing-playbook": "g1",
  "global-campaigns": "g2",
  "retail-shop-operations": "g3",
  "crisis-management": "i3",
  "sustainability-and-impact": "j3",
  "continuous-improvement-and-knowledge-sharing": "j1",
  "templates-and-master-index": "j2",
};

const KNOWN_ELEMENT_SLUGS = new Set(
  "abcdefghijk".split("").flatMap((l) => [1, 2, 3].map((n) => `${l}${n}`)),
);

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`ASSERT FAILED: ${msg}`);
    process.exit(1);
  }
}

function sqlText(v: string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Loose title normalization for master-file <-> topic matching only (never for keys). */
function normTitle(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(png|jpg)\b/g, "")
    .trim();
}

type MockTopic = {
  t: string;
  desc: string;
  intro: string;
  slug: string;
  id: string;
  icon: string;
  docs: string[];
  resources: Array<Record<string, string>>;
  extras: Array<Record<string, string>>;
  templates: Array<Record<string, string>>;
};
type MockGroup = { g: string; desc: string; slug: string; topics: MockTopic[] };
type MockSection = { id: string; num: number; label: string; subtitle: string; groups: MockGroup[] };

async function writeJpeg(input: Buffer, outFile: string, maxWidth: number, quality: number) {
  const img = sharp(input, { limitInputPixels: 900_000_000 }).rotate();
  const meta = await img.metadata();
  const pipeline =
    (meta.width ?? 0) > maxWidth ? img.resize({ width: maxWidth, withoutEnlargement: true }) : img;
  await pipeline
    .flatten({ background: "#ffffff" })
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toFile(outFile);
  await reportSize(outFile);
}

/** Every committed workspace asset must stay under the 600 KB page budget. */
async function reportSize(outFile: string) {
  const kb = Math.round((await fs.stat(outFile)).size / 1024);
  console.log(`  wrote ${path.relative(ROOT, outFile)} (${kb} KB)`);
  assert(kb < 600, `${outFile} is ${kb} KB — over the 600 KB budget, lower quality/width`);
}

function dataUriBuffer(uri: string): { buf: Buffer; ext: string } {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s.exec(uri);
  assert(m, `unrecognized data URI (${uri.slice(0, 40)}…)`);
  return { buf: Buffer.from(m![2], "base64"), ext: m![1] === "jpeg" ? "jpg" : m![1] };
}

async function main() {
  const html = await fs.readFile(MOCKUP, "utf8").catch(() => {
    console.error(`Mockup not found at ${MOCKUP} — restore the OneDrive docs/page-designs folder.`);
    process.exit(1);
  });

  // ---- 1. Parse #appData + the __ASSETS__ assignments -------------------------------
  const appMatch = /<script type="application\/json" id="appData">(.*?)<\/script>/s.exec(html!);
  assert(appMatch, "#appData block not found in the mockup");
  const data = JSON.parse(appMatch![1]);

  const assets: Record<string, unknown> = {};
  const objAssign = /window\.__ASSETS__\s*=\s*(\{.*?\})\s*;?\s*<\/script>/gs;
  for (let m = objAssign.exec(html!); m; m = objAssign.exec(html!)) {
    Object.assign(assets, JSON.parse(m[1]));
  }
  const propAssign = /window\.__ASSETS__\.(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|\{[^;]*?\})\s*;/gs;
  for (let m = propAssign.exec(html!); m; m = propAssign.exec(html!)) {
    assets[m[1]] = JSON.parse(m[2]);
  }
  for (const key of ["tatreez", "footer_photo", "branch", "sprig", "topicHero", "journeyPositionByPage", "topicHeroPositionBySlug"]) {
    assert(key in assets, `__ASSETS__.${key} missing from the mockup`);
  }

  const sections = data.sections as MockSection[];
  const pageMeta = data.pageMeta as Record<string, { eyebrow: string; title: string; lead: string; hero: string; position: string; label: string }>;
  const journey = data.journey as Array<{ page: string; num: string; icon: string; title: string; desc: string; action: string }>;
  const journeyPos = assets.journeyPositionByPage as Record<string, string>;
  const topicPos = assets.topicHeroPositionBySlug as Record<string, string>;

  // ---- 2. Hard asserts on the IA shape ----------------------------------------------
  assert(sections.length === 4, `expected 4 sections, got ${sections.length}`);
  const allGroups = sections.flatMap((s) => s.groups.map((g) => ({ section: s, group: g })));
  const allTopics = allGroups.flatMap(({ section, group }) =>
    group.topics.map((topic) => ({ section, group, topic })),
  );
  assert(allGroups.length === 10, `expected 10 groups, got ${allGroups.length}`);
  assert(allTopics.length === 33, `expected 33 topics, got ${allTopics.length}`);
  const perSection = sections.map((s) => s.groups.reduce((a, g) => a + g.topics.length, 0));
  assert(perSection.join("/") === "5/15/9/4", `per-section topic counts ${perSection.join("/")} != 5/15/9/4`);

  const extras = allTopics.flatMap(({ topic }) => topic.extras);
  const templates = allTopics.flatMap(({ topic }) => topic.templates);
  const stdResources = allTopics.flatMap(({ topic }) => topic.resources);
  assert(extras.length === 15, `expected 15 extras, got ${extras.length}`);
  assert(templates.length === 297, `expected 297 templates, got ${templates.length}`);
  assert(stdResources.length === 132, `expected 132 standard resources, got ${stdResources.length}`);
  for (const { topic } of allTopics) {
    assert(topic.resources.length === 4, `${topic.slug}: expected 4 standard resources`);
    assert(topic.icon, `${topic.slug}: missing icon`);
  }
  // Mirror the mockup's fallback: positions default to '50% 50%' where unlisted.
  const posOf = (slug: string) => topicPos[slug] ?? "50% 50%";
  const RES_KINDS = ["OVERVIEW", "GUIDE", "CHECKLIST", "WATCH OUT"];
  assert(
    [...new Set(stdResources.map((r) => r.kind))].sort().join("|") === [...RES_KINDS].sort().join("|"),
    "standard resource kinds drifted from OVERVIEW/GUIDE/CHECKLIST/WATCH OUT",
  );

  // Card copy must be CONSTANT per kind across all 33 topics — that is what
  // licenses shipping it as app constants in PP3 instead of DB rows. Assert it
  // before picking a representative row, so a future mockup that varies the
  // copy fails loudly here rather than silently losing the variants.
  const copySignature = (r: Record<string, string>, keys: string[]) =>
    JSON.stringify(keys.map((k) => r[k] ?? null));
  const assertConstantCopy = (
    label: string,
    rows: Array<Record<string, string>>,
    keys: string[],
  ) => {
    const signatures = new Set(rows.map((r) => copySignature(r, keys)));
    assert(
      signatures.size === 1,
      `${label}: card copy is not constant across topics (${signatures.size} variants of ${keys.join("/")}) — it can no longer ship as app constants`,
    );
  };
  for (const kind of RES_KINDS) {
    assertConstantCopy(
      `standard resource "${kind}"`,
      stdResources.filter((r) => r.kind === kind),
      ["key", "title", "icon", "desc", "action", "use"],
    );
  }
  assertConstantCopy("templates", templates, ["kind", "icon", "desc", "use"]);

  // The map: every topic resolves to a distinct, known element slug.
  const mapped = new Set<string>();
  for (const { topic } of allTopics) {
    const el = ELEMENT_MAP[topic.slug];
    assert(el, `ELEMENT_MAP missing topic slug '${topic.slug}'`);
    assert(KNOWN_ELEMENT_SLUGS.has(el), `ELEMENT_MAP['${topic.slug}'] = '${el}' is not a known element slug`);
    assert(!mapped.has(el), `element '${el}' mapped twice`);
    mapped.add(el);
  }
  assert(mapped.size === 33, `expected 33 distinct mapped elements, got ${mapped.size}`);
  assert(Object.keys(ELEMENT_MAP).length === 33, "ELEMENT_MAP has stale extra entries");

  console.log("appData asserts pass: 4 sections / 10 groups / 33 topics (5/15/9/4) / 132 std / 15 extras / 297 templates / 33:33 element map");

  // ---- 2b. Owner transform (D-PP-f, 2026-08-12): the final topic model --------------
  // The mockup shows 4 standard cards + "More guides" extras; the owner's instruction
  // supersedes it (PROJECT-STATUS §5 D-PP-c as revised by D-PP-f). The shipped model is
  //   summary -> ONE Simple guide card (Read + Download) -> Watch Video -> templates grid
  // so only the GUIDE standard card survives; overview/checklist/watch cards and the 15
  // extras are dropped. Templates are NOT reduced — under D-PP-f they are a live
  // many-per-topic surface again (the 297 coded files already in the DB/Storage), so the
  // per-topic `templates` arrays are emitted in full. The raw asserts above stay pinned
  // to the mockup (source-drift guards); everything emitted below is post-transform.
  const KEPT_KEYS = ["guide"];
  const KEPT_KINDS = ["GUIDE"];
  for (const { topic } of allTopics) {
    topic.resources = topic.resources.filter((r) => KEPT_KEYS.includes(r.key));
  }
  const keptResources = allTopics.flatMap(({ topic }) => topic.resources);
  assert(keptResources.length === 33, `expected 33 kept standard resources, got ${keptResources.length}`);
  for (const { topic } of allTopics) {
    assert(topic.resources.length === 1, `${topic.slug}: expected exactly 1 kept standard resource (the guide)`);
    assert(topic.templates.length > 0, `${topic.slug}: has no templates — the D-PP-f grid would be empty`);
  }
  assert(
    [...new Set(keptResources.map((r) => r.kind))].sort().join("|") === [...KEPT_KINDS].sort().join("|"),
    "kept standard resource kind drifted from GUIDE",
  );

  // Owner-approved intro trims where mockup copy referenced a removed card. The
  // launching-a-new-house intro promised "the guides" (plural) and "the checklist and
  // templates"; under D-PP-f a topic has one guide and many templates. Asserted so a
  // future mockup edit cannot silently miss the trim.
  const INTRO_TRIMS: Record<string, [from: string, to: string]> = {
    "launching-a-new-house": [
      "Read the guides in order, then use the checklist and templates below",
      "Read the guide, then use the templates below",
    ],
  };
  for (const { topic } of allTopics) {
    const trim = INTRO_TRIMS[topic.slug];
    if (!trim) continue;
    assert(topic.intro.includes(trim[0]), `${topic.slug}: intro trim source text not found — mockup copy changed?`);
    topic.intro = topic.intro.replace(trim[0], trim[1]);
  }

  console.log(
    `D-PP-f transform applied: 33 kept std (of 132, guide only) / ${templates.length} templates kept live / extras dropped / 1 intro trim`,
  );

  // ---- 2c. Workspace chrome copy (PP2) ----------------------------------------------
  // The header/footer strings live in the mockup's markup + render functions, not in
  // #appData, so PP1 never captured them. PP2 builds the real chrome and must use them
  // verbatim — extract them here so the app reads the committed spec, never the 7.7MB
  // mockup. Every capture is asserted: a mockup edit that moves or renames any of these
  // fails the run loudly instead of silently shipping stale or missing copy.
  const grab = (re: RegExp, label: string): string => {
    const m = re.exec(html!);
    assert(m && m[1] !== undefined, `chrome copy: ${label} not found in the mockup`);
    return m![1].trim();
  };

  const navBlock = grab(
    /function pageNavMarkup\(mobile=false\)\{\s*const items = \[([\s\S]*?)\];/,
    "pageNavMarkup items",
  );
  const navItems = [...navBlock.matchAll(/\['([a-z]+)','([^']*)','([^']*)'\]/g)].map((m) => ({
    page: m[1],
    label: m[2],
    tip: m[3],
  }));
  assert(navItems.length === 5, `expected 5 nav items, got ${navItems.length}`);
  assert(
    navItems.map((n) => n.page).join("/") === "about/setup/operate/program/support",
    `nav order drifted: ${navItems.map((n) => n.page).join("/")}`,
  );
  for (const n of navItems) {
    assert(n.label && n.tip, `nav item '${n.page}' is missing a label or tooltip`);
  }

  // The footer is one template literal assigned to #siteFooter — slice it out, then read
  // only the static text (the ${…} interpolations are asset paths the app already owns).
  const footerHtml = grab(
    /\$\('#siteFooter'\)\.innerHTML\s*=\s*`([\s\S]*?)`;/,
    "#siteFooter template",
  );
  const fgrab = (re: RegExp, label: string): string => {
    const m = re.exec(footerHtml);
    assert(m && m[1] !== undefined, `chrome copy: footer ${label} not found`);
    return m![1].trim();
  };

  const footerCols = [...footerHtml.matchAll(/<div class="footer-col([^"]*)">([\s\S]*?)<\/div>/g)];
  assert(footerCols.length === 5, `expected 5 footer columns, got ${footerCols.length}`);
  assert(footerCols[0][1].includes("footer-brand"), "the first footer column is no longer the brand column");
  const footerLinkCols = footerCols.slice(1).map(([, , inner]) => {
    const title = /<span class="footer-title">([^<]*)<\/span>/.exec(inner);
    assert(title, "a footer column is missing its title");
    return {
      title: title![1].trim(),
      links: [...inner.matchAll(/<button class="footer-link"[^>]*>([^<]*)<\/button>/g)].map((m) =>
        m[1].trim(),
      ),
      context: [...inner.matchAll(/<span class="footer-context">([^<]*)<\/span>/g)].map((m) =>
        m[1].trim(),
      ),
    };
  });
  assert(
    footerLinkCols.every((c) => c.title && (c.links.length > 0 || c.context.length > 0)),
    "a footer column came out empty",
  );

  const chrome = {
    skipLink: grab(/<a class="skip-link" href="#main-content">([^<]*)<\/a>/, "skip link"),
    brand: {
      href: grab(/<a class="brand" href="([^"]*)"/, "brand href"),
      ariaLabel: grab(/<a class="brand"[^>]*aria-label="([^"]*)"/, "brand aria-label"),
      logoAlt: grab(/<img class="brand-logo brand-logo--overlay"[^>]*alt="([^"]*)"/, "brand logo alt"),
    },
    nav: {
      ariaLabel: grab(/<nav id="desktopNav"[^>]*aria-label="([^"]*)"/, "desktop nav aria-label"),
      mobileAriaLabel: grab(/<nav id="mobileNav" aria-label="([^"]*)"/, "mobile nav aria-label"),
      items: navItems,
    },
    account: {
      label: grab(/<button class="header-action account"[^>]*>([^<]*)<\/button>/, "account label"),
      ariaLabel: grab(/<button class="header-action account"[^>]*aria-label="([^"]*)"/, "account aria-label"),
    },
    menuButton: {
      ariaLabel: grab(/<button class="header-action icon-only menu-button"[^>]*aria-label="([^"]*)"/, "menu aria-label"),
    },
    documentTitleSuffix: grab(/document\.title=`\$\{DATA\.pageMeta\[page\]\.label\} — ([^`]*)`/, "document title suffix"),
    footer: {
      cta: {
        heading: fgrab(/<h2>([^<]*)<\/h2>/, "CTA heading"),
        lead: fgrab(/<div class="footer-cta-row"><p>([^<]*)<\/p>/, "CTA lead"),
        searchAction: fgrab(/data-open-search>([^$<]*)\$\{svg/, "search button label"),
        askAction: fgrab(/data-scroll-target="ask-hq">([^$<]*)\$\{svg/, "Ask HQ button label"),
        photoAlt: fgrab(/<img class="footer-photo"[^>]*alt="([^"]*)"/, "CTA photo alt"),
      },
      brand: {
        logoAlt: fgrab(/<img class="footer-brand-logo"[^>]*alt="([^"]*)"/, "brand logo alt"),
        blurb: fgrab(/<p>([^<]*)<\/p><p class="footer-arabic"/, "brand blurb"),
        arabic: fgrab(/<p class="footer-arabic" lang="ar" dir="rtl">([^<]*)<\/p>/, "Arabic tagline"),
      },
      columns: footerLinkCols,
      bottom: {
        tagline: fgrab(/<span class="footer-tagline">([^<]*)<\/span>/, "footer tagline"),
        copyright: fgrab(/<span class="footer-copy">([^<]*)<\/span>/, "footer copyright"),
      },
    },
  };

  // Owner-approved chrome copy edits (2026-08-12), asserted so a future mockup
  // edit cannot silently skip them:
  //  1. the footer blurb named a "checklist", a surface D-PP-f removed;
  //  2. the Help column carried prototype scaffolding ("...connect through the
  //     authenticated platform"), written from outside the build — inside the
  //     signed-in platform it describes itself in the third person.
  const BLURB_FROM = "every guide, checklist, video, and template";
  const BLURB_TO = "every guide, video, and template";
  assert(
    chrome.footer.brand.blurb.includes(BLURB_FROM),
    "footer blurb no longer contains the approved trim source — mockup copy changed?",
  );
  chrome.footer.brand.blurb = chrome.footer.brand.blurb.replace(BLURB_FROM, BLURB_TO);

  const HELP_LINE = "Live files and permissions connect through the authenticated platform.";
  const helpColumn = chrome.footer.columns.find((c) => c.context.includes(HELP_LINE));
  assert(helpColumn, "the prototype Help line was not found — mockup copy changed?");
  helpColumn!.context = helpColumn!.context.filter((line) => line !== HELP_LINE);

  console.log(
    `chrome copy extracted: ${chrome.nav.items.length} nav items + ${chrome.footer.columns.length} footer columns (2 owner-approved edits applied)`,
  );

  // ---- 3. Assets --------------------------------------------------------------------
  for (const dir of ["topics", "sections", "heroes", "misc"]) {
    await fs.mkdir(path.join(OUT_ASSETS, dir), { recursive: true });
  }

  // Topic photos: the owner's numbered PNG masters ("<sectionNum>.<indexInSection> <Title>.png").
  const masterFiles = (await fs.readdir(TOPIC_MASTERS).catch(() => {
    console.error(`Topic masters not found at ${TOPIC_MASTERS} — restore the OneDrive source-assets folder.`);
    process.exit(1);
  })) as string[];
  console.log("Topic images:");
  for (const section of sections) {
    let idx = 0;
    for (const group of section.groups) {
      for (const topic of group.topics) {
        idx += 1;
        const wanted = `${section.num}.${idx} `;
        const file = masterFiles.find((f) => f.startsWith(wanted) && f.toLowerCase().endsWith(".png"));
        assert(file, `no topic master starting with '${wanted}' for ${topic.slug}`);
        const masterTokens = normTitle(file!.slice(wanted.length)).split(" ");
        const titleTokens = normTitle(topic.t).split(" ");
        // Drift guard: same word count, each pair prefix-compatible (so the owner's
        // "Organizational" master still matches the topic's "Org").
        const titlesMatch =
          masterTokens.length === titleTokens.length &&
          masterTokens.every(
            (w, i) => w.startsWith(titleTokens[i]) || titleTokens[i].startsWith(w),
          );
        assert(
          titlesMatch,
          `master '${file}' does not match topic '${topic.t}' — numbering drift?`,
        );
        await writeJpeg(
          await fs.readFile(path.join(TOPIC_MASTERS, file!)),
          path.join(OUT_ASSETS, "topics", `${topic.slug}.jpg`),
          1200,
          80,
        );
      }
    }
  }

  // Section / journey photos: Setup.png etc.
  console.log("Section images:");
  for (const section of sections) {
    const file = masterFiles.find((f) => normTitle(f) === section.label.toLowerCase());
    assert(file, `no section master named ${section.label}.png`);
    await writeJpeg(
      await fs.readFile(path.join(TOPIC_MASTERS, file!)),
      path.join(OUT_ASSETS, "sections", `${section.id}.jpg`),
      1600,
      80,
    );
  }

  // Page heroes: base64-only in the mockup.
  console.log("Page heroes:");
  for (const [page, meta] of Object.entries(pageMeta)) {
    const { buf } = dataUriBuffer(meta.hero);
    await writeJpeg(buf, path.join(OUT_ASSETS, "heroes", `${page}.jpg`), 2000, 78);
  }

  // Misc ornaments/photos that exist ONLY as base64 in the mockup. The brand lockup
  // (logo_dark) is deliberately NOT extracted — public/assets/logo/ holds the canon.
  console.log("Misc assets:");
  const MISC: Array<[key: string, out: string]> = [
    ["tatreez", "tatreez"],
    ["footer_photo", "footer-photo"],
    ["branch", "branch"],
    ["sprig", "sprig"],
    ["topicHero", "topic-fallback"],
  ];
  const miscPaths: Record<string, string> = {};
  for (const [key, out] of MISC) {
    const { buf, ext } = dataUriBuffer(assets[key] as string);
    if (ext === "png") {
      // Ornaments may carry alpha — keep PNG, just cap the size.
      const outFile = path.join(OUT_ASSETS, "misc", `${out}.png`);
      await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).png().toFile(outFile);
      await reportSize(outFile);
      miscPaths[key] = `/assets/workspace/misc/${out}.png`;
    } else {
      await writeJpeg(buf, path.join(OUT_ASSETS, "misc", `${out}.jpg`), 2000, 80);
      miscPaths[key] = `/assets/workspace/misc/${out}.jpg`;
    }
  }

  // ---- 4. The committed spec --------------------------------------------------------
  const spec = {
    generatedBy: "scripts/extract-mockup-spec.ts",
    source: "docs/page-designs/PH - Palestine House Final Mockup.html (gitignored; OneDrive canon)",
    // Computed post-transform (the mockup's own stats block still counts 4 cards + extras).
    stats: {
      sections: sections.length,
      groups: allGroups.length,
      topics: allTopics.length,
      standard_resources: keptResources.length,
      templates: templates.length,
      booklets: data.stats.booklets,
    },
    // D-PP-f: the single surviving standard card (Simple guide). Templates carry their
    // own shared copy in templateCopy below and render as a grid, not as a card.
    resourceKinds: KEPT_KINDS.map((kind) => {
      const r = keptResources.find((x) => x.kind === kind)!;
      return { kind, key: r.key, title: r.title, icon: r.icon, desc: r.desc, action: r.action, use: r.use };
    }),
    templateCopy: { desc: templates[0].desc, use: templates[0].use },
    // Header/footer strings for the PP2 workspace chrome, verbatim from the mockup.
    chrome,
    pages: Object.fromEntries(
      Object.entries(pageMeta).map(([page, m]) => [
        page,
        {
          label: m.label,
          eyebrow: m.eyebrow,
          title: m.title,
          lead: m.lead,
          heroImage: `/assets/workspace/heroes/${page}.jpg`,
          heroPosition: m.position,
        },
      ]),
    ),
    journey: journey.map((j) => ({
      ...j,
      image: `/assets/workspace/sections/${j.page}.jpg`,
      imagePosition: journeyPos[j.page] ?? "50% 50%",
    })),
    sections: sections.map((s) => ({
      id: s.id,
      num: s.num,
      label: s.label,
      subtitle: s.subtitle,
      groups: s.groups.map((g) => ({
        slug: g.slug,
        name: g.g,
        description: g.desc,
        topics: g.topics.map((t) => ({
          slug: t.slug,
          elementSlug: ELEMENT_MAP[t.slug],
          title: t.t,
          description: t.desc,
          intro: t.intro,
          icon: t.icon,
          image: `/assets/workspace/topics/${t.slug}.jpg`,
          imagePosition: posOf(t.slug),
          standardDocs: t.resources.map((r) => ({ key: r.key, filename: r.filename, source: r.source })),
          // extras removed (D-PP-c ⑥). templates = the LIVE per-topic grid (D-PP-f):
          // these rows already exist in public.resources + Storage, matched by
          // element_id and badged by resources.code — nothing to re-upload.
          templates: t.templates.map((x) => ({ code: x.code || null, title: x.title, filename: x.filename, source: x.source })),
        })),
      })),
    })),
    miscAssets: miscPaths,
  };
  await fs.writeFile(OUT_SPEC, JSON.stringify(spec, null, 2) + "\n", "utf8");
  console.log(`wrote ${path.relative(ROOT, OUT_SPEC)}`);

  // ---- 5. Generated seed migration --------------------------------------------------
  const up: string[] = [];
  up.push(`-- 0028_platform_seed.up.sql`);
  up.push(`-- GENERATED by scripts/extract-mockup-spec.ts from the owner's final mockup (as amended by`);
  up.push(`-- D-PP-c: 3-card model, extras dropped) — do not hand-edit; re-run the script instead.`);
  up.push(`-- Idempotent: upserts keyed on stable natural keys (sections.slug,`);
  up.push(`-- groups (section_slug, slug), topics element_id via elements.slug).`);
  up.push(`-- Requires 0027_platform_ia. Safe to re-run; never touches elements/checklists/resources rows.`);
  up.push(``);
  up.push(`begin;`);
  up.push(``);
  up.push(`-- Sections (5 = the About landing + the 4 toolkit pages)`);
  const sectionRows: string[] = [];
  const aboutM = pageMeta.about;
  sectionRows.push(
    `('about', 0, ${sqlText(aboutM.label)}, null, ${sqlText(aboutM.eyebrow)}, ${sqlText(aboutM.title)}, ${sqlText(aboutM.lead)}, '/assets/workspace/heroes/about.jpg', ${sqlText(aboutM.position)}, null, null, null, null, 0)`,
  );
  for (const s of sections) {
    const m = pageMeta[s.id];
    const j = journey.find((x) => x.page === s.id)!;
    sectionRows.push(
      `(${sqlText(s.id)}, ${s.num}, ${sqlText(m.label)}, ${sqlText(s.subtitle)}, ${sqlText(m.eyebrow)}, ${sqlText(m.title)}, ${sqlText(m.lead)}, '/assets/workspace/heroes/${s.id}.jpg', ${sqlText(m.position)}, '/assets/workspace/sections/${s.id}.jpg', ${sqlText(journeyPos[s.id] ?? "50% 50%")}, ${sqlText(j.desc)}, ${sqlText(j.icon)}, ${s.num})`,
    );
  }
  up.push(`insert into public.platform_sections`);
  up.push(`  (slug, num, label, subtitle, eyebrow, title, lead, hero_image_path, hero_position,`);
  up.push(`   journey_image_path, journey_image_position, journey_desc, journey_icon, sort_order)`);
  up.push(`values`);
  up.push(sectionRows.map((r) => `  ${r}`).join(",\n") + ``);
  up.push(`on conflict (slug) do update set`);
  up.push(`  num = excluded.num, label = excluded.label, subtitle = excluded.subtitle,`);
  up.push(`  eyebrow = excluded.eyebrow, title = excluded.title, lead = excluded.lead,`);
  up.push(`  hero_image_path = excluded.hero_image_path, hero_position = excluded.hero_position,`);
  up.push(`  journey_image_path = excluded.journey_image_path, journey_image_position = excluded.journey_image_position,`);
  up.push(`  journey_desc = excluded.journey_desc, journey_icon = excluded.journey_icon,`);
  up.push(`  sort_order = excluded.sort_order;`);
  up.push(``);
  up.push(`-- Groups (10)`);
  const groupRows: string[] = [];
  for (const s of sections) {
    s.groups.forEach((g, gi) => {
      groupRows.push(`(${sqlText(s.id)}, ${sqlText(g.slug)}, ${sqlText(g.g)}, ${sqlText(g.desc)}, ${gi + 1})`);
    });
  }
  up.push(`insert into public.platform_groups (section_slug, slug, name, description, sort_order)`);
  up.push(`values`);
  up.push(groupRows.map((r) => `  ${r}`).join(",\n"));
  up.push(`on conflict (section_slug, slug) do update set`);
  up.push(`  name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;`);
  up.push(``);
  up.push(`-- Topics (33) — keyed on element_id resolved from the verified elements.slug map.`);
  up.push(`-- A missing element slug fails the not-null constraint loudly rather than seeding wrong.`);
  for (const s of sections) {
    for (const g of s.groups) {
      g.topics.forEach((t, ti) => {
        up.push(`insert into public.platform_topics`);
        up.push(`  (element_id, group_id, slug, title, description, intro, icon, image_path, image_position, sort_order)`);
        up.push(`select`);
        up.push(`  (select e.id from public.elements e where e.slug = ${sqlText(ELEMENT_MAP[t.slug])}),`);
        up.push(`  (select pg.id from public.platform_groups pg where pg.section_slug = ${sqlText(s.id)} and pg.slug = ${sqlText(g.slug)}),`);
        up.push(`  ${sqlText(t.slug)}, ${sqlText(t.t)}, ${sqlText(t.desc)}, ${sqlText(t.intro)}, ${sqlText(t.icon)},`);
        up.push(`  '/assets/workspace/topics/${t.slug}.jpg', ${sqlText(posOf(t.slug))}, ${ti + 1}`);
        up.push(`on conflict (element_id) do update set`);
        up.push(`  group_id = excluded.group_id, slug = excluded.slug, title = excluded.title,`);
        up.push(`  description = excluded.description, intro = excluded.intro, icon = excluded.icon,`);
        up.push(`  image_path = excluded.image_path, image_position = excluded.image_position,`);
        up.push(`  sort_order = excluded.sort_order;`);
      });
    }
  }
  up.push(``);
  up.push(`commit;`);
  up.push(``);
  await fs.writeFile(OUT_SEED_UP, up.join("\n"), "utf8");
  console.log(`wrote ${path.relative(ROOT, OUT_SEED_UP)}`);

  const down = [
    `-- 0028_platform_seed.down.sql`,
    `-- GENERATED by scripts/extract-mockup-spec.ts — removes the seeded IA rows only.`,
    `-- Never touches elements / checklist_items / resources / storage.`,
    ``,
    `begin;`,
    `delete from public.platform_topics;`,
    `delete from public.platform_groups;`,
    `delete from public.platform_sections;`,
    `commit;`,
    ``,
  ];
  await fs.writeFile(OUT_SEED_DOWN, down.join("\n"), "utf8");
  console.log(`wrote ${path.relative(ROOT, OUT_SEED_DOWN)}`);

  // ---- 6. Generated app spec module (PP2) -------------------------------------------
  // docs/workspace-spec.json is ~167 KB — far too heavy to import into the app. The
  // shell needs only the chrome copy plus the 5 page heroes and 4 journey cards, so
  // that slice ships as a small typed, committed module generated from the same
  // extraction. Regenerating the spec regenerates this, so the two cannot drift.
  // Everything below the shell (groups, topics, resources) comes from the DB via the
  // PP1 RPCs, never from here.
  const appSpecTs = [
    `/* GENERATED by scripts/extract-mockup-spec.ts — do not hand-edit; re-run the script.`,
    ` *`,
    ` * The workspace v2 shell copy, verbatim from the owner's final mockup (the same`,
    ` * extraction that writes docs/workspace-spec.json). Kept as a generated module`,
    ` * rather than a JSON import because the full spec is ~167 KB and only this slice`,
    ` * is needed at module scope. Section/topic content comes from the database. */`,
    ``,
    `export const WORKSPACE_CHROME = ${JSON.stringify(chrome, null, 2)} as const;`,
    ``,
    `export const PLATFORM_PAGES = ${JSON.stringify(spec.pages, null, 2)} as const;`,
    ``,
    `export const PLATFORM_JOURNEY = ${JSON.stringify(
      spec.journey.map((j) => ({
        page: j.page,
        num: j.num,
        icon: j.icon,
        title: j.title,
        desc: j.desc,
        action: j.action,
        image: j.image,
        imagePosition: j.imagePosition,
      })),
      null,
      2,
    )} as const;`,
    ``,
    `/* The one surviving standard card (D-PP-f) and the templates grid's shared copy.`,
    ` * Constant across all 33 topics in the mockup — asserted above — which is what`,
    ` * licenses shipping them as constants instead of database rows. */`,
    `export const RESOURCE_KINDS = ${JSON.stringify(spec.resourceKinds, null, 2)} as const;`,
    ``,
    `export const TEMPLATE_COPY = ${JSON.stringify(spec.templateCopy, null, 2)} as const;`,
    ``,
    `export type WorkspaceNavItem = (typeof WORKSPACE_CHROME.nav.items)[number];`,
    `export type PlatformPageKey = keyof typeof PLATFORM_PAGES;`,
    ``,
  ].join("\n");
  await fs.mkdir(path.dirname(OUT_APP_SPEC), { recursive: true });
  await fs.writeFile(OUT_APP_SPEC, appSpecTs, "utf8");
  console.log(`wrote ${path.relative(ROOT, OUT_APP_SPEC)}`);

  console.log("\nDone. Review docs/workspace-spec.json + the 0028 pair, then apply 0027 + 0028 on TEST.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
