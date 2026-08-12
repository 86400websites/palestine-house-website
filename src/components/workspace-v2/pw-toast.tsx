"use client";

import * as React from "react";

/* Workspace v2 toast (PP2 2d) — the mockup's single, transient status message.

   Deliberately NOT `.adm-toast`: that class belongs to the admin screens and the
   legacy workspace, which both still ship until PP5. This is its own `.pw-toast`
   with its own provider, so neither system can restyle the other.

   role="status" + aria-live="polite" matches the prototype: the message is
   announced without stealing focus. One toast at a time, replaced not stacked,
   auto-dismissed after 3.2s — the mockup's own timing.

   PP3 onward uses this for the honest "coming soon" states (a guide file that
   has not been uploaded, a video with no YouTube URL yet). */

const TOAST_MS = 3200;

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function usePwToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("usePwToast must be used inside <PwToastProvider>");
  }
  return ctx;
}

export function PwToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((next: string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setMessage(next);
    timerRef.current = window.setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`pw-toast${message ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
