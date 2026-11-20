# EXP1 — Experience: Special thanks to Casa Palestina — independent review

| | |
|---|---|
| **Date** | 2026-11-20 |
| **Range** | **Codex:** `19f0288..92a30ee` → APPROVE |
| **Branch / PR** | `claude/exp1-special-thanks` / [#112](https://github.com/86400websites/palestine-house-website/pull/112) |
| **Scope** | One closing section on `/experience` (`section#special-thanks`) and its scoped styles in `pages.css`, plus the tracker and sprint-record changes. No route, gate, RPC, migration, middleware, env var, header or CSP change. |
| **Verdict** | **APPROVE.** No blocking issues, no non-blocking issues. |

## Why this review was run

EXP1 is public UI only, so it isn't a D-SYS-1 risky sprint. The owner runs Codex before every
merge anyway.

## Findings

| Category | Result |
|---|---|
| Blocking | None. The section renders static content and an external link. It adds no private data access, no client boundary and no signup path. |
| Non-blocking | None identified. |
| Missing checks | The owner's visual spot-check on the deployed Vercel Preview, still pending. |

## What the reviewer checked and found clean

- The section is the last child of `<main>`. Its accessible name comes from the visible heading,
  and its copy and photo description match the owner's mockup.
- The Lisbon link takes keyboard focus with a visible outline. It goes to the intended
  destination, in a new tab, with `noopener noreferrer`.
- The breakpoint was tested on both sides. The section stacks at 320px and 720px and shows two
  columns at 721px and 1440px, with no horizontal overflow at any tested width.
- Typecheck, lint on the changed page, all 74 public-copy checks and `git diff --check` pass.
- GitHub CI and the Vercel deployment both report success for `92a30ee`.

## Note on the range

The commit that adds this record touches only `docs/`, so the approval over `..92a30ee` stands.
That's the same documented exemption L1 used.
