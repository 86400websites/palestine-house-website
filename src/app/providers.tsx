"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * App-wide client providers. Additional context providers (theme, analytics,
 * etc.) are wired in here in later sprints.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
