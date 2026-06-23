# Palestine House — Design System

> **Companion to [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md).** TECH-ARCHITECTURE fixes the *mechanics* (Tailwind v4, shadcn/ui, `next/font`, `next/image`, Framer Motion). This file fixes the *taste* for Palestine House. **The canonical source of token values is the bound design system shipped with the mockups** (`/docs/page-designs/design-system/tokens/` — colors, fonts, typography, spacing — plus `/docs/page-designs/shared/site-chrome.css` and `shared/pages.css`). Port those values into `src/styles/globals.css` in Sprint 0.1 and keep this file in sync. Where this file and the design-system tokens disagree, **the tokens win** — update this file.

---

## 0. The non-negotiable

**The site must feel like a serious cultural institution — premium, editorial, warm, and alive — never a generic template, a brochure, a charity site, or franchise marketing.** Visual quality is what makes a prospective partner trust the institution before they read a word.

Universal anti-patterns (avoid everywhere):
- Generic centered-everything layouts with no rhythm or hierarchy.
- Stock-photo soup and clip-art icons — Palestine House uses **original, hand-painted-feeling artwork only** (ink linework + soft gouache washes on warm paper).
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
- **Art direction:** "One House, Many Rooms" — original ink linework + soft gouache washes on warm paper, blending into the warm-white page background; one warm light source; the recurring Palestinian arch; tatreez-derived accents (e.g. the section divider). Final artwork by asset ID lives in `/docs/page-designs/assets/art/` (mockup-referenced) with masters, textures, and empty-state marks in `/docs/source-assets/images/`.
- **Reference sites (adapt, never copy):** Akub (akub-restaurant.com) — rooted, chaptered "feel the place" scroll; Pioneer Works (pioneerworks.org) — time-of-day programming vignettes; Barbican & Southbank Centre "What's On" — editorial live-events strips; Serpentine — honest, anti-hype institutional voice.
- **The one-sentence test:** "When someone lands, it should feel **like stepping into a warm, confident cultural home that has nothing to prove.**"

> Don't mix registers. No bouncy springs, no neon gradients, no startup energy. Coherence beats novelty.

## 2. Light / dark decision

**This project: LIGHT ONLY.** The warm-paper aesthetic is the brand. Do not add a dark mode.

## 3. Color system

A rooted palette: **heritage green leads**, with muted red, ink black, and warm whites as refined fine-art tones. Red is an accent — used sparingly and intentionally (a highlight, a status, a thread of tatreez), never a second primary.

All values below are recorded **verbatim from `/docs/page-designs/design-system/tokens/colors.css`** (the canonical source — re-verify there if in doubt):

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

> Never eyeball or invent values. Hard rule from the token file: never arrange green / red / black / white as stripes or a triangle, and never render them at full flag saturation in UI chrome — color lives most powerfully in the artwork.

### CSS variables (`src/styles/globals.css`)

Tailwind v4 is **CSS-first**: `@import "tailwindcss";`, raw values in `:root`, exposed via `@theme inline` (shadcn's v4 setup). Map the design-system tokens to the shadcn variable names so every component inherits the brand (values from `design-system/tokens/colors.css`):

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
- **The header and footer are locked** (`shared/site-chrome.css` / `site-chrome.jsx`): identical on every page, never redesigned per page. Footer carries the brand block, four link columns — Explore (The Model · Experience · Live Programming) · Bring a House (Why bring one · Our support) · Account (Sign in) · Legal (Privacy · Terms · Contact) — the Apply block, the booklet lead-magnet block, and the tagline (per `/docs/page-copy/00-global/footer-copy.md`).

## 6. Component rules

Build on shadcn/ui primitives themed via §3 — not one-off overrides.

- **Buttons:** *primary* = heritage green (the Apply CTA), *secondary/outline* = ink outline on paper. Display-font weight for button text. Shape per the design-system radius (8px default, 12px cards, 16px feature cards) — restrained, never pill.
- **Nav tooltip (project-specific):** each of the four nav labels renders a styled hover one-liner via a single reusable Tooltip component — **never raw `title` attributes**. On mobile, the one-liner shows as a sub-label inside the shadcn `Sheet` menu. Copy owned by `/docs/page-copy/00-global/navigation-copy.md`.
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

Register parameters (locked): easing slow ease-out `[0.22, 1, 0.36, 1]`; reveal duration 300–600ms; reveal distance 16–24px (`--reveal-travel`); hover scale none / ≤1.02; **no parallax, no cursor effects, no springs, no auto-playing carousels.**

## 9. Image / media guidance

- **All artwork is original** ink-and-gouache illustration per the art direction — never stock photos, never generic icons. The final artwork ships in-repo by asset ID (PH-HOME-01, PH-EXP-01…03e, PH-BRING-01/02, PH-SUPPORT-01, PH-HIW-01/02/03 triptych, etc.): `/docs/page-designs/assets/art/` (the files the mockups reference) and `/docs/source-assets/images/` (masters plus textures `PH-TEX-*` and empty-state marks `PH-EMPTY-*`).
- All images via `next/image` — never raw `<img>`. `priority` above the fold; explicit `width`/`height` (CLS).
- All images under `/public/assets/`, organized by page (`/assets/home/`, `/assets/experience/`, `/assets/logo/`…), referenced by path. To update an image, replace the file in place, same filename.
- Aspect ratios per the mockups (e.g. PH-EXP-01: 16:9 desktop / 4:5 mobile; vignette pairs 4:5 with identical framing) — measure against the rendered mockup page, never guess. Compress to <~200KB where possible; meaningful `alt` text always.
- The final artwork already exists in `/docs` (above) — copy it into `/public/assets/` as pages are built. If a new asset is ever genuinely missing, use a neutral placeholder at the **correct aspect ratio** and flag it; never lock layout against the wrong ratio.

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

- **Experience** is the most artwork-heavy page on the site (hero artwork, day/night vignette pair, five-pillar block-print thumbnails, live strip); every other page is calmer by comparison.
- **Bring a House** is the densest public page (it absorbed How It Works) — pace it with generous whitespace; reuse the repointed stage triptych and milestone timeline patterns; do not redesign them.
- **Home** voices the full line "Bring Palestine House to Your City" as a section heading; the nav label stays short.
- **Live** is the public hero feature — editorial "what's on" treatment, warm and arch-framed, with graceful empty states ("Quiet right now — here's a recent night while the calendar fills.").

## 13. What not to over-customize

- Don't invent tokens beyond the bound design system (`/docs/page-designs/design-system/`); expand only when a real screen needs it, and record it here.
- No dark mode, no second primary color, no third typeface.
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
