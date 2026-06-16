import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/* Root middleware (under src/ to match this project's layout): refresh the
   Supabase session cookie on navigations. No route protection here — that's
   S4. The matcher skips static assets and files so the middleware only runs on
   real page/route requests. */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything EXCEPT:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - any file with an asset extension (images, fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
