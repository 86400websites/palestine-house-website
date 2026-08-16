/**
 * scripts/lib/session.ts — closing a script's Supabase session without closing
 * the owner's browser.
 *
 * WHY THIS EXISTS
 * ---------------
 * `supabase.auth.signOut()` defaults to **global** scope: it revokes every
 * refresh token the account holds, everywhere. So a script that signs in as the
 * admin, does its work, and politely signs out also logs the owner out of his
 * own browser — as a side effect of a command that advertised itself as
 * read-only.
 *
 * The independent review of 2026-08-16 raised this. PP6c recorded it as fixed;
 * PP7's kickoff verification found the fix had been applied to exactly one file
 * of eight. `generate-0030-down.ts` was correct and the other seven still held a
 * bare global sign-out — none of them in a `finally`, so a script that threw
 * left its session open as well.
 *
 * Hence a helper rather than seven more hand-written call sites. Two properties,
 * both of which the hand-written version kept getting wrong:
 *
 *   1. **local scope** — this process's session, and nothing else's;
 *   2. **`finally`** — the session closes when the run throws, which is exactly
 *      when a half-finished destructive script is holding one.
 *
 * A failure to sign out is swallowed. Sign-out is cleanup: reporting it over the
 * top of the real error the script is already throwing would bury the thing the
 * operator needs to read.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** End THIS process's session only. Never throws. */
export async function signOutLocal(db: SupabaseClient): Promise<void> {
  try {
    await db.auth.signOut({ scope: "local" });
  } catch {
    /* cleanup — never mask the real error */
  }
}

/** Run `body`, then close the session whether it returned or threw. */
export async function withSession<T>(db: SupabaseClient, body: () => Promise<T>): Promise<T> {
  try {
    return await body();
  } finally {
    await signOutLocal(db);
  }
}
