import { requireUser } from "@/lib/dal";
import { getNotificationsForUser } from "@/lib/queries/notifications";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";

export default async function NotificationsPage() {
  const current = await requireUser();
  const items = await getNotificationsForUser(current.user.id);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[var(--ink)]">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="text-sm underline text-[var(--ink-muted)]">
              Mark all read
            </button>
          </form>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[var(--ink-muted)]">Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`bg-[var(--surface)] border rounded-[var(--radius)] p-3 text-sm ${
                n.readAt ? "border-[var(--border)]" : "border-[var(--accent)]"
              }`}
              style={{ boxShadow: "var(--shadow)" }}
            >
              <p className="text-[var(--ink)]">{n.body}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-1">
                {new Date(n.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
