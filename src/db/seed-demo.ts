// Richer demo/QA data on top of seed.ts's base lookups. Idempotent per
// mobile number (unique) — safe to re-run. Bypasses the OTP/onboarding UI
// on purpose since this is fixture data, not a flow under test; every
// number used here is a clearly-fake 70000000xx / 80000000xx range.
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function findOrCreateUser(mobile: string) {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.mobile, mobile) });
  if (existing) return existing;
  const [created] = await db.insert(schema.users).values({ mobile }).returning();
  return created;
}

async function districtId(name: string) {
  const row = await db.query.locations.findFirst({
    where: and(eq(schema.locations.district, name), eq(schema.locations.state, "Chhattisgarh")),
  });
  if (!row) throw new Error(`District not seeded: ${name}`);
  return row.id;
}

async function qualificationId(label: string) {
  const row = await db.query.qualifications.findFirst({ where: eq(schema.qualifications.label, label) });
  return row?.id;
}

async function skillIds(labels: string[]) {
  const rows = await db.query.skills.findMany({ where: (s, { inArray }) => inArray(s.label, labels) });
  return rows.map((r) => r.id);
}

async function ensureApprover(name: string, mobile: string, district: string) {
  const existing = await db.query.approvers.findFirst({ where: eq(schema.approvers.mobile, mobile) });
  if (existing) return existing;
  const locId = await districtId(district);
  const [created] = await db.insert(schema.approvers).values({ name, mobile, districtId: locId, status: "active" }).returning();
  return created;
}

async function main() {
  console.log("Seeding additional Approvers across districts...");
  const approvers = await Promise.all([
    ensureApprover("Anita Chhabria", "9999900002", "Raipur"),
    ensureApprover("Deepak Bhavnani", "9999900003", "Durg"),
    ensureApprover("Kavita Vaswani", "9999900004", "Korba"),
    ensureApprover("Ramesh Advani", "9999900005", "Raigarh"),
    ensureApprover("Sunita Hinduja", "9999900006", "Rajnandgaon"),
    ensureApprover("Mahesh Tanwani", "9999900007", "Bastar"),
  ]);
  console.log(`  -> ${approvers.length} approvers ready.`);

  const bilaspurApprover = await db.query.approvers.findFirst({ where: eq(schema.approvers.mobile, "9999900001") });
  const raipurApprover = approvers[0];
  const durgApprover = approvers[1];
  const korbaApprover = approvers[2];

  console.log("Seeding demo Job Seekers...");
  const seekerSpecs = [
    {
      mobile: "7000001001",
      name: "Priya Sharma",
      fatherName: "Rajesh Sharma",
      district: "Raipur",
      qualification: "Graduate",
      skills: ["MS Office / Typing", "Tally / Accounting"],
      experience: "3 years as an office admin assistant.",
      expectedSalary: "16000",
      jobType: "full_time" as const,
      approver: raipurApprover,
      verification: "confirmed" as const,
      contactSharePolicy: "on_application" as const,
    },
    {
      mobile: "7000001002",
      name: "Vikas Chandani",
      fatherName: "Mohan Chandani",
      district: "Durg",
      qualification: "12th Pass",
      skills: ["Driving (LMV)", "Delivery / Logistics"],
      experience: "5 years two-wheeler and car delivery experience.",
      expectedSalary: "14000",
      jobType: "full_time" as const,
      approver: durgApprover,
      verification: "confirmed" as const,
      contactSharePolicy: "always" as const,
    },
    {
      mobile: "7000001003",
      name: "Sneha Kripalani",
      fatherName: "Ashok Kripalani",
      district: "Korba",
      qualification: "Graduate",
      skills: ["Teaching / Tutoring", "Social Media Handling"],
      experience: "1 year as a school teaching assistant.",
      expectedSalary: "12000",
      jobType: "part_time" as const,
      approver: korbaApprover,
      verification: "pending" as const,
      contactSharePolicy: "on_application" as const,
    },
    {
      mobile: "7000001004",
      name: "Rohit Bhagchandani",
      fatherName: "Suresh Bhagchandani",
      district: "Bilaspur",
      qualification: "10th Pass",
      skills: ["Retail / Shop Management", "Sales & Marketing"],
      experience: "2 years managing a family retail shop.",
      expectedSalary: "13000",
      jobType: "full_time" as const,
      approver: bilaspurApprover,
      verification: "unable_to_confirm" as const,
      contactSharePolicy: "never" as const,
    },
    {
      mobile: "7000001005",
      name: "Kiran Melwani",
      fatherName: "Prakash Melwani",
      district: "Raipur",
      qualification: "ITI",
      skills: ["Electrician", "Plumbing"],
      experience: "4 years as an electrician on residential sites.",
      expectedSalary: "17000",
      jobType: "full_time" as const,
      approver: raipurApprover,
      verification: "confirmed" as const,
      contactSharePolicy: "on_application" as const,
    },
  ];

  const seekerProfiles: { id: number; name: string }[] = [];
  for (const spec of seekerSpecs) {
    const user = await findOrCreateUser(spec.mobile);
    const existing = await db.query.jobSeekerProfiles.findFirst({ where: eq(schema.jobSeekerProfiles.userId, user.id) });
    if (existing) {
      seekerProfiles.push({ id: existing.id, name: existing.name });
      continue;
    }
    const distId = await districtId(spec.district);
    const qualId = await qualificationId(spec.qualification);
    const skIds = await skillIds(spec.skills);
    if (!spec.approver) throw new Error("Missing approver for seeker seed");

    const [profile] = await db
      .insert(schema.jobSeekerProfiles)
      .values({
        userId: user.id,
        name: spec.name,
        fatherName: spec.fatherName,
        hometownDistrictId: distId,
        qualificationId: qualId,
        experience: spec.experience,
        expectedSalary: spec.expectedSalary,
        jobType: spec.jobType,
        approverId: spec.approver.id,
        verificationStatus: spec.verification,
        contactSharePolicy: spec.contactSharePolicy,
      })
      .returning();

    if (skIds.length > 0) {
      await db.insert(schema.jobSeekerSkills).values(skIds.map((skillId) => ({ seekerId: profile.id, skillId })));
    }
    await db.insert(schema.seekerLocationPreferences).values({ seekerId: profile.id, locationId: distId });
    await db.insert(schema.verificationRequests).values({
      profileType: "seeker",
      profileId: profile.id,
      approverId: spec.approver.id,
      status: spec.verification,
    });
    seekerProfiles.push({ id: profile.id, name: profile.name });
    console.log(`  -> created seeker ${spec.name} (${spec.district}, ${spec.verification}).`);
  }

  console.log("Seeding demo Job Givers...");
  const giverSpecs = [
    {
      mobile: "7000002001",
      businessName: "Sindhi Sweets & Namkeen",
      contactPersonName: "Rakesh Chawla",
      category: "Restaurant / Food",
      district: "Raipur",
      about: "A family-run sweets shop serving the local market for 20 years.",
      approver: raipurApprover,
      verification: "confirmed" as const,
    },
    {
      mobile: "7000002002",
      businessName: "Chandani Electricals",
      contactPersonName: "Suresh Chandani",
      category: "Retail / Shop",
      district: "Durg",
      about: "Electrical goods retailer and installation services.",
      approver: durgApprover,
      verification: "confirmed" as const,
    },
    {
      mobile: "7000002003",
      businessName: "Bright Future Coaching Classes",
      contactPersonName: "Meena Sirwani",
      category: "Education / Coaching",
      district: "Korba",
      about: "Coaching classes for classes 9-12, all subjects.",
      approver: korbaApprover,
      verification: "pending" as const,
    },
    {
      mobile: "7000002004",
      businessName: "Bilaspur Freight Movers",
      contactPersonName: "Anil Kumar",
      category: "Transport / Delivery",
      district: "Bilaspur",
      about: "Local and intercity goods transport.",
      approver: bilaspurApprover,
      verification: "confirmed" as const,
    },
  ];

  const giverProfiles: { id: number; businessName: string; userId: number }[] = [];
  for (const spec of giverSpecs) {
    const user = await findOrCreateUser(spec.mobile);
    const existing = await db.query.jobGiverProfiles.findFirst({ where: eq(schema.jobGiverProfiles.userId, user.id) });
    if (existing) {
      giverProfiles.push({ id: existing.id, businessName: existing.businessName, userId: user.id });
      continue;
    }
    const distId = await districtId(spec.district);
    if (!spec.approver) throw new Error("Missing approver for giver seed");

    const [profile] = await db
      .insert(schema.jobGiverProfiles)
      .values({
        userId: user.id,
        businessName: spec.businessName,
        contactPersonName: spec.contactPersonName,
        category: spec.category,
        locationId: distId,
        about: spec.about,
        approverId: spec.approver.id,
        verificationStatus: spec.verification,
      })
      .returning();

    await db.insert(schema.verificationRequests).values({
      profileType: "giver",
      profileId: profile.id,
      approverId: spec.approver.id,
      status: spec.verification,
    });
    giverProfiles.push({ id: profile.id, businessName: profile.businessName, userId: user.id });
    console.log(`  -> created giver ${spec.businessName} (${spec.district}, ${spec.verification}).`);
  }

  console.log("Seeding demo Jobs...");
  const jobSpecs = [
    {
      giverBusinessName: "Sindhi Sweets & Namkeen",
      title: "Sweet Shop Counter Staff",
      description: "Looking for a counter staff member for our sweets shop. Daily cash handling and customer service.",
      qualification: "10th Pass",
      skills: ["Retail / Shop Management", "Customer Service"],
      jobType: "full_time" as const,
      district: "Raipur",
      salaryRange: "₹10,000 - ₹13,000/month",
    },
    {
      giverBusinessName: "Chandani Electricals",
      title: "Electrician Helper",
      description: "Assist our senior electrician on residential and shop wiring jobs across Durg.",
      qualification: "ITI",
      skills: ["Electrician"],
      jobType: "full_time" as const,
      district: "Durg",
      salaryRange: "₹12,000 - ₹16,000/month",
    },
    {
      giverBusinessName: "Bright Future Coaching Classes",
      title: "Part-time Mathematics Tutor",
      description: "Evening batches for classes 9 and 10, Mathematics only.",
      qualification: "Graduate",
      skills: ["Teaching / Tutoring"],
      jobType: "part_time" as const,
      district: "Korba",
      salaryRange: "₹6,000 - ₹9,000/month",
    },
    {
      giverBusinessName: "Bilaspur Freight Movers",
      title: "Delivery Driver (LMV)",
      description: "Local delivery routes across Bilaspur district, own license required.",
      qualification: "10th Pass",
      skills: ["Driving (LMV)", "Delivery / Logistics"],
      jobType: "full_time" as const,
      district: "Bilaspur",
      salaryRange: "₹14,000 - ₹18,000/month",
    },
    {
      giverBusinessName: "Sindhi Sweets & Namkeen",
      title: "Social Media Handler (Work From Home)",
      description: "Manage our Instagram and WhatsApp catalogue updates, a few hours a day.",
      qualification: "12th Pass",
      skills: ["Social Media Handling"],
      jobType: "wfh" as const,
      district: "Raipur",
      salaryRange: "₹5,000 - ₹7,000/month",
    },
  ];

  for (const spec of jobSpecs) {
    const giver = giverProfiles.find((g) => g.businessName === spec.giverBusinessName);
    if (!giver) continue;
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(schema.jobs.giverId, giver.id), eq(schema.jobs.title, spec.title)),
    });
    if (existingJob) continue;

    const distId = await districtId(spec.district);
    const qualId = await qualificationId(spec.qualification);
    const skIds = await skillIds(spec.skills);

    const [job] = await db
      .insert(schema.jobs)
      .values({
        giverId: giver.id,
        title: spec.title,
        description: spec.description,
        qualificationId: qualId,
        jobType: spec.jobType,
        locationId: distId,
        salaryRange: spec.salaryRange,
        status: "open",
        moderationState: "approved",
      })
      .returning();

    if (skIds.length > 0) {
      await db.insert(schema.jobSkills).values(skIds.map((skillId) => ({ jobId: job.id, skillId })));
    }
    console.log(`  -> created job "${spec.title}" for ${spec.giverBusinessName}.`);
  }

  console.log("Seeding a few demo Applications...");
  const priya = seekerProfiles.find((s) => s.name === "Priya Sharma");
  const kiran = seekerProfiles.find((s) => s.name === "Kiran Melwani");
  const sweetShopJob = await db.query.jobs.findFirst({ where: eq(schema.jobs.title, "Sweet Shop Counter Staff") });
  const electricianJob = await db.query.jobs.findFirst({ where: eq(schema.jobs.title, "Electrician Helper") });

  const applicationSpecs = [
    priya && sweetShopJob ? { seekerId: priya.id, jobId: sweetShopJob.id, status: "sent" as const } : null,
    kiran && electricianJob ? { seekerId: kiran.id, jobId: electricianJob.id, status: "shortlisted" as const } : null,
  ].filter((x): x is { seekerId: number; jobId: number; status: "sent" | "shortlisted" } => x !== null);

  for (const spec of applicationSpecs) {
    const existing = await db.query.applications.findFirst({
      where: and(eq(schema.applications.jobId, spec.jobId), eq(schema.applications.seekerId, spec.seekerId)),
    });
    if (existing) continue;
    await db.insert(schema.applications).values({ jobId: spec.jobId, seekerId: spec.seekerId, status: spec.status });
    console.log(`  -> created application (seeker ${spec.seekerId} -> job ${spec.jobId}, ${spec.status}).`);
  }

  console.log("Demo seed complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
