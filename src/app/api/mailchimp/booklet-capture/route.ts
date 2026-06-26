import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertContact } from "@/lib/mailchimp/client";
import { isProductionRuntime } from "@/lib/env";

/* Lead-magnet booklet capture (S12 12-2) — public POST.

   zod-validates the email + which booklet(s), then tags lead-booklet-a /
   lead-booklet-b in Mailchimp via the server-only helper (the provider is never
   called from the browser). Honest no-op success in local/Preview when Mailchimp
   is unconfigured; in Production a missing key or a failed upstream call FAILS
   CLOSED (HTTP error) — we never claim a capture that did not happen and never
   silently drop the address. Responses carry no upstream body.

   DEFERRED to S14 (the known public-write gap — PROJECT-STATUS.md §7): Upstash
   rate-limiting + Turnstile. This sprint ships zod + fail-closed-in-Production
   only. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  email: z.string().trim().regex(EMAIL_RE),
  booklet: z.enum(["a", "b", "both"]),
});

const TAGS = {
  a: ["lead-booklet-a"],
  b: ["lead-booklet-b"],
  both: ["lead-booklet-a", "lead-booklet-b"],
} as const;

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

  const { email, booklet } = parsed.data;
  const result = await upsertContact({ email, tags: [...TAGS[booklet]] });

  if (!result.configured) {
    // Local/Preview: honest no-op success. Real production: a required key is
    // missing → fail closed rather than silently drop the address. Keyed on the
    // deployment target (VERCEL_ENV), since NODE_ENV is "production" on Preview
    // builds too.
    if (isProductionRuntime()) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!result.ok) {
    // Configured but the upstream call failed — fail closed; never fake a send.
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
