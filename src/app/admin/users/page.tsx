import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { users, jobSeekerProfiles, jobGiverProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
  await requireAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      mobile: users.mobile,
      status: users.status,
      seekerName: jobSeekerProfiles.name,
      giverName: jobGiverProfiles.businessName,
    })
    .from(users)
    .leftJoin(jobSeekerProfiles, eq(jobSeekerProfiles.userId, users.id))
    .leftJoin(jobGiverProfiles, eq(jobGiverProfiles.userId, users.id))
    .orderBy(desc(users.createdAt));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Users ({allUsers.length})</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border)]">
              <th className="py-2 px-2">Mobile</th>
              <th className="py-2 px-2">Seeker profile</th>
              <th className="py-2 px-2">Giver profile</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <UserRow key={u.id} {...u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
