"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, jobGiverProfiles, verificationRequests, auditLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/dal";
import { parseCsv } from "@/lib/csv";
import { JOB_CATEGORIES } from "@/db/seed-data/districts";

const MOBILE_RE = /^[6-9]\d{9}$/;

export type ImportRowResult = {
  row: number;
  name: string;
  status: "created" | "skipped";
  reason?: string;
};

export type ImportResult =
  | { error: string }
  | { success: true; results: ImportRowResult[]; created: number; skipped: number };

/** Looks a value up in a CSV row by trying several possible header spellings
 * (case-insensitive, and matching a header that merely *starts with* the
 * candidate — same flexible-matching approach as the Job Seeker importer). */
function getField(row: Record<string, string>, ...candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const needle = candidate.toLowerCase();
    const key = keys.find((k) => k.trim().toLowerCase().startsWith(needle));
    if (key) return (row[key] ?? "").trim();
  }
  return "";
}

/**
 * Bulk-imports Job Giver profiles from a CSV file (Admin panel → Import Job
 * Givers). Mirrors importSeekersAction in admin-import.ts — same one
 * District + one Approver applied to every row in the file, same
 * skip-with-reason (not fail-the-whole-file) behaviour.
 *
 * Required columns: Business Name, Phone Number. Contact Person Name falls
 * back to the business name if left blank (the schema requires it, but a
 * quick test/demo sheet may not always fill it in). Category falls back to
 * "Other" if blank or not one of the seeded categories — never blocks the
 * row on that account.
 */
export async function importGiversAction(
  csvText: string,
  districtId: number,
  approverId: number
): Promise<ImportResult> {
  const admin = await requireAdmin();

  if (!csvText || !csvText.trim()) return { error: "The file is empty." };
  if (!districtId || !approverId) return { error: "Select a district and an Approver first." };

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(csvText);
  } catch {
    return { error: "Could not read this file as CSV. Make sure it's saved in CSV format." };
  }
  if (rows.length === 0) return { error: "No data rows found in the file." };

  const results: ImportRowResult[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // account for the header row

    const businessName = getField(row, "business name", "name", "व्यवसाय का नाम");
    const mobileRaw = getField(row, "phone number", "mobile number", "mobile", "phone");
    const mobile = mobileRaw.replace(/\D/g, "").slice(-10);

    if (!businessName) {
      results.push({ row: rowNum, name: "(blank)", status: "skipped", reason: "Missing business name" });
      skipped++;
      continue;
    }
    if (!MOBILE_RE.test(mobile)) {
      results.push({
        row: rowNum,
        name: businessName,
        status: "skipped",
        reason: mobileRaw ? `Invalid phone number ("${mobileRaw}")` : "Missing phone number",
      });
      skipped++;
      continue;
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.mobile, mobile) });
    if (existingUser) {
      const existingProfile = await db.query.jobGiverProfiles.findFirst({
        where: eq(jobGiverProfiles.userId, existingUser.id),
      });
      if (existingProfile) {
        results.push({
          row: rowNum,
          name: businessName,
          status: "skipped",
          reason: `Mobile ${mobile} already has a Job Giver profile`,
        });
        skipped++;
        continue;
      }
    }

    const contactPersonName = getField(row, "contact person", "contact name") || businessName;
    const categoryRaw = getField(row, "category", "श्रेणी");
    const categoryMatch = JOB_CATEGORIES.find((c) => c.toLowerCase() === categoryRaw.toLowerCase());
    const about = getField(row, "about", "description", "विवरण");
    const website = getField(row, "website", "वेबसाइट");

    await db.transaction(async (tx) => {
      const [user] = existingUser ? [existingUser] : await tx.insert(users).values({ mobile }).returning();

      const [profile] = await tx
        .insert(jobGiverProfiles)
        .values({
          userId: user.id,
          businessName,
          contactPersonName,
          category: categoryMatch ?? "Other",
          categoryOther: categoryMatch ? undefined : categoryRaw || undefined,
          locationId: districtId,
          about: about || undefined,
          website: website || undefined,
          approverId,
        })
        .returning();

      await tx.insert(verificationRequests).values({
        profileType: "giver",
        profileId: profile.id,
        approverId,
        status: "pending",
      });
    });

    results.push({ row: rowNum, name: businessName, status: "created" });
    created++;
  }

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "bulk_import_givers",
    targetType: "import",
    targetId: districtId,
    before: null,
    after: { created, skipped, totalRows: rows.length },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/import-givers");

  return { success: true, results, created, skipped };
}
