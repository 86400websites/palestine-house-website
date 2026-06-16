import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveSafeOrigin, safeNextPath } from "@/lib/safe-redirect";

/* Auth-link landing (server-side): exchange the one-time code/token from a
   Supabase email link (password recovery — email confirmation is OFF this
   sprint) for a session, then forward to a validated same-origin `next`.
   Handles both link shapes so it works with the default email template
   (PKCE `code`) and a token-hash template (`token_hash` + `type`). The origin
   is allow-list validated; `next` is coerced same-origin (SECURITY-CHECKLIST
   §6 — no open redirect, no host-header poisoning). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const origin = resolveSafeOrigin(request.headers);

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  }

  if (ok) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Missing/expired/invalid link — send them to request a fresh reset link.
  return NextResponse.redirect(`${origin}/forgot-password`);
}
