"use client";

import { Button } from "@/components/ui/button";
import { deleteSessionAction } from "@/lib/live/actions";

/* Remove one of the partner's own sessions (S9 9f). The server action enforces
   the owner-scoped delete under RLS; this confirms before submitting so a stray
   click can't pull a session off the public page. */
export function DeleteSessionButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deleteSessionAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Remove this session? It disappears from the public Live page.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="sessionId" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label={`Remove ${title}`}
      >
        Remove
      </Button>
    </form>
  );
}
