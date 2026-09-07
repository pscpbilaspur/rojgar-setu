import { requireApprover } from "@/lib/dal";
import { getPendingVerificationsForApprover } from "@/lib/queries/verification";
import { approverLogoutAction } from "@/app/actions/approver-auth";
import { VerificationCard } from "./VerificationCard";

export default async function ApproverDashboardPage() {
  const session = await requireApprover();
  const items = await getPendingVerificationsForApprover(session.approverId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[var(--ink)]">Verification Requests</h1>
        <form action={approverLogoutAction}>
          <button type="submit" className="text-sm underline text-[var(--ink-muted)]">
            Log out
          </button>
        </form>
      </div>
      {items.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No pending verification requests.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <VerificationCard key={item.requestId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
