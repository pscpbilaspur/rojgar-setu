import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, jobSeekerProfiles, jobGiverProfiles } from "@/db/schema";
import { getSession } from "@/lib/session";

/** Cached per-request: verifies the session cookie and returns its payload,
 * or null. Never throws/redirects itself — callers decide what to do. */
export const verifySession = cache(async () => {
  return getSession();
});

/** Full current-user row + which profiles exist, for a `kind: "user"`
 * session (Job Seeker / Job Giver). Returns null if not signed in as one. */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session || session.kind !== "user") return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) return null;

  const [seekerProfile, giverProfile] = await Promise.all([
    db.query.jobSeekerProfiles.findFirst({
      where: eq(jobSeekerProfiles.userId, user.id),
    }),
    db.query.jobGiverProfiles.findFirst({
      where: eq(jobGiverProfiles.userId, user.id),
    }),
  ]);

  return { user, seekerProfile, giverProfile };
});

/** Redirects to /login if not signed in as a seeker/giver user. */
export async function requireUser() {
  const data = await getCurrentUser();
  if (!data) redirect("/login");
  return data;
}

export const getCurrentApprover = cache(async () => {
  const session = await verifySession();
  if (!session || session.kind !== "approver") return null;
  return session;
});

export async function requireApprover() {
  const session = await getCurrentApprover();
  if (!session) redirect("/approver/login");
  return session;
}

export const getCurrentAdmin = cache(async () => {
  const session = await verifySession();
  if (!session || session.kind !== "admin") return null;
  return session;
});

export async function requireAdmin() {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}
