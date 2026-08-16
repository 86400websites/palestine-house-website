/**
 * scripts/lib/connect.ts — one implementation of "which database, and may I".
 *
 * WHY THIS EXISTS (independent review round 4, 2026-08-16 — blocking H1)
 * ----------------------------------------------------------------------
 * PP7 built `--target prod` into `load-content.ts` — and only there. The
 * production runbook then told the owner to run `cutover.ts` and
 * `delete-297-objects.ts` at steps 5 and 8, and the rollback runbook to run
 * `restore-297-objects.ts`; all three read only the TEST variables and hard
 * -assert the TEST hostname, so the documented production procedure could not
 * be executed. Step 5 would have flipped TEST while the operator believed it
 * was production.
 *
 * So the mechanism moves here, once, and every mutating script shares it:
 *
 *   - TEST is the default; production must be named: `--target prod`.
 *     Any other value is an ERROR, never a fallback.
 *   - production reads the PROD_* variables BY NAME and never falls back to
 *     the default client.
 *   - each target asserts its own host EXACTLY, over https, before the first
 *     request.
 *   - a production run demands a typed confirmation (the production project
 *     ref) and REFUSES outright when stdin is not a terminal — a production
 *     mutation has a person at a keyboard, not a pipe, a CI job or an agent.
 *   - the admin's own session, never a service key.
 */

import path from "node:path";
import * as readline from "node:readline/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

export const TEST_REF = "sdszcralogcrujtyghig";
export const PROD_REF = "jwogtqizqujwhbvpoziu";

export type TargetName = "test" | "prod";

const TARGETS = {
  test: {
    label: "TEST",
    ref: TEST_REF,
    urlVar: "NEXT_PUBLIC_SUPABASE_URL",
    keyVar: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    emailVar: "TEST_PARTNER_EMAIL",
    passwordVar: "TEST_PARTNER_PASSWORD",
  },
  prod: {
    label: "PRODUCTION",
    ref: PROD_REF,
    urlVar: "PROD_SUPABASE_URL",
    keyVar: "PROD_SUPABASE_PUBLISHABLE_KEY",
    emailVar: "PROD_ADMIN_EMAIL",
    passwordVar: "PROD_ADMIN_PASSWORD",
  },
} as const;

/** Parse the already-extracted `--target` value. Unknown values are an error,
 *  never a default — `--target production` silently becoming TEST is the same
 *  failure the flag exists to prevent.
 *
 *  `requireExplicit` (round 5, H1): destructive and rollback scripts take NO
 *  default at all. The rollback runbook once printed bare commands that would
 *  have silently "restored" TEST while the operator believed production —
 *  documentation drift cannot select a database if the script refuses to pick
 *  one for you. */
export function resolveTarget(raw: string | null, requireExplicit = false): TargetName {
  if (raw !== null && raw !== "test" && raw !== "prod") {
    throw new Error(`--target must be "test" or "prod", not ${JSON.stringify(raw)}.`);
  }
  if (raw === null && requireExplicit) {
    throw new Error(
      "This script requires an EXPLICIT --target test or --target prod. It is destructive or " +
        "restorative, so it refuses to guess which database you mean.",
    );
  }
  return raw === "prod" ? "prod" : "test";
}

/** Sign in to the named target as the admin, with every guard applied. */
export async function connectTarget(target: TargetName): Promise<SupabaseClient> {
  const t = TARGETS[target];
  process.loadEnvFile(path.join(ROOT, ".env.local"));

  const url = process.env[t.urlVar];
  const key = process.env[t.keyVar];
  const email = process.env[t.emailVar];
  const password = process.env[t.passwordVar];

  const missing = [
    [t.urlVar, url],
    [t.keyVar, key],
    [t.emailVar, email],
    [t.passwordVar, password],
  ]
    .filter(([, v]) => !v)
    .map(([n]) => n);
  if (missing.length) {
    throw new Error(
      `--target ${target} needs ${missing.join(", ")} in .env.local.\n` +
        `This script reads ONLY those names for this target and never falls back to another ` +
        `client, so a .env.local pointed somewhere else cannot silently redirect the run.`,
    );
  }

  const parsed = new URL(url!);
  if (parsed.protocol !== "https:" || parsed.hostname !== `${t.ref}.supabase.co`) {
    throw new Error(
      `${t.urlVar} is "${parsed.host}", not the ${t.label} project (https://${t.ref}.supabase.co). ` +
        `Refusing: the target and the credentials must agree before anything is written.`,
    );
  }
  console.log(`target: ${parsed.host} (${t.label})`);

  const db = createClient(url!, key!, { auth: { persistSession: false } });
  const { error } = await db.auth.signInWithPassword({ email: email!, password: password! });
  if (error) throw new Error(`sign-in failed: ${error.message}`);

  const { data: isAdmin, error: adminErr } = await db.rpc("is_admin");
  if (adminErr) throw adminErr;
  if (isAdmin !== true) {
    throw new Error(
      `The signed-in account is not an admin on ${t.label}. ` +
        "If it was removed from `admins` for a partner-path test, put it back first.",
    );
  }
  return db;
}

/** The typed confirmation before a production MUTATION. Call after every guard
 *  has had its chance to refuse and before the first write. The phrase is the
 *  production project ref, not "yes" — "yes" is something the hands type
 *  without the eyes reading. */
export async function confirmProduction(target: TargetName, plan: string): Promise<void> {
  if (target !== "prod") return;

  console.log(`\n${"=".repeat(72)}`);
  console.log("YOU ARE ABOUT TO WRITE TO PRODUCTION.");
  console.log(`${"=".repeat(72)}`);
  console.log(plan);
  console.log(`${"=".repeat(72)}`);

  if (!process.stdin.isTTY) {
    throw new Error(
      "Refusing: --target prod requires a typed confirmation and stdin is not a terminal. " +
        "A production mutation is done by a person at a keyboard, not by a pipe, a CI job or an agent.",
    );
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const typed = (await rl.question(`\nType the production project ref (${PROD_REF}) to proceed: `)).trim();
    if (typed !== PROD_REF) {
      throw new Error("Confirmation did not match. Nothing has been written.");
    }
  } finally {
    rl.close();
  }
  console.log("Confirmed.\n");
}
