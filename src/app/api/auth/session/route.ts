import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* Same-origin auth-state probe for the client header (CSP connect-src 'self'
   allows /api/* but not supabase.co). Returns ONLY a boolean for the current
   requester's own session — no identity, no PII — so the locked header can
   swap "Sign in" → "Sign out" while every public page stays statically
   rendered (the layout never reads cookies). Route Handlers are always
   dynamic, which is correct here. */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return NextResponse.json(
    { authed: !!data.user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
