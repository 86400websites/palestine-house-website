# Patches carried on dependencies

pnpm applies these on every install (`patchedDependencies` in `pnpm-workspace.yaml`). A patch
that no longer matches an installed version stops the install, so one cannot go missing quietly.

## `next@15.5.28.patch` — React's fix for a dropped wake-up

**What goes wrong without it.** A click on a link between two private pages can silently do
nothing: the page's data and code all arrive, but the page and the URL never change, and only a
second click works. An admin form can also sit on "Deleting…" or "Uploading…" after the server
has finished. Measured on production builds of `main`'s code against the test project: 12 clicks
lost in 100 across five routes, and up to 7 in 20 on the worst of them, from a section's Read Now
to its guide. Nothing was measured on the live site itself.

**Why.** Next.js vendors its own copy of React. In that copy, `pingSuspendedRoot` ignores a
"your data has arrived" signal that fires during a render which has already decided to suspend
without a fallback. Nothing else is left to wake that render, so it waits for ever. Any later
update on the page wakes it, which is why a second click works.

**What the patch is.** One expression, and it is React's own: it records the signal instead of
dropping it. [react#36134](https://github.com/react/react/pull/36134), first shipped in
Next 16.3.0, where the same lines can be read in `dist/compiled/react-dom`. The defect itself is
[react#37830](https://github.com/react/react/issues/37830). Next 15 has no release carrying the
fix: 15.5.28's copy of that file is byte-identical to 15.5.23's, and the backport
([react#38013](https://github.com/react/react/pull/38013)) was still open when this was written.
That leaves this patch, or a major upgrade.

**When a Next bump stops the install.** Re-target it: in a scratch folder run
`pnpm patch next@<new version>`, make the same one-expression edit in
`dist/compiled/react-dom/cjs/react-dom-client.production.js` (in `pingSuspendedRoot`, the branch
that reads `0 === (executionContext & 2) && prepareFreshStack(root, 0)`), then
`pnpm patch-commit <folder>`, and delete the old file.

**When to delete it.** At Next 16.3 or later, when that function already records the signal.
Test CT-012 (`tests/e2e/access-allowed.spec.ts`) goes red if this is removed too early: it reads
the copy of React a checkout ships for the buggy line, which is certain. Its clicks test the
behaviour as well, and because the bug is a race they catch it only some of the time: with the
fix taken out, 7 of 12 runs lost a click.
