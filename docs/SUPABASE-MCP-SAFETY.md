# Supabase MCP Safety & Governance

> The rulebook for how Claude Code (and any agent) may use the **Supabase MCP** in this repo. Companion to [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md), [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md), [`WORKFLOW.md`](./WORKFLOW.md), and the agent rules in [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md).

## Purpose

The Supabase MCP lets Claude talk to a Supabase project **directly** — list tables, read rows, run SQL, check logs, inspect config. This repo uses **two separate MCP connections** with deliberately different power levels:

| Connection | Database | Power | Claude may… |
|---|---|---|---|
| `supabase-test` | **Test / non-production** | **Read + write** | Draft SQL, run it, read results, iterate until clean |
| `supabase-prod-readonly` | **Production** | **Read only** | Verify (read) after the human runs SQL by hand. **Never write.** |

The governing principle that never changes:

> **Claude builds and proves on test. The human ships to production. Claude may _verify_ production but never _change_ it.**

This keeps the proven workflow intact — Claude drafts & tests the SQL — saves the final, verified SQL to the Supabase folder — **the human runs it on production by hand** — Claude reads production (read-only) to confirm.

---

## 1. The non-negotiables (🔴 = never violate)

- [ ] 🔴 `supabase-test` is scoped (`project_ref=sdszcralogcrujtyghig`) to a Supabase project that is **genuinely separate from production**. A test write must never be able to reach production data.
- [ ] 🔴 `supabase-prod-readonly` is **read-only** (`read_only=true`) and scoped (`project_ref=jwogtqizqujwhbvpoziu`). Claude **cannot** write, update, delete, or drop in production through the MCP — ever.
- [ ] 🔴 **Claude never writes to production through any channel.** Every production change is run **by the human**, by hand, via the Supabase SQL Editor.
- [ ] 🔴 Neither connection uses the Supabase **secret key** / `service_role` / JWT secret / DB password. Both authenticate via Supabase **browser login (OAuth)** — no secret in `.env.local`, none in `.mcp.json`.
- [ ] 🔴 `.mcp.json` is committed (it holds only the URL + project ref + flags — safe). **No secret ever goes in it.**
- [ ] 🔴 The two connections are **named so the environment is unmistakable** — `supabase-test` and `supabase-prod-readonly`. Never a single ambiguous `supabase`.

If any box can't be ticked, **stop and fix the connection before using the MCP**.

---

## 2. `supabase-test` — what Claude may do (read + write)

On the **test** project, Claude has the room to actually work:

- **Inspect schema first** — tables, columns, types, indexes, extensions — so SQL matches reality, never a guess.
- **Write & run SQL** — create/alter tables, insert test data, apply RLS policies — directly on the test DB.
- **Read back to verify** — confirm the change did exactly what was intended.
- **Iterate** — fix and re-run until the result is **100% clean with zero errors**.
- **Check RLS** — confirm Row Level Security is enabled + policies correct on user-reachable tables.
- **Read logs & run advisors** — debug failures, pull security/performance notices for [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md).
- **Generate TypeScript types** from the verified schema.

> Even with write access on test, Claude **still saves the final, verified SQL to the Supabase folder** (`supabase/`), including a matching **`.down.sql`** and the **RLS policies**. That saved file — proven on test — is what the human runs on production. Writing to test *feeds* the folder discipline; it does not replace it.

---

## 3. `supabase-prod-readonly` — what Claude may do (read only)

On **production**, Claude is limited to looking:

- **Verify after a human production run** — read tables/rows to confirm the manually-run SQL landed correctly.
- **Read prod logs / advisors** for debugging a live issue.
- **Read schema** to compare prod against test before the human ships.

Claude must **never**, on production:
- ❌ Run `INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` / `TRUNCATE` / any migration.
- ❌ Apply schema or RLS changes.
- ❌ Do anything that isn't a pure read. (`read_only=true` enforces this; the rule restates it so intent is never ambiguous.)

---

## 4. The standard loop (how a DB task actually runs)

1. **Look (test).** Use `supabase-test` to inspect the real schema/RLS. Never assume names.
2. **Build & prove (test).** Write the SQL, run it on `supabase-test`, read back, iterate until **zero errors**.
3. **Save the final SQL** to the Supabase folder — up-SQL **+ `.down.sql` + RLS policies** ([`WORKFLOW.md`](./WORKFLOW.md) §14).
4. **Explain** in plain language what it does and the rollback. Flag anything destructive loudly.
5. **Human ships (production).** The **human** runs the saved, verified SQL on production via the SQL Editor. Claude does **not**.
6. **Verify (prod, read-only).** Claude reads production through `supabase-prod-readonly` to confirm it landed as intended.
7. **Record** anything noteworthy (schema change, new RLS) so the docs stay accurate.

> Golden line: **Claude drafts and proves on test; the human ships to production; Claude verifies prod read-only.**

---

## 5. Connection setup (one-time per repo, then it travels)

Run **once** in the VS Code integrated terminal, with `--scope project` so the config is written to `.mcp.json` in the repo root and **committed** — every future session and every fresh clone is then auto-wired (you'll just approve + browser-login once per machine).

```bash
# TEST — read + write, scoped, committed
claude mcp add --scope project --transport http supabase-test \
  "https://mcp.supabase.com/mcp?project_ref=sdszcralogcrujtyghig"

# PRODUCTION — READ-ONLY, scoped, committed
claude mcp add --scope project --transport http supabase-prod-readonly \
  "https://mcp.supabase.com/mcp?project_ref=jwogtqizqujwhbvpoziu&read_only=true"
```

Then authenticate (browser login — no token to copy):
- Run `/mcp`, select each server, authenticate. Choose the **org that owns the right project** for each.
- New servers are picked up on the next message — no restart needed.

**Verify the guardrails before trusting them:**
- [ ] `claude mcp list` shows both servers connected.
- [ ] `supabase-test`: "List the tables — use MCP tools" returns the **test** schema.
- [ ] `supabase-test`: a trivial write **succeeds** (it's read+write).
- [ ] `supabase-prod-readonly`: a trivial write **fails / is refused** (read-only proof). — the critical test.
- [ ] Each connection's project ref matches the environment its name claims.

### Fresh-clone checklist (every new machine / clone)
- [ ] Open repo in VS Code — approve the project-scoped servers when prompted (the one-time trust gate).
- [ ] `/mcp` — authenticate both via browser.
- [ ] Re-run the guardrail tests above (especially the prod read-only test).

---

## 6. Pre-use quick gate (before each MCP-assisted DB task)

1. 🔴 The connection in use matches the intent: writing — `supabase-test` only; production — `supabase-prod-readonly` (read).
2. 🔴 No write is aimed at production through any channel.
3. 🔴 Test project is confirmed **separate** from production.
4. Final SQL is saved to the Supabase folder with `.down.sql` + RLS before the human ships.
5. No secret appears in chat, files, `.mcp.json`, or the diff.
6. Production verification is read-only, done **after** the human's manual run.

## 7. Red flags — stop immediately

- A write is about to run against `supabase-prod-readonly`, or prod's `read_only` flag is missing.
- A connection is missing its `project_ref`, or test and prod share one project.
- Claude proposes to "just run it on production for you."
- Any request to read, print, or store a secret / `service_role` key / DB password, or to put one in `.mcp.json`.
- The connected project ref doesn't match the server's name.
- A test task quietly trying to touch production data.

On any red flag: stop, re-check §1, and fall back to the fully manual flow.

---

## 8. Project values (this repo)

- **Test project ref:** `sdszcralogcrujtyghig`
- **Production project ref:** `jwogtqizqujwhbvpoziu`
- **Supabase SQL folder:** `supabase/`
- **Tables to routinely verify (both envs):** `public.profiles`, `public.applications`, `public.admins` (plus S5 content tables `elements`, `checklist`, `programming_sessions`, `resources`, `academy_modules` once applied).

> Keep this file in sync with [`SUPABASE-VERCEL-SETUP.md`](./SUPABASE-VERCEL-SETUP.md) and [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md). When any two disagree, [`TECH-ARCHITECTURE.md`](./TECH-ARCHITECTURE.md) is the source of truth.
