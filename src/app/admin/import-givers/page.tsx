import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { locations, approvers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ImportGiversForm } from "./ImportGiversForm";

export default async function ImportGiversPage() {
  await requireAdmin();

  const districts = await db
    .select()
    .from(locations)
    .where(eq(locations.isRemote, false))
    .orderBy(asc(locations.district));

  const activeApprovers = await db
    .select({ id: approvers.id, name: approvers.name, districtId: approvers.districtId })
    .from(approvers)
    .where(eq(approvers.status, "active"));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-2">Import Job Givers</h1>
      <p className="text-sm text-[var(--ink-muted)] mb-6">
        Upload a CSV file (from Excel: <strong>File → Save As → CSV UTF-8</strong>) with column headers. Only{" "}
        <strong>Business Name</strong> and <strong>Phone Number</strong> are required — a row is skipped (and
        reported below, not silently lost) if either is missing or the phone number isn&apos;t a valid 10-digit
        mobile number. These columns are also read if present:{" "}
        <strong>Contact Person, Category, About, Website</strong>. Every row in one file is assigned the same
        District and Approver, picked below — for a mixed-district list, split it into separate files first.
      </p>

      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <ImportGiversForm districts={districts} approvers={activeApprovers} />
      </div>
    </div>
  );
}
