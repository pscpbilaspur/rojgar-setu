import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ReportRow } from "./ReportRow";

export default async function ReportsPage() {
  await requireAdmin();

  const allReports = await db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterMobile: users.mobile,
    })
    .from(reports)
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Reports ({allReports.length})</h1>
      {allReports.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No reports filed.</p>
      ) : (
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border)]">
                <th className="py-2 px-2">Target</th>
                <th className="py-2 px-2">Reason</th>
                <th className="py-2 px-2">Reported by</th>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {allReports.map((r) => (
                <ReportRow key={r.id} {...r} createdAt={r.createdAt.toISOString()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
