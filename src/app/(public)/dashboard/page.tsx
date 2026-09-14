import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import { requireUser } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { DashboardHeader, StatCard, NavCard, StatusBadge } from "@/components/ui";

const VERIFICATION_LABEL: Record<string, string> = {
  pending: "Verification pending",
  confirmed: "Verified",
  unable_to_confirm: "Unable to confirm",
  not_yet_done: "Basic Verification not yet done",
};

export default async function DashboardPage() {
  const { user, seekerProfile, giverProfile } = await requireUser();

  if (!seekerProfile && !giverProfile) {
    redirect("/onboarding");
  }

  const unreadCount = await getUnreadCount(user.id);

  const [applicationCount, jobCount, openJobCount] = await Promise.all([
    seekerProfile
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(applications)
          .where(eq(applications.seekerId, seekerProfile.id))
          .then((r) => r[0].n)
      : Promise.resolve(0),
    giverProfile
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(jobs)
          .where(eq(jobs.giverId, giverProfile.id))
          .then((r) => r[0].n)
      : Promise.resolve(0),
    giverProfile
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(jobs)
          .where(and(eq(jobs.giverId, giverProfile.id), eq(jobs.status, "open")))
          .then((r) => r[0].n)
      : Promise.resolve(0),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <DashboardHeader title="Dashboard" subtitle={`Mobile: ${user.mobile}`} logoutAction={logoutAction} />

      <div className="grid grid-cols-2 gap-3">
        <NavCard href="/dashboard/messages" label="Messages" icon="💬" />
        <NavCard href="/dashboard/notifications" label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`} icon="🔔" />
      </div>

      {seekerProfile && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-[var(--ink)]">Job Seeker — {seekerProfile.name}</h2>
            <StatusBadge
              status={seekerProfile.verificationStatus}
              label={VERIFICATION_LABEL[seekerProfile.verificationStatus] ?? seekerProfile.verificationStatus}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard label="Applications Sent" value={applicationCount} href="/dashboard/applications" />
            <StatCard label="Verification" value={seekerProfile.verificationStatus === "confirmed" ? "✓" : "…"} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NavCard href="/jobs" label="Find Jobs" icon="🔍" />
            <NavCard href="/dashboard/applications" label="My Applications" icon="📄" />
            <NavCard href="/dashboard/profile" label="Edit Profile" icon="✏️" />
            <NavCard href="/dashboard/privacy" label="Privacy Settings" icon="🔒" />
          </div>
        </section>
      )}

      {giverProfile && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-[var(--ink)]">Job Giver — {giverProfile.businessName}</h2>
            <StatusBadge
              status={giverProfile.verificationStatus}
              label={VERIFICATION_LABEL[giverProfile.verificationStatus] ?? giverProfile.verificationStatus}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard label="Jobs Posted" value={jobCount} href="/giver/jobs" />
            <StatCard label="Currently Open" value={openJobCount} href="/giver/jobs" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NavCard href="/giver/jobs" label="My Jobs" icon="📋" />
            <NavCard href="/giver/jobs/new" label="Post a Job" icon="➕" />
            <NavCard href="/dashboard/business-profile" label="Edit Business Profile" icon="✏️" />
          </div>
        </section>
      )}

      {!giverProfile && (
        <p className="text-sm text-[var(--ink-muted)]">
          Also want to post jobs? <Link href="/onboarding/giver" className="underline">Create a Job Giver profile</Link>
        </p>
      )}
      {!seekerProfile && (
        <p className="text-sm text-[var(--ink-muted)]">
          Also looking for work? <Link href="/onboarding/seeker" className="underline">Create a Job Seeker profile</Link>
        </p>
      )}
    </div>
  );
}
