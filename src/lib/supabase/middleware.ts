import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Cookie-backed session REFRESH for middleware (@supabase/ssr). This sprint
   (S3) only keeps the session fresh — it does NOT enforce route protection;
   server-side gating arrives in S4. If the Supabase env vars are absent
   (local/Preview without config), it passes the request through untouched,
   matching the project rule that integrations no-op when unconfigured. */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT (@supabase/ssr): refresh the auth token here. Do not insert any
  // logic between createServerClient and getUser, or sessions can break.
  await supabase.auth.getUser();

  return supabaseResponse;
}
