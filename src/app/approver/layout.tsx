import { BackHomeBar } from "@/components/BackHomeBar";
import { getCurrentApprover } from "@/lib/dal";
import { getApproverIdentity } from "@/lib/queries/verification";

export default async function ApproverLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentApprover();
  const identity = session ? await getApproverIdentity(session.approverId) : null;

  return (
    <>
      <BackHomeBar
        homeHref="/approver/dashboard"
        homeLabel="Approver Home"
        hideOn={["/approver/login"]}
        identity={identity ? `${identity.name} (Approver)` : undefined}
      />
      {children}
    </>
  );
}
