import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveSafeOrigin, safeNextPath } from "@/lib/safe-redirect";

/* Auth-link landing (server-side): exchange the one-time code/token from a
   Supabase password-recovery email link for a session, then forward to a
   validated same-origin `next`. Email confirmation is OFF this sprint, so
   recovery is the only flow — the token-hash path is restricted to
   type=recovery. The origin is allow-list validated; `next` is coerced
   same-origin (SECURITY-CHECKLIST §6 — no open redirect, no host-header
   poisoning). On a successful recovery landing we set a short-lived httpOnly
   marker that updatePasswordAction requires, so a normal (non-recovery)
   session cannot change the password via /update-password. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const origin = resolveSafeOrigin(request.headers);

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    ok = !error;
  }

  if (!ok) {
    // Missing/expired/invalid link — send them to request a fresh reset link.
    return NextResponse.redirect(`${origin}/forgot-password`);
  }

  const res = NextResponse.redirect(`${origin}${next}`);
  if (next === "/update-password") {
    res.cookies.set("ph-recovery", "1", {
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }
  return res;
}
