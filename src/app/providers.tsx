"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * App-wide client providers. Framer Motion's animation features load lazily —
 * the async import keeps the animation engine out of the first-load bundle
 * (LazyMotion + domAnimation per TECH-ARCHITECTURE §11); additional providers
 * (analytics, etc.) are wired in here in later sprints.
 *
 * `strict` throws (in production too) if any `motion.*` component renders
 * inside this tree — always animate with `m.*` (see components/motion/).
 */
const loadFeatures = () =>
  import("@/components/motion/features").then((mod) => mod.default);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
    </LazyMotion>
  );
}
