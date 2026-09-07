import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getThreadForParticipant } from "@/lib/queries/chat";
import { ThreadView } from "./ThreadView";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await requireUser();
  const thread = await getThreadForParticipant(Number(id), current.user.id);
  if (!thread) notFound();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/dashboard/messages" className="text-sm underline text-[var(--ink-muted)]">
        ← Messages
      </Link>
      <h1 className="text-xl font-bold text-[var(--ink)] mt-2 mb-4">{thread.otherName}</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <ThreadView
          threadId={thread.id}
          currentUserId={current.user.id}
          status={thread.status}
          isInitiator={thread.isInitiator}
          messages={thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
