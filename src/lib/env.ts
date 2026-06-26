/* Deployment-tier check (S12 12-10 review fix). True ONLY on the real
   production deployment.

   On Vercel, `next build` runs with NODE_ENV=production for BOTH the Production
   AND Preview deployments, so NODE_ENV alone cannot tell them apart. Vercel
   exposes the deployment target as VERCEL_ENV ('production' | 'preview' |
   'development'). The public writes fail closed ONLY in real production; Preview
   + local no-op cleanly. Falls back to NODE_ENV when VERCEL_ENV is absent (a
   non-Vercel production build still fails closed — the safe direction). */
export function isProductionRuntime(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "production";
  return process.env.NODE_ENV === "production";
}
