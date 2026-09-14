import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  verificationRequests,
  jobSeekerProfiles,
  jobGiverProfiles,
  users,
  locations,
  approvers,
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
  // Only set by getDecidedVerificationsForApprover — when the Approver
  // actually made the decision (verificationRequests.updatedAt), as
  // opposed to createdAt which is when the request first came in.
  decidedAt?: Date;
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

/** The Approver's own name and district, for the dashboard header — the
 * session (session.ts) only carries approverId/districtId, not the name,
 * so this is a small lookup rather than plumbing it through the JWT. */
export async function getApproverIdentity(approverId: number) {
  const row = await db
    .select({ name: approvers.name, district: locations.district, state: locations.state })
    .from(approvers)
    .innerJoin(locations, eq(approvers.districtId, locations.id))
    .where(eq(approvers.id, approverId))
    .then((r) => r[0]);
  return row ?? null;
}

/** Most recently decided requests (Confirmed / Unable to Confirm) for this
 * Approver, most recent first — so the dashboard isn't just an empty-looking
 * queue once everything pending has been worked through; the Approver can
 * see what they already decided without digging through the Audit Log. */
export async function getDecidedVerificationsForApprover(
  approverId: number,
  limit = 10
): Promise<VerificationQueueItem[]> {
  const decided = await db
    .select()
    .from(verificationRequests)
    .where(and(eq(verificationRequests.approverId, approverId), ne(verificationRequests.status, "pending")))
    .orderBy(desc(verificationRequests.updatedAt))
    .limit(limit);

  const items: VerificationQueueItem[] = [];
  for (const req of decided) {
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
          decidedAt: req.updatedAt,
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
          decidedAt: req.updatedAt,
        });
      }
    }
  }
  return items;
}
