"use client";

import { m, useReducedMotion } from "framer-motion";
import { Children, type ReactNode } from "react";

/* Restrained editorial reveals (DESIGN.md §8) — the mockups' `.rv` pattern:
   fade + small translate-up, entrance only. Never springs, never parallax. */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const TRAVEL = 20; /* --reveal-travel */

type RevealProps = {
  children: ReactNode;
  /** Stagger offset in seconds (≈0.06–0.1 between siblings). */
  delay?: number;
  className?: string;
};

/** Fade + translate-up when scrolled into view. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: TRAVEL }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.56, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  );
}

/** Fade only — for elements where movement would distract. */
export function FadeIn({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  );
}

/** Reveal a list of children ~80ms apart. Wraps each child in <Reveal>. */
export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  /* toArray handles a single child and assigns stable keys. */
  const items = Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={(child as { key?: string }).key ?? i} delay={i * gap}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
