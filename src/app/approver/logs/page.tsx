import { requireApprover } from "@/lib/dal";
import { getDecidedVerificationsForApprover, getApproverIdentity } from "@/lib/queries/verification";
import { StatusBadge } from "@/components/ui";
import { formatDateTimeIST } from "@/lib/format";

// The Approver's full decision history — the dashboard's own "Recently
// Decided" section only ever shows the last 10 (to keep the dashboard
// itself short), this page has no such cap, so it's the place an Approver
// actually goes to look something up from further back.
const LOGS_LIMIT = 300;

export default async function ApproverLogsPage() {
  const session = await requireApprover();
  const [identity, decided] = await Promise.all([
    getApproverIdentity(session.approverId),
    getDecidedVerificationsForApprover(session.approverId, LOGS_LIMIT),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)]">My Logs</h1>
      <p className="text-sm text-[var(--ink-muted)] mt-0.5 mb-6">
        {identity ? `${identity.name} · ${identity.district}, ${identity.state}` : " "} — every verification
        you've decided, most recent first.
      </p>

      {decided.length === 0 ? (
        <p className="text-[var(--ink-muted)]">
          Nothing here yet — decisions you make on verification requests (Confirm / Unable to Confirm) will show up
          here.
        </p>
      ) : (
        <div className="space-y-2">
          {decided.map((item) => (
            <div
              key={item.requestId}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3.5"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)] truncate">{item.displayName}</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-0.5">
                    {item.profileType === "seeker" ? "Job Seeker" : "Job Giver"} · {item.district}
                  </p>
                </div>
                <StatusBadge status={item.status} label={item.status === "confirmed" ? "Confirmed" : "Unable to Confirm"} />
              </div>
              {item.decidedAt && (
                <p className="text-[11px] text-[var(--ink-faint)] mt-2">{formatDateTimeIST(item.decidedAt)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
