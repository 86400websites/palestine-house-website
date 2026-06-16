import { headers } from "next/headers";

/* Same-origin redirect safety for auth flows (SUPABASE-VERCEL-SETUP.md "Auth
   redirect & Site URL guidance" + SECURITY-CHECKLIST §6). Two jobs:
   1. resolveSafeOrigin / getSafeOrigin — derive the origin to build auth
      email links (password reset) from the request, VALIDATED against an
      allow-list so a forged x-forwarded-host / host header can never mint a
      link to an attacker origin (host-header poisoning).
   2. safeNextPath — coerce a user-supplied ?next= into a relative, same-origin
      path so login can't be turned into an open redirect.
   The allow-list mirrors the Supabase redirect URL allow-list (local +
   Preview wildcard + Production). When the custom domain lands (decision D3),
   add it to PRODUCTION_HOSTS here and to the Supabase allow-list together. */

const PRODUCTION_HOSTS = ["palestine-house-website.vercel.app"];

/* Vercel Preview deployments for this team: <deploy>-86400-s-projects.vercel.app
   (matches the Supabase redirect wildcard https://*-86400-s-projects.vercel.app). */
const PREVIEW_HOST = /^[a-z0-9-]+-86400-s-projects\.vercel\.app$/i;
const LOCALHOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

const FALLBACK_ORIGIN = "http://localhost:3000";

function isAllowedHost(host: string): boolean {
  return (
    LOCALHOST.test(host) ||
    PRODUCTION_HOSTS.includes(host.toLowerCase()) ||
    PREVIEW_HOST.test(host)
  );
}

function originFromUrlLike(value: string | undefined): string | null {
  if (!value) return null;
  const withProto = /^https?:\/\//.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withProto);
    return isAllowedHost(u.host) ? u.origin : null;
  } catch {
    return null;
  }
}

/* Resolve a trusted, allow-listed origin from request headers, with
   deployment-env and NEXT_PUBLIC_SITE_URL fallbacks — each itself validated. */
export function resolveSafeOrigin(requestHeaders: Headers): string {
  const host = (
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? ""
  )
    .split(",")[0]
    .trim();

  if (host && isAllowedHost(host)) {
    const proto = (requestHeaders.get("x-forwarded-proto") ?? "https")
      .split(",")[0]
      .trim();
    return `${proto}://${host}`;
  }

  return (
    originFromUrlLike(process.env.VERCEL_BRANCH_URL) ??
    originFromUrlLike(process.env.VERCEL_URL) ??
    originFromUrlLike(process.env.NEXT_PUBLIC_SITE_URL) ??
    FALLBACK_ORIGIN
  );
}

/* Convenience for Server Actions: read the current request headers. */
export async function getSafeOrigin(): Promise<string> {
  return resolveSafeOrigin(await headers());
}

/* Coerce a user-supplied next target to a safe, relative, same-origin path.
   Rejects absolute URLs (http://evil.com) and protocol-relative (//evil.com). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/* Build an absolute same-origin URL for an auth redirect target. */
export function buildRedirectUrl(origin: string, path: string): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
