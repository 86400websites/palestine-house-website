"use client";

import { m, useReducedMotion } from "framer-motion";
import { Children, type ReactNode } from "react";

/* Restrained editorial reveals (DESIGN.md §8) — the mockups' `.rv` pattern:
   fade + small translate-up, entrance only. Never springs, never parallax.

   Reduced motion (L1, 2026-11-17): the same element on the server and in the
   browser, with an instant transition when the visitor asks for less motion.
   These used to return a plain <div> when useReducedMotion() said so, but that
   hook is null on the server and true on the first browser render, so the page
   was built with the server's motion wrapper (inline opacity:0) and hydrated as
   a plain div: React does not repair attributes while hydrating, nothing was
   left to animate them, and with Reduce Motion on, the headings and the
   sign-in, apply and contact forms stayed invisible. The transition is not part
   of the markup, so varying it cannot cause that mismatch. */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const TRAVEL = 20; /* --reveal-travel */

type RevealProps = {
  children: ReactNode;
  /** Stagger offset in seconds (≈0.06–0.1 between siblings). */
  delay?: number;
  className?: string;
  /** How far past the viewport's edge the reveal starts. */
  margin?: string;
};

/** Fade + translate-up when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  margin = "-10% 0px",
}: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: TRAVEL }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: margin as `${number}px` }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.56, ease: EASE_OUT, delay }
      }
    >
      {children}
    </m.div>
  );
}

/** Fade only — for elements where movement would distract. */
export function FadeIn({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT, delay }
      }
    >
      {children}
    </m.div>
  );
}

/** Reveal a list of children ~80ms apart. Wraps each child in <Reveal>. Only heroes use
    this, so its margin reaches past the bottom edge by the travel: a call to action at
    the foot of a phone's first screen is showing on arrival, not waiting for a scroll. */
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
        <Reveal
          key={(child as { key?: string }).key ?? i}
          delay={i * gap}
          margin={`0px 0px ${TRAVEL}px 0px`}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
}
