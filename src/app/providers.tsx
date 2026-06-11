"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * App-wide client providers. Framer Motion loads lazily (LazyMotion +
 * domAnimation per TECH-ARCHITECTURE §11); additional providers (analytics,
 * etc.) are wired in here in later sprints.
 *
 * `strict` throws (in production too) if any `motion.*` component renders
 * inside this tree — always animate with `m.*` (see components/motion/).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
    </LazyMotion>
  );
}
