import type { Metadata } from "next";
import Link from "next/link";
import { getMyProfile } from "@/lib/auth/profile";
import { PendingState } from "@/components/workspace/pending-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/session-card";
import { formatSessionWhen } from "@/lib/live/format";
import { getMySessions } from "@/lib/live/mine";
import { ProgrammingForm } from "./programming-form";
import { DeleteSessionButton } from "./delete-session-button";

/* /programming — the gated partner publishing tool (S9 9f). Approval-gated like
   /support: a pending session sees the under-review notice. An approved partner
   publishes/edits a YouTube link + event metadata through publish_programming_
   session (0020), and the list reads its own rows under the owner-scoped RLS.
   Whatever is published appears on the public /live + Experience strip. */

export const metadata: Metadata = { title: "Live Programming" };

export default async function ProgrammingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState contactFallback />;

  const { edit } = await searchParams;
  const editId = Array.isArray(edit) ? edit[0] : edit;
  const sessions = await getMySessions();
  const editing = editId
    ? (sessions.find((s) => s.id === editId) ?? null)
    : null;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="ws-h1">Live Programming</h1>
      <p className="ws-lead">
        Publish a live stream or a recording from your House. Paste a YouTube
        link and it appears on the public{" "}
        <Link href="/live">Live page</Link> and the Experience strip.
      </p>

      <section style={{ marginTop: "var(--space-8)" }}>
        <h2
          className="ws-h1"
          style={{
            fontSize: "var(--text-lg)",
            marginBottom: "var(--space-4)",
          }}
        >
          {editing ? "Edit session" : "Publish a session"}
        </h2>
        <ProgrammingForm key={editing?.id ?? "new"} initial={editing} />
      </section>

      <section style={{ marginTop: "var(--space-10)" }}>
        <h2
          className="ws-h1"
          style={{
            fontSize: "var(--text-lg)",
            marginBottom: "var(--space-4)",
          }}
        >
          Your sessions
        </h2>
        {sessions.length === 0 ? (
          <p className="ws-lead">You haven’t published anything yet.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            {sessions.map((s) => {
              const meta = [s.venue, formatSessionWhen(s.starts_at)]
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={s.id}
                  className="ws-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-4)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <StatusBadge status={s.status} />
                      {s.mode ? (
                        <span className="live-tag">{s.mode}</span>
                      ) : null}
                    </div>
                    <h3
                      style={{
                        marginTop: "var(--space-2)",
                        fontSize: "var(--text-lg)",
                      }}
                    >
                      {s.title}
                    </h3>
                    {meta ? (
                      <p
                        className="live-card-meta"
                        style={{ marginTop: "var(--space-2)" }}
                      >
                        {meta}
                      </p>
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      flexShrink: 0,
                    }}
                  >
                    <Button asChild variant="secondary" size="sm">
                      <Link
                        href={`/programming?edit=${s.id}`}
                        aria-label={`Edit ${s.title}`}
                      >
                        Edit
                      </Link>
                    </Button>
                    <DeleteSessionButton id={s.id} title={s.title} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
