import "server-only";
import { Resend } from "resend";
import { isProductionRuntime } from "@/lib/env";

/* Resend transactional-email helper (S12 12-4) — server-only.

   Instantiates Resend ONLY when RESEND_API_KEY + RESEND_FROM_EMAIL are both
   present. With either absent it no-ops cleanly: returns { configured: false },
   never throws, never fakes a send (SECURITY-CHECKLIST §8 — integrations no-op
   when their env vars are absent in local/Preview). The API key is read
   server-side only and never crosses to the client (`server-only` makes an
   accidental client import a build error).

   resend.emails.send returns { data, error } (it does not throw on an API
   error) but the underlying fetch can throw on a network error, so this guards
   both paths and reports configured/ok. The caller decides the failure posture
   — public writes fail closed in Production, gated callers degrade gracefully —
   so this helper never decides for them and surfaces no upstream body. */

export type ResendResult =
  | { configured: false }
  | { configured: true; ok: true }
  | { configured: true; ok: false; error: string };

type ResendEnv = { apiKey: string; from: string };

function readEnv(): ResendEnv | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | string[];
}): Promise<ResendResult> {
  const env = readEnv();
  if (!env) {
    // Local/Preview default: no keys → honest no-op. Notice shows in local +
    // Preview (where setup is debugged); silent only in real production.
    if (!isProductionRuntime()) {
      console.info("[resend] not configured — skipping sendEmail");
    }
    return { configured: false };
  }

  try {
    const resend = new Resend(env.apiKey);
    const { error } = await resend.emails.send({
      from: env.from,
      to,
      subject,
      text,
      html,
      replyTo,
    });
    if (error) {
      // API-level rejection (e.g. unverified domain) — never throw; report it.
      console.error("[resend] sendEmail failed:", error.message);
      return { configured: true, ok: false, error: error.message };
    }
    return { configured: true, ok: true };
  } catch (err) {
    // Network/transport failure. Log the message server-side only; no upstream
    // body is surfaced to the caller.
    const error = err instanceof Error ? err.message : "resend send failed";
    console.error("[resend] sendEmail threw:", error);
    return { configured: true, ok: false, error };
  }
}
