import { requireApprover } from "@/lib/dal";
import {
  getPendingVerificationsForApprover,
  getDecidedVerificationsForApprover,
  getApproverIdentity,
} from "@/lib/queries/verification";
import { approverLogoutAction } from "@/app/actions/approver-auth";
import { VerificationCard } from "./VerificationCard";
import { DashboardHeader, StatCard, StatusBadge } from "@/components/ui";

export default async function ApproverDashboardPage() {
  const session = await requireApprover();
  const [identity, pending, decided] = await Promise.all([
    getApproverIdentity(session.approverId),
    getPendingVerificationsForApprover(session.approverId),
    getDecidedVerificationsForApprover(session.approverId),
  ]);

  const confirmedCount = decided.filter((d) => d.status === "confirmed").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <DashboardHeader
        title="Approver"
        subtitle={identity ? `${identity.name} · ${identity.district}, ${identity.state}` : undefined}
        logoutAction={approverLogoutAction}
      />

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="Pending Requests" value={pending.length} />
        <StatCard label="Confirmed (recent)" value={confirmedCount} />
      </div>

      <h2 className="font-semibold text-[var(--ink)] mb-3">Pending Verification Requests</h2>
      {pending.length === 0 ? (
        <p className="text-[var(--ink-muted)] mb-8">
          No pending verification requests right now. New requests from people who pick you as their Approver during
          sign-up will show up here.
        </p>
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((item) => (
            <VerificationCard key={item.requestId} item={item} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <h2 className="font-semibold text-[var(--ink)] mb-3">Recently Decided</h2>
          <div className="space-y-2">
            {decided.map((item) => (
              <div
                key={item.requestId}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{item.displayName}</p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {item.profileType === "seeker" ? "Job Seeker" : "Job Giver"} · {item.district}
                  </p>
                </div>
                <StatusBadge status={item.status} label={item.status === "confirmed" ? "Confirmed" : "Unable to Confirm"} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
