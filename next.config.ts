import type { NextConfig } from "next";

// Minimal foundation config (Sprint 0B). Security headers (CSP, HSTS,
// X-Frame-Options, etc.) are added in a later hardening sprint — the CSP
// allow-list depends on the Live Programming embed origin chosen in S7.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
