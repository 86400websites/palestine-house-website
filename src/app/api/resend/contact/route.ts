import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend/client";
import { isProductionRuntime } from "@/lib/env";

/* Contact form → Resend (S12 12-5) — public POST.

   zod-validates name/email/subject/message, then emails RESEND_TO_EMAIL from
   RESEND_FROM_EMAIL with reply-to = the submitter (so a reply goes straight to
   them) via the server-only helper — the provider is never called from the
   browser. Email-only: no contacts table, no migration (owner decision, S12).
   Honest no-op success in local/Preview when Resend (or the destination inbox)
   is unconfigured; in Production a missing key/inbox or a failed send FAILS
   CLOSED so a message is never silently dropped. Responses carry no upstream
   body.

   DEFERRED to S14 (the known public-write gap — PROJECT-STATUS.md §7): Upstash
   rate-limiting + Turnstile. This sprint ships zod + fail-closed-in-Production
   only. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().regex(EMAIL_RE),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;
  const to = process.env.RESEND_TO_EMAIL;

  // The destination inbox is route-specific config; without it (or without the
  // provider) there is nowhere to deliver, so treat it as not-configured.
  const result = to
    ? await sendEmail({
        to,
        replyTo: email,
        subject: `Contact form: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      })
    : ({ configured: false } as const);

  if (!result.configured) {
    // Local/Preview: honest no-op success. Real production: required config
    // missing → fail closed rather than silently drop the message. Keyed on the
    // deployment target (VERCEL_ENV), since NODE_ENV is "production" on Preview
    // builds too.
    if (isProductionRuntime()) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!result.ok) {
    // Configured but the send failed — fail closed; never fake a send.
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
