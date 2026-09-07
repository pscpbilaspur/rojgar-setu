import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AuditLogPage() {
  await requireAdmin();

  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Audit Log ({logs.length} most recent)</h1>
      {logs.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No actions logged yet.</p>
      ) : (
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border)]">
                <th className="py-2 px-2">When</th>
                <th className="py-2 px-2">Actor</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2">Target</th>
                <th className="py-2 px-2">Before → After</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] align-top">
                  <td className="py-2 px-2 text-[var(--ink-faint)] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 px-2">
                    {l.actorType} #{l.actorId}
                  </td>
                  <td className="py-2 px-2">{l.action}</td>
                  <td className="py-2 px-2">
                    {l.targetType} #{l.targetId}
                  </td>
                  <td className="py-2 px-2 text-xs font-mono max-w-xs">
                    <span className="text-[var(--danger)]">{l.before ? JSON.stringify(l.before) : "—"}</span>
                    {" → "}
                    <span className="text-[var(--ok)]">{l.after ? JSON.stringify(l.after) : "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
