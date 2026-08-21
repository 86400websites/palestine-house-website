/* Creates the three robot test accounts — NON-PRODUCTION ONLY.
   Run: pnpm exec tsx tests/e2e/setup/create-test-users.ts
   (docs/testing-setup/SETUP-CHECKLIST.md "Test users — the rules")

   What it does, and deliberately nothing more:
   1. Loads .env.local and HARD-REFUSES to run unless NEXT_PUBLIC_SUPABASE_URL
      is the non-production project (PROJECT-STATUS.md §6). There is no
      override flag: pointing this script at Production is not a mistake it
      will help anyone make.
   2. Generates a random password for any role missing one and stores it in
      the gitignored .env.local — the runner's environment. Passwords are
      never printed, never committed, never sent anywhere but the auth call.
   3. Signs each robot up through the SAME door a real partner uses
      (supabase.auth.signUp with the publishable key) — so the handle_new_user
      trigger creates the profile with is_approved = false, exactly like a
      real applicant. The partner robots then insert their own applications
      row under the same RLS policy the live /apply form uses.
   4. Verifies each robot can sign in, and reports in plain English.

   It does NOT approve anyone and does NOT create admins — flipping
   is_approved and inserting the admins row are the admin path's job, done
   once through the supabase-test MCP (never production; see
   docs/SUPABASE-MCP-SAFETY.md). This script's write surface is exactly a
   pending signup's. */

import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ROLES, type RoleName } from "../helpers/roles";

/* --rotate <role>: sign in with the current password, set a freshly
   generated one via the auth API, and update .env.local in place. Use after
   any event that could have exposed a robot password (e.g. a Playwright
   failure artifact of the login form — its DOM snapshot captures the typed
   value in plain text, which is why test-results/ is gitignored and must be
   treated as secret-bearing). */

const NON_PRODUCTION_REF = "sdszcralogcrujtyghig";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* fall through to the checks below */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
      "(expected in .env.local). Nothing was created.",
  );
  process.exit(1);
}

if (!url.includes(NON_PRODUCTION_REF)) {
  console.error(
    "REFUSING TO RUN: NEXT_PUBLIC_SUPABASE_URL does not point at the " +
      `non-production Supabase project (${NON_PRODUCTION_REF}). Test users ` +
      "are never created in Production — no exceptions " +
      "(docs/testing-setup/SETUP-CHECKLIST.md). Nothing was created.",
  );
  process.exit(1);
}

/* Ensure every role has a password in the runner's environment. */
for (const role of Object.keys(ROLES) as RoleName[]) {
  const envVar = ROLES[role].passwordEnvVar;
  if (!process.env[envVar]) {
    const generated = randomBytes(24).toString("base64url");
    appendFileSync(".env.local", `\n${envVar}=${generated}`);
    process.env[envVar] = generated;
    console.log(`${envVar}: generated and stored in .env.local (local only).`);
  }
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Report = {
  role: RoleName;
  email: string;
  outcome: string;
  isApproved: boolean | null;
  ok: boolean;
};

async function ensureRobot(role: RoleName): Promise<Report> {
  const { email, fullName } = ROLES[role];
  const password = process.env[ROLES[role].passwordEnvVar]!;

  // Already there with this password?
  let outcome = "already existed — sign-in verified";
  let signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    // Not signable-in: create through the real signup door.
    const signUp = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUp.error) {
      return {
        role,
        email,
        outcome:
          `could not sign in OR sign up (${signUp.error.message}). If this ` +
          "account exists with a lost password, delete it in the " +
          "non-production project and re-run this script.",
        isApproved: null,
        ok: false,
      };
    }

    outcome = "created via signUp";
    signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      return {
        role,
        email,
        outcome: "created, but the verification sign-in failed",
        isApproved: null,
        ok: false,
      };
    }
  }

  const userId = signIn.data.user!.id;

  // The partner robots hold an applications row, exactly like real
  // applicants (their own authenticated insert, under the live RLS policy).
  // The admin robot is not an applicant.
  if (role !== "admin") {
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from("applications").insert({
        user_id: userId,
        name: fullName,
        email,
        city: "Robot Test City",
        organisation: "Automated Launch Gate",
        why: "ROBOT TEST ACCOUNT for the automated test suite. Not a real application. Never approve from this row except the designated approved robot.",
      });
      if (error) {
        await supabase.auth.signOut();
        return {
          role,
          email,
          outcome: `signed in, but the applications insert failed (${error.message})`,
          isApproved: null,
          ok: false,
        };
      }
      outcome += " + applications row inserted";
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", userId)
    .maybeSingle();

  await supabase.auth.signOut();

  return {
    role,
    email,
    outcome,
    isApproved: profile ? profile.is_approved : null,
    ok: profile !== null,
  };
}

function setEnvLocal(name: string, value: string) {
  const line = `${name}=${value}`;
  try {
    const current = readFileSync(".env.local", "utf8");
    const pattern = new RegExp(`^${name}=.*$`, "m");
    writeFileSync(
      ".env.local",
      pattern.test(current) ? current.replace(pattern, line) : `${current}\n${line}`,
    );
  } catch {
    appendFileSync(".env.local", `\n${line}`);
  }
  process.env[name] = value;
}

async function rotate(role: RoleName): Promise<never> {
  const { email, passwordEnvVar } = ROLES[role];
  const current = process.env[passwordEnvVar];
  if (!current) {
    console.error(`${passwordEnvVar} is not set — cannot rotate. Aborting.`);
    process.exit(1);
  }
  const signIn = await supabase.auth.signInWithPassword({
    email,
    password: current,
  });
  if (signIn.error) {
    console.error(`Rotate failed: sign-in as ${role} was refused.`);
    process.exit(1);
  }
  const fresh = randomBytes(24).toString("base64url");
  const updated = await supabase.auth.updateUser({ password: fresh });
  if (updated.error) {
    await supabase.auth.signOut();
    console.error(`Rotate failed: password update refused (${role}).`);
    process.exit(1);
  }
  await supabase.auth.signOut();
  setEnvLocal(passwordEnvVar, fresh);
  const verify = await supabase.auth.signInWithPassword({
    email,
    password: fresh,
  });
  await supabase.auth.signOut();
  if (verify.error) {
    console.error(`Rotate WROTE a new password but the verify sign-in failed (${role}).`);
    process.exit(1);
  }
  console.log(`OK: ${role} password rotated and verified (stored in .env.local only).`);
  process.exit(0);
}

async function main() {
  const rotateIdx = process.argv.indexOf("--rotate");
  if (rotateIdx !== -1) {
    const role = process.argv[rotateIdx + 1] as RoleName;
    if (!role || !(role in ROLES)) {
      console.error("Usage: --rotate <pending|approved|admin>");
      process.exit(1);
    }
    await rotate(role);
  }

  const reports: Report[] = [];
  for (const role of Object.keys(ROLES) as RoleName[]) {
    reports.push(await ensureRobot(role));
  }

  console.log("\n=== Robot test accounts (non-production project) ===");
  for (const r of reports) {
    console.log(
      `${r.ok ? "OK  " : "FAIL"} ${r.role.padEnd(8)} ${r.email}\n` +
        `     ${r.outcome}; profile is_approved = ${String(r.isApproved)}`,
    );
  }
  console.log(
    "\nNext (one-time, via the supabase-test MCP — never production):\n" +
      "  - approved robot: profiles.is_approved -> true, application -> approved\n" +
      "  - admin robot:    profiles.is_approved -> true + row in admins",
  );

  process.exit(reports.every((r) => r.ok) ? 0 : 1);
}

void main();
