import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { approvers, locations, jobs, jobSeekerProfiles, jobGiverProfiles, reports } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { adminLogoutAction } from "@/app/actions/admin-auth";
import { DashboardHeader, StatCard, NavCard } from "@/components/ui";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const [seekerCount] = await db.select({ n: sql<number>`count(*)::int` }).from(jobSeekerProfiles);
  const [giverCount] = await db.select({ n: sql<number>`count(*)::int` }).from(jobGiverProfiles);
  const [jobCount] = await db.select({ n: sql<number>`count(*)::int` }).from(jobs);
  const [openReports] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));

  // Districts with no active Approver assigned — a key Central Admin stat
  // per Section 3.
  const allDistricts = await db.select().from(locations).where(eq(locations.isRemote, false));
  const activeApprovers = await db.select().from(approvers).where(eq(approvers.status, "active"));
  const districtsWithApprover = new Set(activeApprovers.map((a) => a.districtId));
  const districtsWithoutApprover = allDistricts.filter((d) => !districtsWithApprover.has(d.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DashboardHeader title="Central Admin" subtitle={session.username} logoutAction={adminLogoutAction} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Job Seekers" value={seekerCount.n} />
        <StatCard label="Job Givers" value={giverCount.n} />
        <StatCard label="Jobs Posted" value={jobCount.n} />
        <StatCard label="Open Reports" value={openReports.n} href="/admin/reports" />
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 mb-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="font-semibold text-[var(--ink)] mb-2">
          Districts with no Approver ({districtsWithoutApprover.length} of {allDistricts.length})
        </h2>
        {districtsWithoutApprover.length === 0 ? (
          <p className="text-sm text-[var(--ok)]">Every district has at least one active Approver.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {districtsWithoutApprover.map((d) => (
              <span key={d.id} className="text-xs bg-[var(--warn-soft)] text-[var(--ink)] px-2 py-1 rounded-full">
                {d.district}
              </span>
            ))}
          </div>
        )}
        <Link href="/admin/approvers" className="inline-block mt-3 text-sm text-[var(--accent-ink)] underline">
          Assign / manage Approvers →
        </Link>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NavCard href="/admin/users" label="Users" icon="👥" />
        <NavCard href="/admin/approvers" label="Approvers & Districts" icon="🧭" />
        <NavCard href="/admin/moderation" label="Job Moderation" icon="🛠️" />
        <NavCard href="/admin/reports" label="Reports" icon="🚩" />
        <NavCard href="/admin/suggestions" label="Suggestions" icon="💡" />
        <NavCard href="/admin/audit-log" label="Audit Log" icon="📜" />
        <NavCard href="/admin/import" label="Import Seekers (CSV)" icon="⬆️" />
        <NavCard href="/admin/import-givers" label="Import Givers (CSV)" icon="⬆️" />
      </nav>
    </div>
  );
}
