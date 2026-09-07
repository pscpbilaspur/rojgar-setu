import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { approvers, locations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NewApproverForm } from "./NewApproverForm";
import { ApproverRow } from "./ApproverRow";

export default async function ApproversPage() {
  await requireAdmin();

  const allApprovers = await db
    .select({
      id: approvers.id,
      name: approvers.name,
      mobile: approvers.mobile,
      status: approvers.status,
      district: locations.district,
    })
    .from(approvers)
    .innerJoin(locations, eq(approvers.districtId, locations.id))
    .orderBy(asc(locations.district));

  const districts = await db
    .select()
    .from(locations)
    .where(eq(locations.isRemote, false))
    .orderBy(asc(locations.district));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Approvers & Districts</h1>

      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 mb-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="font-semibold text-[var(--ink)] mb-2">Assign a new Approver</h2>
        <NewApproverForm districts={districts} />
      </div>

      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="font-semibold text-[var(--ink)] mb-2">All Approvers ({allApprovers.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border)]">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Mobile</th>
              <th className="py-2 px-2">District</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {allApprovers.map((a) => (
              <ApproverRow key={a.id} {...a} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
