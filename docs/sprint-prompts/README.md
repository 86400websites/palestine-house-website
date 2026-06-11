# Sprint prompt records

One file per completed sprint/phase. These are the build's session memory: any fresh AI session reads the recent records here (plus `PROJECT-STATUS.md`) to understand what was done, how, and what to avoid re-deciding.

**Workflow:** before a sprint, run the `/sprint-prompt` skill to plan it and generate the implementation prompt. After the sprint's PR merges, run `/sprint-prompt save` to log the record here (in the closing PR when possible).

**Naming:** `<sprint-id>-<slug>.md`, lowercase, dots → dashes. Examples: `0-1-foundation.md`, `s3a-supabase-clients.md`, `0d-vercel-preview-test.md`.

## Record template

```markdown
# Sprint <ID> — <Name>

| | |
|---|---|
| **Date merged** | YYYY-MM-DD |
| **Branch / PR** | `claude/sprint-x-y-name` / #NN |
| **Goal** | One line. |

## What shipped
- Bullet list of what was actually built/changed (routes, components, schema, config).

## Prompt used
<details><summary>Exact implementation prompt</summary>

​```text
(paste the prompt that was executed)
​```

</details>

## Checks & results
typecheck ✅ · lint ✅ · build ✅ · Preview tested ✅ (desktop + 320px) · [sprint-specific checks]

## Deviations & learnings
- Anything that differed from the plan, decisions made mid-sprint (propagated to PROJECT-STATUS §4/§5), gotchas for future sprints.

## Follow-ups
- Deferred items + where they're tracked (sprint board note, §5 decision, or backlog).
```
