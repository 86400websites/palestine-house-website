import "server-only";
import { createHash } from "node:crypto";
import mailchimp from "@mailchimp/mailchimp_marketing";

/* Mailchimp Marketing helper (S12 12-1) — server-only.

   Instantiates the SDK ONLY when MAILCHIMP_API_KEY + MAILCHIMP_SERVER_PREFIX +
   MAILCHIMP_AUDIENCE_ID are ALL present. With any absent it no-ops cleanly:
   returns { configured: false }, never throws, never fakes a send
   (SECURITY-CHECKLIST §8 — integrations no-op when their env vars are absent in
   local/Preview). Keys are read server-side only and never cross to the client
   (`server-only` makes an accidental client import a build error).

   upsertContact is idempotent: setListMember (a PUT) creates the contact if new
   and leaves an existing contact's subscription status untouched, keyed by the
   md5 of the lowercased email per Mailchimp's subscriber-hash contract; tags are
   added in a second call. The caller decides the failure posture — public
   writes fail closed in Production, gated callers degrade gracefully — so this
   helper only reports configured/ok and never decides for them. */

export type MailchimpResult =
  | { configured: false }
  | { configured: true; ok: true }
  | { configured: true; ok: false; error: string };

type MailchimpEnv = { apiKey: string; server: string; audienceId: string };

function readEnv(): MailchimpEnv | null {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !server || !audienceId) return null;
  return { apiKey, server, audienceId };
}

function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

export async function upsertContact({
  email,
  tags = [],
}: {
  email: string;
  tags?: string[];
}): Promise<MailchimpResult> {
  const env = readEnv();
  if (!env) {
    // Local/Preview default: no keys → honest no-op. Dev-only notice; silent in
    // production so setup gaps are visible locally without log noise live.
    if (process.env.NODE_ENV !== "production") {
      console.info("[mailchimp] not configured — skipping upsertContact");
    }
    return { configured: false };
  }

  try {
    mailchimp.setConfig({ apiKey: env.apiKey, server: env.server });
    const hash = subscriberHash(email);

    await mailchimp.lists.setListMember(env.audienceId, hash, {
      email_address: email,
      status_if_new: "subscribed",
    });

    if (tags.length > 0) {
      await mailchimp.lists.updateListMemberTags(env.audienceId, hash, {
        tags: tags.map((name) => ({ name, status: "active" as const })),
      });
    }

    return { configured: true, ok: true };
  } catch (err) {
    // Never throw to the caller. Log the message server-side only; the upstream
    // body is not surfaced to the client.
    const error =
      err instanceof Error ? err.message : "mailchimp upsert failed";
    console.error("[mailchimp] upsertContact failed:", error);
    return { configured: true, ok: false, error };
  }
}
