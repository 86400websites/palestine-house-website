# Palestine House — Design System

> **Companion to [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md).** TECH-ARCHITECTURE fixes the *mechanics* (Tailwind v4, shadcn/ui, `next/font`, `next/image`, Framer Motion). This file fixes the *taste* for Palestine House.
>
> **v3 (DR1, 2026-07-02): the public shell runs the warm, cultural, photography-led v3 system.** Its canonical token source is the code itself — `src/styles/globals.css` (`:root` v3 raw tokens) + `src/styles/v3.css` (the public-scoped semantic remap) — built from the owner's reference images in `docs/source-assets/design-refs/v3/`. The old mockups + bound design system (`/docs/page-designs/…`) and the Claude Design V2 project are **retired as design inputs for the public shell**; they remain the reference for the **gated workspace**, which deliberately keeps the original green/paper system (§14) until its own refresh sprint. Two tiers, one token file: v3 values apply only inside `.ph-page` (+ `body:has(.ph-page)` for portalled UI), so the workspace is structurally unaffected. Where this file and the shipped tokens disagree, **the code wins** — update this file.

---

## 0. The non-negotiable

**The site must feel like a serious cultural institution — premium, editorial, warm, and alive — never a generic template, a brochure, a charity site, or franchise marketing.** Visual quality is what makes a prospective partner trust the institution before they read a word.

Universal anti-patterns (avoid everywhere):
- Generic centered-everything layouts with no rhythm or hierarchy.
- Stock-photo soup and clip-art icons — public imagery is the **owner's own warm, candlelit cultural photography** (v3: tatreez, oud nights, supper clubs, markets — real Palestinian life, never generic stock, never corporate imagery). The legacy ink-and-gouache illustrations survive only on not-yet-migrated pages and in the workspace.
- Cramped spacing — amateur sites are always too tight. White space is a feature here.
- A dead, static hero — but also never a flashy one. Calm ≠ static.
- Type with no hierarchy. Type is ~80% of the design.
- Hype mechanics of any kind: countdowns, "limited spots," urgency badges.

## 1. The brand brief (locked)

- **Brand name:** Palestine House
- **Audience:** prospective partners — serious operators, founders, and community builders considering bringing a House to their city — plus the cultural public browsing Live Programming. Smart, busy people; they expect dignity and substance, not persuasion tricks.
- **Core offer:** **Apply to bring a House** — the single public CTA (compact nav button "Apply"; supporting line *Every application is reviewed by HQ.*). Questions route to Contact. Never "create a free account," never "join now."
- **Personality:** warm · rooted · dignified · disciplined · premium.
- **Register / archetype:** **Editorial** with a minimal/premium lean — serif display type, generous whitespace, restrained refined motion. Think long-read cultural publications, not SaaS.
- **Art direction (v3, DR1 2026-07-02):** **warm cultural photography** — candlelit, heritage-rich scenes of Palestinian life (tatreez hands, oud nights, supper clubs, book talks, market days) over dark charcoal scrims and cream editorial surfaces; the **copper arch** from the "Our Culture Embassy" logo as the brand mark and accent metal; the recurring Palestinian arch; tatreez-derived details. Full-bleed photo heroes under a transparent header; straight-edged photography (the radial-dissolve treatment belongs to the legacy illustration system). Reference images + photo masters: `docs/source-assets/design-refs/v3/`. *(The previous "One House, Many Rooms" ink-and-gouache direction is retired for the public shell; its assets remain on not-yet-migrated pages + the workspace.)*
- **Reference sites (adapt, never copy):** Akub (akub-restaurant.com) — rooted, chaptered "feel the place" scroll; Pioneer Works (pioneerworks.org) — time-of-day programming vignettes; Barbican & Southbank Centre "What's On" — editorial live-events strips; Serpentine — honest, anti-hype institutional voice.
- **The one-sentence test:** "When someone lands, it should feel **like stepping into a warm, confident cultural home that has nothing to prove.**"

> Don't mix registers. No bouncy springs, no neon gradients, no startup energy. Coherence beats novelty.

## 2. Light / dark decision

**This project: LIGHT ONLY.** The warm-paper aesthetic is the brand. Do not add a dark mode.

## 3. Color system

### v3 public palette (DR1, 2026-07-02 — owner-approved)

The public shell's rooted, warm palette: **cream surfaces, warm charcoal depth, olive action, copper accent** — from the owner's reference images + the copper-arch logo. Applied via the scoped remap in `src/styles/v3.css` (`.ph-page, body:has(.ph-page)`); raw tokens in `globals.css` `:root`.

| Role | Token | Value | Notes |
|---|---|---|---|
| Page background | `--cream-50` | `#FAF6EE` | Warm cream page |
| Panels / secondary button | `--cream-100` | `#F6EFE4` | Culture-split panel, quiet CTA |
| Muted washes | `--cream-200` | `#EFE6D6` | Alt sections, hovers |
| Text + dark sections | `--char-900` | `#2A241E` | White on it 14.9:1 *(the footer moved to `--moss-950`, DR2)* |
| Photo scrims | `--char-950` | `#201A15` | Hero gradient base |
| Primary action (Apply) | `--olive-600` / hover `--olive-700` | `#5F6E49` / `#556340` | White text 5.5:1 / 6.5:1 |
| Olive tint | `--olive-100` | `#EAEDE2` | Active-nav wash |
| Copper accent | `--copper-700` on cream · `--copper-500` display · `--copper-300` on dark | `#8F5A2E` / `#B0713D` / `#C89A6A` | Eyebrows/links 5.0:1 · logo/numerals (large) · dark-section numerals 6.5:1 |
| On-dark accent | `--sage-300` | `#A9B58E` | Nav pill text, dark eyebrows (7.1:1) |
| Moss stage plates *(DR2)* | `--moss-700` | `#393C29` | Stage-card panels; white titles + cream body |
| Olive proof band *(DR2)* | `--moss-900` | `#20230E` | `.ph-section-olive` surface; copper numerals |
| Footer green-black *(DR2)* | `--moss-950` | `#1B1E14` | The inset footer card |
| Warm hairline | `--line-warm` | `#E7DFCF` | Borders/inputs on cream |
| Status | unchanged | — | Success/warning/error tokens carry over |

**DR2 additions (2026-07-06):** the three moss greens were sampled from the owner's DR2 mockups (stages plates · proof band · footer masters in `docs/source-assets/design-refs/v3/`) — **additive only**, no DR1 value changed; the mockups' warm-sand numerals resolve to the existing `--copper-300`, so no sand token was added. The owner's brand-palette poster (`refs/palette-poster.png`) is recorded as **reference, not a retune** — its near-duplicate values (`#F6F1E7` cream · `#2B241C` charcoal · `#B4552D` terracotta …) stay deliberately unadopted (owner decision, 2026-07-06).

Scoping rule: **never change a legacy `:root` value for a v3 need** — add a v3 raw token and remap the semantic alias inside the `.ph-page` scope. The workspace consumes the same aliases at their legacy values.

### Legacy palette (gated workspace + not-yet-migrated public layouts)

Heritage green leads, muted red accents, warm paper — recorded verbatim from the retired `design-system/tokens/colors.css`; still the live system inside the gated shell (§14):

| Token | Value | Use |
|---|---|---|
| Brand primary | `#1A6B4A` (heritage green, `--green-600`) | Apply CTA, active nav, key accents, links — the single action color |
| Brand primary hover / pressed | `#0A5C42` (`--green-700`) | Hover state for primary elements, link hover |
| Brand primary tint | `#E4EEE8` (`--green-100`); faintest wash `#F1F7F3` (`--green-50`) | Active nav wash, success backgrounds |
| Accent | `#A8322D` (muted red, `--red-600`); pressed `#8A2823`; tint `#F4E4E2` | Sparing accents only — eyebrow labels, destructive/blockers, tatreez details |
| Foreground / text | `#1A1A17` (warm near-black, `--ink-900`); strong secondary `#3A3A35` | Body text, headings |
| Secondary text | `#6B6A63` (`--stone-500`); placeholder/disabled `#908E85` | Supporting copy |
| Border / divider | `#E6E2D9` (`--line-200`); strong `#C4BFB4` | Borders, dividers, inputs |
| Background (page) | `#FFFFFF` | Page background — the warm feel comes from the surfaces below, not the page itself |
| Hero wash | `#F6F1E8` (warm paper, `--paper-150`, `--surface-hero`) | Public hero sections |
| Surface / card | `#FAF8F3` (warm white, `--paper-100`) | Cards, panels |
| Muted / alt section | `#F2EEE5` (`--paper-200`, `--surface-muted`) | Alternate section backgrounds |
| Status | success `#1A6B4A` · warning `#B58A2D` (bg `#F6EEDB`) · error `#B23A2E` (bg `#F6E5E2`) | Status error is deliberately distinct from the accent red |

> Never invent values ad hoc — v3 values were eyeballed from the owner's reference images **once, with owner sign-off (DR1-2 gate)**; everything since reads the tokens. **Hard rule (carries into v3 unchanged):** never arrange green / red / black / white as stripes or a triangle, and never render them at full flag saturation in UI chrome — color lives most powerfully in the imagery.

### CSS variables (`src/styles/globals.css` + `src/styles/v3.css`)

Tailwind v4 is **CSS-first**: `@import "tailwindcss";`, raw values in `:root`, exposed via `@theme inline` (shadcn's v4 setup). The `:root` block below is the **legacy mapping** the workspace still runs on; the **v3 public shell re-points these same semantic aliases** inside `.ph-page, body:has(.ph-page)` (see `v3.css`) — `@theme inline` keeps live `var()` chains, so utilities like `bg-primary` resolve per-element and the remap needs zero component changes:

```css
@layer base {
  :root {
    --brand-primary: #1A6B4A;
    --brand-primary-hover: #0A5C42;
    --brand-accent: #A8322D;

    --background: #FFFFFF;          /* page is white; warmth comes from surfaces */
    --foreground: #1A1A17;          /* ink-900 */
    --card: #FAF8F3;                /* paper-100, warm white */
    --card-foreground: #1A1A17;
    --popover: #FAF8F3;
    --popover-foreground: #1A1A17;
    --primary: #1A6B4A;
    --primary-foreground: #FFFFFF;
    --secondary: #F2EEE5;           /* paper-200, muted warm tint */
    --secondary-foreground: #1A1A17;
    --muted: #F2EEE5;
    --muted-foreground: #6B6A63;    /* stone-500, warm grey */
    --accent: #F6F1E8;              /* paper-150 — subtle warm background accent */
    --accent-foreground: #1A1A17;
    --border: #E6E2D9;              /* line-200, warm light */
    --input: #E6E2D9;
    --ring: #1A6B4A;
    --radius: 8px;                  /* default; 12px cards, 16px feature cards — never pill */
  }
}
```

Also port the page primitives the mockups rely on: the `design-system/tokens/spacing.css` scale (plus `--space-7: 1.75rem` and `--space-14: 3.5rem` defined in `shared/pages.css`), `--surface-hero` (`#F6F1E8`), `--measure`, `--reveal-travel`, `--duration-slow`, `--ease-out`, and the tatreez `.page-divider`.

Verify every text/background pair passes **WCAG AA** — especially heritage green on warm paper (use it at sizes/weights that pass, or the darker hover green for small text).

## 4. Typography

- **Display font:** **Spectral** — headings, the editorial voice. Serif = institutional, literary, rooted.
- **Body font:** **Inter** — paragraphs, UI, forms, labels.
- **Fallbacks:** `Georgia, serif` for display; `system-ui, sans-serif` for body.
- **Loading rule (non-negotiable):** via **`next/font`** (`Spectral`, `Inter` from `next/font/google`) — never a `<link>` to Google Fonts. Load only the weights the `design-system/tokens/typography.css` scale actually uses.

```css
@theme inline {
  --font-display: var(--font-display), Georgia, serif;
  --font-body: var(--font-body), system-ui, sans-serif;
}
```

### Type scale

Port the scale from `design-system/tokens/typography.css`. Known anchors from the mockups: page-hero `h1` uses `clamp(2.6rem, 2.2vw + 1.6rem, 4rem)`; body never below 16px; line-height ~1.55 for body, ~1.1 for h1. All-caps reserved for small tracked eyebrow/category labels only — never headings, nav, or body. One `<h1>` per page matching intent; `h1 → h2 → h3` in order, never skipped.

## 5. Layout principles

- **Max content width** and gutters per `design-system/base.css` / `shared/pages.css` (`.ph-page` container queries; `--measure` for prose width).
- **Section vertical rhythm:** generous (`--space-16`-class hero padding; tatreez divider between major sections). Default to more whitespace.
- Editorial asymmetry where it earns its place — artwork in negative space (e.g. the Experience hero headline sits in the artwork's negative space), offset vignettes, the day/night paired panels. Coherent, never chaotic.
- Every scroll reveals something — but **calmly**: a new section treatment, not a new gimmick.
- Responsive from **320px** up; tap targets ≥ 44×44px.
- **The header and footer are one locked system** (`src/components/layout/site-header.tsx` / `site-footer.tsx` + the `.phx-*` CSS): identical on every public page, never redesigned per page. v3 (DR1): the header is warm cream glass with the `BrandLogo` lockup (DR2.1 — the full "Our Culture Embassy" logo PNG; §9), and carries a sanctioned **transparent overlay state** on photo-hero routes (`OVERLAY_ROUTES` in site-header.tsx — the six photo-hero routes since DR1-9) that solidifies on scroll or when any menu opens — one system with two states, not a per-page redesign. The footer (v3 · DR2-5, owner mockup) is a **moss green-black (`--moss-950`) inset rounded card** — the cream page shows around it — holding the Apply band, the brand block (tagline + the Arabic line بيت فلسطين في كل مدينة, `lang="ar" dir="rtl"`, system-font fallback), four link columns with white caps titles — Explore (The Model · Experience · Live Programming) · Bring a House (Our Support · Why bring one.) · Account (Sign In) · Legal (Terms of Use · Privacy Policy · Contact) — and the centered tagline between hairlines with the crossed-olive sprig (on phones the inset slims and the sprig scales to 56px — the ornaments stay at every width, owner decision 2026-07-06). *(The booklet lead-magnet block left the footer in the pre-S13 sprint — it lives only in the home-hero dialog.)*

## 6. Component rules

Build on shadcn/ui primitives themed via §3 — not one-off overrides.

- **Buttons:** on the public shell (v3), *primary* = olive (`--olive-600`, the Apply CTA) and *secondary/outline* = the quiet cream button (`--cream-100`, borderless) — both restyled purely via the scoped tokens/CSS, `button.tsx` untouched; the opt-in `.v3-cta` modifier (uppercase, tracked, small) is for the hero + footer Apply CTAs only, never blanket. In the workspace, *primary* stays heritage green. Shape per the design-system radius (8px default, 12px cards, 16px feature cards) — restrained, never pill.
- **Nav tooltip (project-specific):** each of the four nav labels renders the **same short sub-label the mobile `Sheet` menu uses** — one simple line on hover, identical wording on every device (owner fix, 2026-07-06; the long `navigation-copy.md` one-liners are retired from the hover) — via a single reusable Tooltip component, **never raw `title` attributes**.
- **Forms (react-hook-form + zod):** light surface, 1px warm border; focus ring uses `--ring`; error = colored border **and** text message (never color alone); labels above inputs. The Apply form is the flagship form — calm, single column, dignified.
- **Cards / surfaces:** consistent radius, subtle warm border, gentle lift on hover (≤1.02). Session cards (Live Programming) are one shared component reused on `/live` and the Experience live strip — never two implementations.
- **Status badges (Live now / Upcoming / Recording):** color + text, never color alone.
- **Navigation:** logo top-left (→ Home); four labels (The Model · Experience · Bring a House · Our Support) + Sign in (text) + **Apply** (primary CTA) right; mobile uses the shadcn `Sheet`. Active state by weight + green mark. Live Programming is not a top-nav label — it surfaces via Home, the footer, and the Experience live strip.
- **Gated shell:** persistent left sidebar (Welcome · Stages · Managing & Operating · Programming/Live Programming · Academy · Resources · House Applications · Account, Support pinned at bottom — Resources included per the accepted deviation in `PROJECT-STATUS.md` §4); pending state shows items visible but locked (lock icon + "Locked" label, never color alone).

## 7. shadcn/ui & Tailwind v4 usage

- Add shadcn components as needed; theme through the §3 CSS variables. Prefer composing primitives over hand-rolling.
- All tokens live as CSS variables in `src/styles/globals.css`; **no hardcoded hex in markup** — a rebrand must be a one-file change.
- Utility classes for layout/spacing; extract a component when a class string repeats. Stay on the spacing scale; no magic pixel values.

## 8. Motion / Framer Motion guidelines

**This project's register: RESTRAINED / EDITORIAL.** "Calm, deliberate motion. Gentle reveals as you scroll — refined, never flashy."

Universal mechanics:
- Scroll-triggered reveals (`whileInView`) matching the mockups' `.rv` pattern: fade + small translate-up, entrance only.
- Stagger lists/grids ≈60–100ms apart.
- Page transitions smooth and short (200–300ms).
- Subtle hover micro-interactions on interactive elements.
- Wrap in `LazyMotion` + `domAnimation`; reusable primitives in `src/components/motion/` (`FadeIn`, `SlideUp`, `Stagger`, `Reveal`).
- **Always respect `prefers-reduced-motion`** via `useReducedMotion` — the mockups already gate reveals behind it; the build must too.

Register parameters (locked): easing slow ease-out `[0.22, 1, 0.36, 1]`; reveal duration 300–600ms; reveal distance 16–24px (`--reveal-travel`); hover scale none / ≤1.02; **no parallax, no cursor effects, no springs, no auto-playing carousels** — *one sanctioned exception (owner decision 2026-07-02, DR1-8, recorded §4 D-DR1): the Home "Inside a Palestine House" strip drifts as a slow continuous CSS marquee (~60s loop, pauses on hover, `prefers-reduced-motion` falls back to a manual scroller). **D-DR3.1 — RETIRED (owner decision 2026-07-08, DR3.1.1):** the `/model` "cultural embassy" collage was briefly a second auto-motion exception (a phase-staggered cross-fade); at the owner's request the animation was **removed** — the collage is now a **static** grouped-card layout (`embassy-gallery.tsx`, no client JS). No auto-motion exception applies to `/model` anymore; the Home "Inside a Palestine House" marquee (D-DR1) is again the only sanctioned exception. Do not add auto-motion without the same explicit sign-off.*

## 9. Image / media guidance

**v3 (DR1): the public shell is photography-led.** The imagery is the **owner's own photography** — warm, candlelit, culturally rooted scenes; never stock, never corporate.

- **Photos** render through `src/components/shared/photo.tsx` (`PHOTO_SOURCES`, ids `ph-photo-*`) with the straight-edged `.v3-photo` frame — cover crops, optional 12px radius, **no radial dissolve** (that treatment belongs to the legacy illustration system and stays in `Artwork` for the not-yet-migrated pages). Optimized files ship in `public/assets/photos/` (≤2000px, ≤~500KB); **masters + the owner's reference mockups live in `docs/source-assets/design-refs/v3/`** (gitignored — OneDrive is canon). Regenerate outputs with `pnpm tsx scripts/optimize-photos.ts` (idempotent; sharp is a devDependency only).
- **The brand lockup** is the owner's full "Our Culture Embassy" logo — copper arch + serif `PALESTINE HOUSE` + tracked tagline + ™. `BrandLogo` (`src/components/layout/brand-logo.tsx`) ships it as two keyed PNGs and picks one per surface **purely in CSS** (DR2.1, owner decision 2026-07-06 — supersedes the DR1 "mark PNG + real-text wordmark, tagline not in chrome" scheme): the **color lockup** (`ph-logo-lockup.png`, charcoal text) on the solid cream header; the **white-text lockup** (`ph-logo-lockup-dark.png`, copper arch kept) on the moss footer and the transparent `[data-overlay]` photo-header state (whose charcoal text would vanish); the **copper arch mark alone** (`ph-logo-mark.png`) at ≤420px, where the full lockup + Apply + hamburger won't fit. All three are aria-hidden; the header instance is a link with `aria-label`, the footer instance carries an sr-only "Palestine House — Our Culture Embassy". The dark lockup is derived from the color master (charcoal→white, copper kept) in `scripts/optimize-photos.ts`, pixel-registered to the color one. The favicon `src/app/icon.svg` is a simplified hand vector of the arch; apple-icon + the OG image composite the mark PNG. Follow-up: request the designer's SVG/reverse masters.
- **Photo heroes:** full-bleed `next/image` `fill` + `priority` + `sizes="100vw"`, under the transparent header, with the two-layer charcoal scrim (`.v3-hero-scrim`) — verify AA with a contrast picker on the rendered page, not just math.
- The legacy PH-* illustrations remain in `public/assets/art/` and keep serving the not-yet-migrated public pages + workspace; don't delete them until DR-series sprints retire their pages.
- All images via `next/image` — never raw `<img>`. `priority` above the fold only; explicit dimensions or a fixed-size frame (CLS). Meaningful, neutral `alt` text always (describe the scene; don't assert real events or identify people).
- If an asset is genuinely missing, use a neutral placeholder at the **correct aspect ratio** and flag it; never lock layout against the wrong ratio.

## 10. Responsive design rules

- Mobile-first; verify every breakpoint from **320px** up. Single column on mobile.
- 16px+ body; tap targets ≥44×44px; no horizontal scroll.
- The nav one-liners move into the mobile Sheet as sub-labels.
- Test on a Vercel Preview at multiple widths before merge.

## 11. Accessibility rules (WCAG AA minimum)

- Contrast AA on every brand pair (4.5:1 body, 3:1 large text/UI) — verify green-on-paper combinations specifically.
- Never color alone for meaning (badges, errors, gate states pair color with text/icon).
- Keyboard-navigable with a visible focus ring (`--ring`); the nav Tooltip content must be reachable for keyboard and screen-reader users, not hover-only.
- Skip-to-content link on every page; correct `lang` on `<html>` (English at launch; structure must not block adding languages later).
- Semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`); proper heading order.
- Respect `prefers-reduced-motion` (§8).

## 12. Per-page art notes (public shell)

- **Home is the v3 benchmark (DR1, 2026-07-02 · stages/proof finalized DR2, 2026-07-06):** full-bleed tatreez photo hero (transparent header, scrim, Apply + "Explore the model" CTAs, mini-features band) → cream/photo culture split (arch-café) → the six-photo "Inside a Palestine House" auto-drift marquee → the **moss photo-card stages** (arch-notch number plates + the Al-Aqsa line-art beside the grid, DR2-3) → the **olive proof band** (branch ornaments, stats over the flowing caption, DR2-4) → the platform split on the film-screening photo band. New DR-series pages measure against it; the DR2 mockups live in `docs/source-assets/design-refs/v3/refs/`. *(The booklet lead magnet and the nav mega-menus were removed at DR1-8 — owner decisions, §4 D-DR1.)*
- **The Model (`/model`) is v3-complete (DR3.1, 2026-07-07 · refined DR3.1.1, 2026-07-08)** — built to the owner's section mockups (`docs/source-assets/design-refs/v3/refs/`), copy adopted from those mockups: photo hero (unchanged, DR1-9) → the **"cultural embassy" collage** (left copy + copper flourish + olive sprig; three subtle **cream cards** café / venue / community, each a **static** big photo over three thumbnails). **DR3.1.1 (owner):** the auto-rotation was removed (the collage is static — D-DR3.1 retired); the photos **fill their 4/5 frames edge-to-edge** (`object-fit: cover`) inside the cream cards (an original-ratio `contain` pass was tried and reverted — the letterbox on mixed portrait/landscape sources looked off); a copper **tatreez rosette** marks each set (the venue set is ordered so its hero is a portrait shot); the old **green vertical side-strip was removed** and reworked into a **horizontal tatreez band** (now only at the footer CTA); the section gap before "Three layers" was collapsed. → **"Three layers, one team"** arches (olive / sand / terracotta, key / house / Aswātna seal, fills sampled from the mockup) → the **"The shared promise"** dark moss band (gold branch + three gold circle-icons) → **"Three things, never negotiable"** cream number cards + the **"What this is"** check/✗ columns around a round still-life + "Culture leads." The closing "Could your city hold the next Palestine House?" invite was **promoted into the footer** (below) rather than duplicated on the page.
- **Footer closing CTA (DR3.1, owner decision 2026-07-07 · refined DR3.1.1, 2026-07-08):** the footer's apply band is the rich invite band — the doorway invite photo **filling a tall, wide left panel edge-to-edge** (`object-fit: cover`) + "Could your city hold the next Palestine House?" + gold diamond divider + lead + **terracotta Apply / gold-outline See-our-support** + gold branch, with a **horizontal tatreez band anchoring the base** (the ornate motif reworked from the retired vertical embassy side-strip; `TatreezBand` → `.tatreez-band`, tile `ph-photo-embassy-tatreez-band.jpg` from `scripts/make-tatreez-band.ts`) in place of the old white hairline — identical on every public page (`site-footer.tsx` `.phx-footer-cta*`), so there is one premium closing CTA site-wide.
- **Our Support (`/our-support`) is v3-complete (DR3.3, 2026-07-14)** — built to the owner's section mockups (`docs/source-assets/design-refs/v3/mockups/`), copy adopted from those mockups: a **split hero** (cream copy + the 10 / 30 / 267 / 120 proof row · a rounded, full-height flag photo panel on the right; the standard page-hero height — NOT a full-bleed overlay, so `/our-support` was removed from the header `OVERLAY_ROUTES`) → **The full playbook** (premium white artefact cards — a sage icon-chip on top + serif title, the owner's card sample) → **The Standard** (uppercase head + copper diamond ornament · three matted **arch** photos joined by copper khatam stars · centred PALESTINE HOUSE lockup + "One name / One shared standard / Local character") → **Aswātna** (full **muted-red** band `#9b361e` · the **gold** Aṣwātna seal `public/assets/partners/aswatna-mark-gold.png` · three captioned photos Before opening / At launch / After launch) → **The Backing** (copper-outline "View the 120-day launch" CTA · a horizontal **01·02·03 numbered timeline** — moss / terracotta / gold nodes on a red connecting line, vertical per-step connectors under 620px) → **What you're responsible for** (a dark **forest-green** band `#323621` with four ongoing-support topics + line icons, over a split — the lantern-lit doorway photo bleeding left, "You bring" / "We make sure" checklists around a copper khatam-star divider). New page-scoped `.support-*` classes; node/band colours **sampled** from the mockups; AA verified (cream on the red ≈ 6.6:1, cream on the green ≈ 11:1, and the gold timeline node deepened to `#8f5d18` so the numeral clears 4.5:1). The **`.sup-artefacts` toolkit grid is the only block kept** (restyled to the owner's premium cards + linked to `/focus-areas`) — the old closing `.statement` "Behind every House" CTA was **removed** in the feedback round so the site-wide footer CTA is the sole page closer (matches DR3.1).
- **v3 page-hero copy is left-aligned (owner, 2026-07-14):** `.v3-page-hero-inner` now fills its width (`width:100%`) so the copy + CTAs sit at the container's **left** edge on `/model` `/experience` `/bring-ph` `/apply` (previously the `.ph-container` shrink-wrapped + centred them mid-page). The Home hero (`.v3-hero`, separate class) is unchanged.
- **All other public pages are in the intended intermediate state:** old layouts + legacy illustrations rendered in v3 colors/chrome, awaiting their DR redesigns — don't "fix" them backward, and don't redesign them ad hoc outside a sprint.
- **Experience** was the most artwork-heavy page (hero artwork, day/night vignettes, five-pillar thumbnails, live strip) — its v3 pass should lead with the strongest photography.
- **Bring a House** is the densest public page — pace it with generous whitespace when its v3 pass comes.
- **Live** is the public hero feature — editorial "what's on" treatment with graceful empty states ("Quiet right now — here's a recent night while the calendar fills.").

## 13. What not to over-customize

- Don't invent tokens beyond the shipped system (`globals.css` `:root` + the v3 scoped remap in `v3.css`); expand only when a real screen needs it, and record it here. Never mutate a legacy value to serve a v3 need — add a v3 token instead (§3 scoping rule).
- No dark mode, no third typeface. Copper is an **accent metal**, olive the single action color — don't promote either into a second primary.
- Don't hand-build what shadcn/ui provides; theme the primitive.
- Don't over-animate — restraint *is* the brand.
- Don't finalize layouts against placeholder artwork at the wrong aspect ratio.
- Don't redesign the locked header/footer or the shared session card — one component, reused.

## 14. Workspace premium layer (S8 — locked design input)

**Why this exists.** The MVP shipped the gated/workspace pages structurally faithful to the `member-workspace/` mockups but *visually plain* — a notch below the live public shell (a senior-design review confirmed it reads like a clean admin panel rather than "a serious cultural institution"). S8 closes that gap. **This is finish, not a redesign, and it introduces no new design language:** it applies the public shell's *already-approved* patterns to the workspace's sound structure, entirely within the §3/§8 tokens. The `member-workspace/` mockups stay the **structural** reference; the public shell (`src/app/live/page.tsx`, `src/components/shared/`, the public `globals.css` classes) is the **premium** reference. **`/live` is the benchmark — do not edit it.** Behavior is untouched (see the S8 prompt). Decision: `PROJECT-STATUS.md` §4 **D-S8-a**.

The kit (build once as shared workspace primitives in step 8a, then apply per page):

1. **Calm entrance motion.** Wire the existing `Reveal` / `FadeIn` / `Stagger` (`src/components/motion/reveal.tsx`) into workspace sections — currently used by *zero* gated pages, the single biggest premium lever. Entrance-only fade + 16–24px translate-up, stagger 60–100ms, **always** behind `prefers-reduced-motion` (§8). **First confirm `LazyMotion`/`domAnimation` wraps the workspace tree** (these use `m`) — add it to the workspace shell if the public chrome owns it today.
2. **Rhythm + visual breaks.** Use `TatreezDivider` between major sections and alternate warm washes (`--paper-150/200`, `surface-hero`) so pages stop reading as one undifferentiated column of cards.
3. **Elevated empty / loading states.** One reusable warm empty-state (icon or `PH-EMPTY-*` mark slot + paper wash + a restrained accent) replacing plain text boxes; add `loading.tsx` where a route fetches.
4. **Card-lift + warm borders.** Interactive cards/rows get a ≤2px hover lift + `--shadow-md` — warm border **or** soft shadow, never both heavy (consistent with §6).
5. **Dashboard hero.** Make the snapshot the page anchor: a stat grid with lucide icons + a more present progress bar, showing the current stage + the Design & Build % (milestone gates retired site-wide — D-S8-c; never render gate UI or invent gate data).

**Guardrails (same as the rest of this doc):** locked header/footer/sidebar *structure* + nav grouping unchanged; **copy verbatim** + **proof numbers 10 · 30 · 200+ · 267 · 120-day launch**; approval-gate server checks untouched; AA + `prefers-reduced-motion` + colour-plus-text/icon status grammar held; **color lives in artwork, not chrome**; **no new dependencies**; reuse existing `.ws-*/.bld-*/.dash-*/.res-*/.vid-*/.acct-*` classes — extend, never rebuild. Ready-to-run prompt: `docs/sprint-prompts/s8-workspace-visual-polish.md`.
