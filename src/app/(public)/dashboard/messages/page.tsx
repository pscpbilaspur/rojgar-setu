import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getThreadsForUser } from "@/lib/queries/chat";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "Pending", cls: "bg-[var(--warn-soft)] text-[var(--ink)]" },
  accepted: { text: "Active", cls: "bg-[var(--ok-soft)] text-[var(--ok)]" },
  declined: { text: "Declined", cls: "bg-[var(--danger-soft)] text-[var(--danger)]" },
  blocked: { text: "Blocked", cls: "bg-[var(--danger-soft)] text-[var(--danger)]" },
};

export default async function MessagesPage() {
  const current = await requireUser();
  const threads = await getThreadsForUser(current.user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Messages</h1>
      {threads.length === 0 ? (
        <p className="text-[var(--ink-muted)]">
          No conversations yet. Start one from a person or business&apos;s profile page.
        </p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link
              key={t.threadId}
              href={`/dashboard/messages/${t.threadId}`}
              className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-[var(--ink)]">{t.otherName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABEL[t.status]?.cls ?? ""}`}>
                  {STATUS_LABEL[t.status]?.text ?? t.status}
                  {t.status === "pending" && !t.isInitiator ? " — respond" : ""}
                </span>
              </div>
              {t.lastMessage && (
                <p className="text-sm text-[var(--ink-muted)] mt-1 truncate">{t.lastMessage}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
