import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* Server Supabase client (@supabase/ssr) for Server Components, Route
   Handlers, and Server Actions. Reads/refreshes the session from cookies and
   runs under the user's session + RLS — it does NOT use the secret key
   (SUPABASE-VERCEL-SETUP.md "Supabase server client rules"). middleware.ts
   keeps the session fresh; the setAll try/catch is the documented no-op for
   when this client is created inside a Server Component (where cookies are
   read-only). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware.ts refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
