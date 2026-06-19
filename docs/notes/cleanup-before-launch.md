# Cleanup Before Launch

> Status: **VERIFIED CLEAN — no removals required** (S7 Step 7, 2026-06-19).
> The repo is public (owner decision 2026-06-12). This note records the
> verification that no gated/proprietary content is exposed in the public repo.

Do not delete production assets from `/public/assets` (the art is used by live pages).

## Gated-content exposure — RESOLVED

The original concern (S5/§4): the public repo could expose the gated platform
content. **Verified that it does not** — the gated source content was never
committed and is gitignored:

- `.gitignore` excludes the three gated source trees (lines 38–40):
  `docs/page-copy/`, `docs/page-designs/`, `docs/source-assets/`.
  `git check-ignore docs/page-copy/06-elements` → ignored.
- **Git history is clean:** `git log --all --diff-filter=A` shows **0** commits
  ever added any file under those paths on any branch. They were gitignored from
  the start, so nothing sits in history either (history stays world-readable on a
  public repo — this is the check that `.gitignore` alone wouldn't cover).
- The 30 topic bodies, 200+ checklist items, 267 templates, focus areas, and
  academy content live only in (a) those gitignored OneDrive source dirs and
  (b) the Supabase DB behind RLS + the approval gate. They are not in the repo.

## No content is embedded in tracked files

- **Migrations (`supabase/sql/migrations/*.up.sql`) are schema-only.** The only
  INSERTs are infrastructure, not content: `0001`/`0008` new-user profile
  trigger, `0012` upsert inside `set_checklist_progress`, `0014` Storage bucket
  creation (`resources` private, `booklets` public), `0019` insert inside
  `submit_support_request`. No element bodies / checklist text / template names
  are seeded in any migration.
- **`scripts/ingest-content.ts`** reads content from the gitignored source dirs
  (`docs/page-copy/06-elements`, `docs/source-assets/resources`) and pushes it to
  Supabase; it embeds no content itself.
- **No booklet PDFs / source assets are tracked** (the two public booklets live
  in the public `booklets` Storage bucket; their source PDFs are gitignored).
- The 30 per-topic bodies are rendered from the DB at runtime (RPCs), never
  hardcoded in `src/`.

## Secrets — clear

- `.env.local` is gitignored **and** untracked; only `.env.example` is committed
  (verified S7 Step 1). No secret appears in the tree or diff.
- `.mcp.json` is committed by design and holds only the Supabase project refs +
  URL + `read_only` flags — no secret (see `docs/SUPABASE-MCP-SAFETY.md` §1).
  Project refs are public (they live in the Supabase URL), not credentials.

## What stays in the public repo (all non-sensitive)

Application source (`src/`), config, the SQL migrations + verification scripts,
the ingest tool, and the project docs (`docs/*.md`, `docs/code-reviews/`,
`docs/sprint-prompts/`, `docs/notes/`). None of these contain gated content or
secrets.

## Optional extra hardening (NOT required for launch)

If HQ ever wants belt-and-suspenders beyond the above: flip the GitHub repo to
private (loses Free-plan branch-protection enforcement), or relocate the
gitignored source content to a private side repo. Neither is needed — the public
repo exposes no gated content today.
