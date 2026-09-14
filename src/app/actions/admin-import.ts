"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  users,
  jobSeekerProfiles,
  jobSeekerSkills,
  seekerLocationPreferences,
  verificationRequests,
  qualifications,
  skills,
  auditLogs,
} from "@/db/schema";
import { requireAdmin } from "@/lib/dal";
import { parseCsv } from "@/lib/csv";

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
 * candidate — handles Excel/PDF-exported headers that carry a Hindi
 * subtitle on the same cell, e.g. "Full Name पूरा नाम"). */
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
 * Bulk-imports Job Seeker profiles from a CSV file (Admin panel → Import
 * Job Seekers). Every row in one file is assigned the same District and
 * Approver — chosen once for the whole batch, not per row — matching how
 * these lists are actually compiled (one sheet per district/event).
 *
 * Rows are skipped (not failed outright) for: a missing name, a missing or
 * invalid 10-digit mobile number, or a mobile number that already has a Job
 * Seeker profile. Skipped rows are reported back, not silently dropped.
 *
 * Columns with no matching database field yet (Gender, Age, full street
 * Address) are folded into the profile's free-text "experience" field
 * instead of being discarded — see the "Notes / Address (from import)" line
 * — so nothing entered on the original sheet is lost, even though it isn't
 * queryable/structured data. Add real columns later if that's ever needed.
 */
export async function importSeekersAction(
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

  const allQualifications = await db.select().from(qualifications);
  const allSkills = await db.select().from(skills);
  const skillIdByLabel = new Map(allSkills.map((s) => [s.label.toLowerCase(), s.id]));

  const results: ImportRowResult[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // account for the header row

    const name = getField(row, "full name", "name", "पूरा नाम");
    const mobileRaw = getField(row, "phone number", "mobile number", "mobile", "phone");
    const mobile = mobileRaw.replace(/\D/g, "").slice(-10);

    if (!name) {
      results.push({ row: rowNum, name: "(blank)", status: "skipped", reason: "Missing name" });
      skipped++;
      continue;
    }
    if (!MOBILE_RE.test(mobile)) {
      results.push({
        row: rowNum,
        name,
        status: "skipped",
        reason: mobileRaw ? `Invalid phone number ("${mobileRaw}")` : "Missing phone number",
      });
      skipped++;
      continue;
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.mobile, mobile) });
    if (existingUser) {
      const existingProfile = await db.query.jobSeekerProfiles.findFirst({
        where: eq(jobSeekerProfiles.userId, existingUser.id),
      });
      if (existingProfile) {
        results.push({
          row: rowNum,
          name,
          status: "skipped",
          reason: `Mobile ${mobile} already has a Job Seeker profile`,
        });
        skipped++;
        continue;
      }
    }

    const qualLabel = getField(row, "highest qualification", "qualification", "सर्वोच्च योग्यता");
    const qualMatch = qualLabel
      ? allQualifications.find((q) => q.label.toLowerCase() === qualLabel.toLowerCase())
      : undefined;

    const skillsText = getField(row, "specialization", "skills", "कौशल");
    const skillNames = skillsText
      .split(/[,;/]|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean);
    const skillIds: number[] = [];
    for (const skillName of skillNames) {
      const key = skillName.toLowerCase();
      let id = skillIdByLabel.get(key);
      if (!id) {
        const [newSkill] = await db.insert(skills).values({ label: skillName }).returning();
        id = newSkill.id;
        skillIdByLabel.set(key, id);
      }
      skillIds.push(id);
    }

    const previousJob = getField(row, "previous job", "पिछली नौकरी");
    const otherInfo = getField(row, "any other information", "any other info", "कोई और जानकारी");
    const address = getField(row, "address", "पता");
    const gender = getField(row, "gender", "लिंग");
    const age = getField(row, "age", "आयु");

    const experienceParts = [
      getField(row, "work experience", "experience", "कार्य अनुभव"),
      previousJob && `Previous job: ${previousJob}`,
      otherInfo && `Notes: ${otherInfo}`,
      (gender || age) && `From import — Gender: ${gender || "—"}, Age: ${age || "—"}`,
      address && `Address (from import, not shown publicly): ${address}`,
    ].filter(Boolean);

    await db.transaction(async (tx) => {
      const [user] = existingUser ? [existingUser] : await tx.insert(users).values({ mobile }).returning();

      const [profile] = await tx
        .insert(jobSeekerProfiles)
        .values({
          userId: user.id,
          name,
          fatherName: "", // not collected on the source sheet; the seeker or
          // an admin can fill this in later via the profile edit screen.
          hometownDistrictId: districtId,
          qualificationId: qualMatch?.id,
          qualificationOther: qualMatch ? undefined : qualLabel || undefined,
          experience: experienceParts.join("\n") || undefined,
          expectedSalary: getField(row, "desired minimum salary", "expected salary", "वांछित न्यूनतम वेतन") || undefined,
          approverId,
          contactSharePolicy: "on_application",
        })
        .returning();

      if (skillIds.length > 0) {
        await tx.insert(jobSeekerSkills).values(skillIds.map((skillId) => ({ seekerId: profile.id, skillId })));
      }

      await tx.insert(seekerLocationPreferences).values({ seekerId: profile.id, locationId: districtId });

      await tx.insert(verificationRequests).values({
        profileType: "seeker",
        profileId: profile.id,
        approverId,
        status: "pending",
      });
    });

    results.push({ row: rowNum, name, status: "created" });
    created++;
  }

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "bulk_import_seekers",
    targetType: "import",
    targetId: districtId,
    before: null,
    after: { created, skipped, totalRows: rows.length },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/import");

  return { success: true, results, created, skipped };
}
