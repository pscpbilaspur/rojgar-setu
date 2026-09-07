import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import {
  CHHATTISGARH_DISTRICTS,
  QUALIFICATIONS,
  SKILLS,
} from "./seed-data/districts";
import bcrypt from "bcryptjs";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding locations (Chhattisgarh districts + Remote tag)...");
  const locationRows = [
    ...CHHATTISGARH_DISTRICTS.map((d) => ({
      state: "Chhattisgarh",
      district: d,
      isRemote: false,
    })),
    { state: "—", district: "Remote / Anywhere", isRemote: true },
  ];
  const insertedLocations = await db
    .insert(schema.locations)
    .values(locationRows)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedLocations.length} location rows inserted.`);

  console.log("Seeding qualifications...");
  await db
    .insert(schema.qualifications)
    .values(QUALIFICATIONS.map((label) => ({ label })))
    .onConflictDoNothing();

  console.log("Seeding skills...");
  await db
    .insert(schema.skills)
    .values(SKILLS.map((label) => ({ label })))
    .onConflictDoNothing();

  console.log("Seeding a Central Admin account (username: admin)...");
  const existingAdmin = await db.query.adminAccounts.findFirst({
    where: (a, { eq }) => eq(a.username, "admin"),
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    await db.insert(schema.adminAccounts).values({
      username: "admin",
      name: "Central Admin",
      passwordHash,
      status: "active",
    });
    console.log(
      "  -> created admin/ChangeMe123! — CHANGE THIS PASSWORD before any real use."
    );
  } else {
    console.log("  -> admin account already exists, skipped.");
  }

  console.log("Seeding a demo Approver for Bilaspur...");
  const bilaspur = await db.query.locations.findFirst({
    where: (l, { eq, and }) =>
      and(eq(l.district, "Bilaspur"), eq(l.state, "Chhattisgarh")),
  });
  if (bilaspur) {
    const existingApprover = await db.query.approvers.findFirst({
      where: (a, { eq }) => eq(a.mobile, "9999900001"),
    });
    if (!existingApprover) {
      await db.insert(schema.approvers).values({
        name: "Demo Approver (Bilaspur)",
        mobile: "9999900001",
        districtId: bilaspur.id,
        status: "active",
      });
      console.log("  -> demo approver created (mobile 9999900001).");
    } else {
      console.log("  -> demo approver already exists, skipped.");
    }
  }

  console.log("Seed complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
