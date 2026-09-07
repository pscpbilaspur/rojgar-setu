import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";
import { getUnreadCount } from "@/lib/queries/notifications";

const VERIFICATION_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "Verification pending", cls: "bg-[var(--warn-soft)] text-[var(--ink)]" },
  confirmed: { text: "Verified", cls: "bg-[var(--ok-soft)] text-[var(--ok)]" },
  unable_to_confirm: { text: "Unable to confirm", cls: "bg-[var(--danger-soft)] text-[var(--danger)]" },
};

export default async function DashboardPage() {
  const { user, seekerProfile, giverProfile } = await requireUser();

  if (!seekerProfile && !giverProfile) {
    redirect("/onboarding");
  }

  const unreadCount = await getUnreadCount(user.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[var(--ink)]">Dashboard</h1>
        <form action={logoutAction}>
          <button type="submit" className="text-sm underline text-[var(--ink-muted)]">Log out</button>
        </form>
      </div>
      <p className="text-sm text-[var(--ink-muted)]">Mobile: {user.mobile}</p>
      <div className="flex gap-4">
        <Link href="/dashboard/messages" className="text-sm underline text-[var(--accent-ink)]">
          💬 Messages
        </Link>
        <Link href="/dashboard/notifications" className="text-sm underline text-[var(--accent-ink)]">
          🔔 Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Link>
      </div>

      {seekerProfile && (
        <section
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-[var(--ink)]">Job Seeker — {seekerProfile.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${VERIFICATION_LABEL[seekerProfile.verificationStatus]?.cls ?? ""}`}>
              {VERIFICATION_LABEL[seekerProfile.verificationStatus]?.text ?? seekerProfile.verificationStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/jobs" className="text-sm underline text-[var(--accent-ink)]">Find Jobs</Link>
            <Link href="/dashboard/applications" className="text-sm underline text-[var(--accent-ink)]">My Applications</Link>
            <Link href="/dashboard/profile" className="text-sm underline text-[var(--accent-ink)]">Edit Profile</Link>
            <Link href="/dashboard/privacy" className="text-sm underline text-[var(--accent-ink)]">Privacy Settings</Link>
          </div>
        </section>
      )}

      {giverProfile && (
        <section
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-[var(--ink)]">Job Giver — {giverProfile.businessName}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${VERIFICATION_LABEL[giverProfile.verificationStatus]?.cls ?? ""}`}>
              {VERIFICATION_LABEL[giverProfile.verificationStatus]?.text ?? giverProfile.verificationStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/giver/jobs" className="text-sm underline text-[var(--accent-ink)]">My Jobs</Link>
            <Link href="/giver/jobs/new" className="text-sm underline text-[var(--accent-ink)]">Post a Job</Link>
            <Link href="/dashboard/business-profile" className="text-sm underline text-[var(--accent-ink)]">Edit Business Profile</Link>
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
