import { createBrowserClient } from "@supabase/ssr";

/* Browser Supabase client (@supabase/ssr). Reads ONLY the two browser-safe
   public vars (SUPABASE-VERCEL-SETUP.md "Supabase browser client rules") —
   never the secret key. All access runs under Row Level Security. Auth
   mutations in this sprint run server-side (Server Actions / Route Handlers),
   so this client is created lazily only where a Client Component needs it. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
