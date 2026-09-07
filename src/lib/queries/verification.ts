import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  verificationRequests,
  jobSeekerProfiles,
  jobGiverProfiles,
  users,
  locations,
} from "@/db/schema";

export type VerificationQueueItem = {
  requestId: number;
  profileType: "seeker" | "giver";
  profileId: number;
  status: string;
  displayName: string;
  secondaryName: string; // father's name (seeker) or contact person (giver)
  mobile: string;
  district: string;
  createdAt: Date;
};

/** Pending verification requests assigned to `approverId` (Section 4.2:
 * "valid for their own district" — this scoping is enforced by the
 * approverId foreign key on verification_requests, set at onboarding). */
export async function getPendingVerificationsForApprover(
  approverId: number
): Promise<VerificationQueueItem[]> {
  const pending = await db
    .select()
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.approverId, approverId),
        eq(verificationRequests.status, "pending")
      )
    );

  const items: VerificationQueueItem[] = [];
  for (const req of pending) {
    if (req.profileType === "seeker") {
      const row = await db
        .select({
          name: jobSeekerProfiles.name,
          fatherName: jobSeekerProfiles.fatherName,
          mobile: users.mobile,
          district: locations.district,
        })
        .from(jobSeekerProfiles)
        .innerJoin(users, eq(jobSeekerProfiles.userId, users.id))
        .innerJoin(locations, eq(jobSeekerProfiles.hometownDistrictId, locations.id))
        .where(eq(jobSeekerProfiles.id, req.profileId))
        .then((r) => r[0]);
      if (row) {
        items.push({
          requestId: req.id,
          profileType: "seeker",
          profileId: req.profileId,
          status: req.status,
          displayName: row.name,
          secondaryName: row.fatherName,
          mobile: row.mobile,
          district: row.district,
          createdAt: req.createdAt,
        });
      }
    } else {
      const row = await db
        .select({
          businessName: jobGiverProfiles.businessName,
          contactPersonName: jobGiverProfiles.contactPersonName,
          mobile: users.mobile,
          district: locations.district,
        })
        .from(jobGiverProfiles)
        .innerJoin(users, eq(jobGiverProfiles.userId, users.id))
        .innerJoin(locations, eq(jobGiverProfiles.locationId, locations.id))
        .where(eq(jobGiverProfiles.id, req.profileId))
        .then((r) => r[0]);
      if (row) {
        items.push({
          requestId: req.id,
          profileType: "giver",
          profileId: req.profileId,
          status: req.status,
          displayName: row.businessName,
          secondaryName: row.contactPersonName,
          mobile: row.mobile,
          district: row.district,
          createdAt: req.createdAt,
        });
      }
    }
  }
  return items;
}
