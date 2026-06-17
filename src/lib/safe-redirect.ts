import { headers } from "next/headers";

/* Same-origin redirect safety for auth flows (SUPABASE-VERCEL-SETUP.md "Auth
   redirect & Site URL guidance" + SECURITY-CHECKLIST §6). Two jobs:
   1. resolveSafeOrigin / getSafeOrigin — derive the origin to build auth
      email links (password reset) from the request, VALIDATED against an
      allow-list so a forged x-forwarded-host / host header can never mint a
      link to an attacker origin (host-header poisoning). The scheme is derived
      from the host type — NEVER from a spoofable x-forwarded-proto — and the
      result is re-parsed through URL so embedded junk in the host is rejected.
   2. safeNextPath — coerce a user-supplied ?next= into a relative, same-origin
      path (rejects absolute, protocol-relative `//`, and backslash `\` targets)
      so login can't be turned into an open redirect.
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

/* Scheme is a function of the host, not of any request header: localhost is
   http, every allow-listed remote host is https. */
function schemeForHost(host: string): "http" | "https" {
  return LOCALHOST.test(host) ? "http" : "https";
}

/* Build a validated origin from a bare host. Re-parses through URL and
   re-checks the parsed host so embedded credentials/paths/ports in a spoofed
   header can't slip through. */
function buildOrigin(rawHost: string | null | undefined): string | null {
  const host = (rawHost ?? "").split(",")[0].trim();
  if (!host || !isAllowedHost(host)) return null;
  try {
    const u = new URL(`${schemeForHost(host)}://${host}`);
    return isAllowedHost(u.host) ? u.origin : null;
  } catch {
    return null;
  }
}

/* An env value may be a bare host or a full URL; take only the host and derive
   the scheme ourselves, then validate exactly like a request host. */
function originFromUrlLike(value: string | undefined): string | null {
  if (!value) return null;
  const host = value.replace(/^https?:\/\//i, "").split("/")[0];
  return buildOrigin(host);
}

/* Resolve a trusted, allow-listed origin from request headers, with
   deployment-env and NEXT_PUBLIC_SITE_URL fallbacks — each itself validated. */
export function resolveSafeOrigin(requestHeaders: Headers): string {
  return (
    buildOrigin(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    ) ??
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
   Rejects absolute URLs (http://evil.com), protocol-relative (//evil.com), and
   backslash forms (/\evil.com, which some browsers normalise to //evil.com).
   `fallback` (a developer-controlled literal, never user input) is returned for
   a missing/unsafe value — e.g. "/dashboard" for post-login. */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = "/",
): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return fallback;
  }
  return next;
}

/* Build an absolute same-origin URL for an auth redirect target. */
export function buildRedirectUrl(origin: string, path: string): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
