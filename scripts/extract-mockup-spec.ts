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

  // ---- 2b. Owner transform (D-PP-c, 2026-08-11): the 3-card topic model -------------
  // The mockup still shows 4 standard cards + "More guides" extras; the owner's
  // instruction supersedes it (PROJECT-STATUS §5 D-PP-c): each topic ships
  // Overview + Simple guide + ONE Template card; the checklist/watch cards and the
  // extras are dropped. The raw asserts above stay pinned to the mockup (source-
  // drift guards); everything emitted below is post-transform.
  const KEPT_KEYS = ["overview", "guide"];
  const KEPT_KINDS = ["OVERVIEW", "GUIDE"];
  for (const { topic } of allTopics) {
    topic.resources = topic.resources.filter((r) => KEPT_KEYS.includes(r.key));
  }
  const keptResources = allTopics.flatMap(({ topic }) => topic.resources);
  assert(keptResources.length === 66, `expected 66 kept standard resources, got ${keptResources.length}`);
  for (const { topic } of allTopics) {
    assert(topic.resources.length === 2, `${topic.slug}: expected 2 kept standard resources`);
  }
  assert(
    [...new Set(keptResources.map((r) => r.kind))].sort().join("|") === [...KEPT_KINDS].sort().join("|"),
    "kept standard resource kinds drifted from OVERVIEW/GUIDE",
  );

  // The Template card: kind/icon/desc/use are the mockup's constancy-asserted
  // template-row copy; only the title + action strings are new (owner sign-off
  // 2026-08-12 — the only two invented strings in the 3-card correction).
  const TEMPLATE_CARD = {
    kind: templates[0].kind,
    key: "template",
    title: "Template",
    icon: templates[0].icon,
    desc: templates[0].desc,
    action: "Download template",
    use: templates[0].use,
  };

  // Owner-approved intro trims where mockup copy referenced a removed card
  // (approved 2026-08-12; asserted so a future mockup edit can't silently miss).
  const INTRO_TRIMS: Record<string, [from: string, to: string]> = {
    "launching-a-new-house": ["use the checklist and templates below", "use the template below"],
  };
  for (const { topic } of allTopics) {
    const trim = INTRO_TRIMS[topic.slug];
    if (!trim) continue;
    assert(topic.intro.includes(trim[0]), `${topic.slug}: intro trim source text not found — mockup copy changed?`);
    topic.intro = topic.intro.replace(trim[0], trim[1]);
  }

  console.log("3-card transform applied: 66 kept std (of 132) / Template card synthesized / extras dropped / 1 intro trim");

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
    // The 3-card model (D-PP-c): the two kept kinds + the synthesized Template card.
    resourceKinds: [
      ...KEPT_KINDS.map((kind) => {
        const r = keptResources.find((x) => x.kind === kind)!;
        return { kind, key: r.key, title: r.title, icon: r.icon, desc: r.desc, action: r.action, use: r.use };
      }),
      TEMPLATE_CARD,
    ],
    templateCopy: { desc: templates[0].desc, use: templates[0].use },
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
          // extras removed (D-PP-c ⑥); templates kept as the PP6 CMS picker's candidate
          // list for the one owner-chosen template per topic (dormant coded rows).
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

  console.log("\nDone. Review docs/workspace-spec.json + the 0028 pair, then apply 0027 + 0028 on TEST.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
