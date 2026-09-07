// Drizzle schema for Central Panchayat Rojgar Setu.
// Translated from Section 6 (Data model) of rojgar-setu-master-build-prompt.md,
// with the Section 4.6 correction already applied: LOCATION is State -> District
// only. There is no City/Area/Ward sub-level anywhere in this schema — do not
// add one without re-reading Section 4.6 first.

import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// LOCATION — State -> District only. A "Remote/Anywhere" tag is a special row
// (isRemote = true) rather than a real district, so it can be selected the
// same way as any other location option.
// ---------------------------------------------------------------------------
export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    state: varchar("state", { length: 100 }).notNull(),
    district: varchar("district", { length: 100 }).notNull(),
    isRemote: boolean("is_remote").notNull().default(false),
  },
  (t) => [uniqueIndex("locations_state_district_uq").on(t.state, t.district)]
);

// ---------------------------------------------------------------------------
// USER — the one identity every panel logs into (Job Seeker / Job Giver use
// this; a single user can hold both a seeker and a giver profile at once).
// Approver and Central Admin are separate account types (see below) because
// their auth model differs (Section 4.1 / 10.6).
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  languagePref: varchar("language_pref", { length: 2 })
    .notNull()
    .default("hi"), // 'hi' | 'en'
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | suspended | deactivated
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// APPROVER — district-scoped verifier. Also authenticates via mobile+OTP
// (Section 4.1), but is a distinct account type from an ordinary USER because
// an Approver is appointed by Central Admin, not self-registered as a seeker
// or giver.
// ---------------------------------------------------------------------------
export const approvers = pgTable("approvers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  districtId: integer("district_id")
    .notNull()
    .references(() => locations.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// ADMIN_ACCOUNT — Central Admin. Password + TOTP 2FA, never mobile OTP
// (Section 4.1: "Central Admin does NOT use mobile OTP"). Each operator gets
// their own named account (Section 12: never a shared/generic admin login).
// ---------------------------------------------------------------------------
export const adminAccounts = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"), // set once 2FA enrollment completes
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// OTP_CODE — short-lived mobile verification codes (registration, login,
// mobile-number change). Never store the raw code, only a hash of it.
// ---------------------------------------------------------------------------
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  mobile: varchar("mobile", { length: 15 }).notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: varchar("purpose", { length: 30 }).notNull(), // register | login | mobile_change
  ipAddress: varchar("ip_address", { length: 64 }), // for per-IP/device rate limiting alongside per-number
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// SKILL / QUALIFICATION — shared lookup lists (Section 6). A person's skills
// and a job's required skills draw from the same `skills` table. Both lists
// are Admin-extensible data, and the seeker/job-post "Other" free-text entry
// creates a new row on demand rather than being schema.
// ---------------------------------------------------------------------------
export const qualifications = pgTable("qualifications", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 150 }).notNull().unique(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 150 }).notNull().unique(),
});

// ---------------------------------------------------------------------------
// JOB_SEEKER_PROFILE
// ---------------------------------------------------------------------------
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  name: varchar("name", { length: 150 }).notNull(),
  fatherName: varchar("father_name", { length: 150 }).notNull(),
  qualificationId: integer("qualification_id").references(
    () => qualifications.id
  ),
  qualificationOther: varchar("qualification_other", { length: 150 }),
  experience: text("experience"),
  expectedSalary: varchar("expected_salary", { length: 60 }),
  jobType: varchar("job_type", { length: 20 }).notNull().default("full_time"), // full_time | part_time | wfh
  // District-only location (Section 4.6) — never a full postal address.
  hometownDistrictId: integer("hometown_district_id")
    .notNull()
    .references(() => locations.id),
  approverId: integer("approver_id").references(() => approvers.id),
  verificationStatus: varchar("verification_status", { length: 20 })
    .notNull()
    .default("pending"), // pending | confirmed | unable_to_confirm | not_yet_done
  contactSharePolicy: varchar("contact_share_policy", { length: 20 })
    .notNull()
    .default("on_application"), // never | on_application | always — must persist for real, see Section 4.3
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// A seeker's preferred locations to search/be discovered in (multi-select,
// district-only — see Section 4.6). Distinct from hometownDistrictId.
export const seekerLocationPreferences = pgTable(
  "seeker_location_preferences",
  {
    seekerId: integer("seeker_id")
      .notNull()
      .references(() => jobSeekerProfiles.id, { onDelete: "cascade" }),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id),
  },
  (t) => [primaryKey({ columns: [t.seekerId, t.locationId] })]
);

export const jobSeekerSkills = pgTable(
  "job_seeker_skills",
  {
    seekerId: integer("seeker_id")
      .notNull()
      .references(() => jobSeekerProfiles.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id),
  },
  (t) => [primaryKey({ columns: [t.seekerId, t.skillId] })]
);

// ---------------------------------------------------------------------------
// JOB_GIVER_PROFILE
// ---------------------------------------------------------------------------
export const jobGiverProfiles = pgTable("job_giver_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  // Hidden from anonymous visitors, visible to registered users (Section 4.5).
  contactPersonName: varchar("contact_person_name", { length: 150 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  categoryOther: varchar("category_other", { length: 120 }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),
  about: text("about"),
  website: varchar("website", { length: 300 }),
  approverId: integer("approver_id").references(() => approvers.id),
  verificationStatus: varchar("verification_status", { length: 20 })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// JOB — posted by a Job Giver.
// ---------------------------------------------------------------------------
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  giverId: integer("giver_id")
    .notNull()
    .references(() => jobGiverProfiles.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  qualificationId: integer("qualification_id").references(
    () => qualifications.id
  ), // optional — Section 4.5: never force this field
  qualificationOther: varchar("qualification_other", { length: 150 }),
  jobType: varchar("job_type", { length: 20 }).notNull().default("full_time"), // full_time | part_time | wfh
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),
  salaryRange: varchar("salary_range", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open | closed
  moderationState: varchar("moderation_state", { length: 20 })
    .notNull()
    .default("approved"), // pending | approved | flagged | removed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobSkills = pgTable(
  "job_skills",
  {
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id),
  },
  (t) => [primaryKey({ columns: [t.jobId, t.skillId] })]
);

// ---------------------------------------------------------------------------
// APPLICATION — Sent -> Shortlisted / Not-a-fit
// ---------------------------------------------------------------------------
export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id),
    seekerId: integer("seeker_id")
      .notNull()
      .references(() => jobSeekerProfiles.id),
    status: varchar("status", { length: 20 }).notNull().default("sent"), // sent | shortlisted | not_a_fit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("applications_job_seeker_uq").on(t.jobId, t.seekerId)]
);

// ---------------------------------------------------------------------------
// VERIFICATION_REQUEST / NOTE — one row per profile x Approver pair.
// ---------------------------------------------------------------------------
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  profileType: varchar("profile_type", { length: 10 }).notNull(), // seeker | giver
  profileId: integer("profile_id").notNull(),
  approverId: integer("approver_id")
    .notNull()
    .references(() => approvers.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | confirmed | unable_to_confirm
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verificationNotes = pgTable("verification_notes", {
  id: serial("id").primaryKey(),
  verificationRequestId: integer("verification_request_id")
    .notNull()
    .references(() => verificationRequests.id, { onDelete: "cascade" }),
  approverId: integer("approver_id")
    .notNull()
    .references(() => approvers.id),
  note: text("note").notNull(), // internal only — never shown to the user being verified
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// CHAT_THREAD / PARTICIPANT / MESSAGE
// Section 4.8: "First contact from a profile/job creates a message request,
// not an open thread — the recipient accepts or declines before a real
// thread opens. Both sides can Block or Report at any point." `status`
// carries that state machine; `initiatorId` is who sent the request (so we
// know who is waiting on whom), and a thread that is blocked stays locked
// for both sides (a pragmatic, thread-level block rather than a separate
// global block list, since a thread is the only place two users interact).
// ---------------------------------------------------------------------------
export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  initiatorId: integer("initiator_id")
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | accepted | declined | blocked
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatParticipants = pgTable(
  "chat_participants",
  {
    threadId: integer("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.userId] })]
);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// CONTACT_PREFERENCE — one row per user (kept distinct from the seeker's
// contactSharePolicy above, which is the seeker-specific case; this table
// covers job givers / general notification-channel preferences).
// ---------------------------------------------------------------------------
export const contactPreferences = pgTable("contact_preferences", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  preferredChannel: varchar("preferred_channel", { length: 20 })
    .notNull()
    .default("whatsapp"), // whatsapp | sms | call
});

// ---------------------------------------------------------------------------
// NOTIFICATION
// ---------------------------------------------------------------------------
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 40 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// MODERATION_STATE / REPORT / SUGGESTION
// ---------------------------------------------------------------------------
export const moderationEvents = pgTable("moderation_events", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // job | seeker_profile | giver_profile
  targetId: integer("target_id").notNull(),
  state: varchar("state", { length: 20 }).notNull(), // pending | approved | flagged | removed
  moderatorId: integer("moderator_id").references(() => adminAccounts.id),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id")
    .notNull()
    .references(() => users.id),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open | reviewed | dismissed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// AUDIT_LOG — actor, action, target, before/after, timestamp. Every sensitive
// Admin/Approver action touching another user's data must write one of these.
// ---------------------------------------------------------------------------
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorType: varchar("actor_type", { length: 20 }).notNull(), // approver | admin
  actorId: integer("actor_id").notNull(),
  action: varchar("action", { length: 60 }).notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: integer("target_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// UI_STRING — Central-Admin-editable overrides for platform chrome text
// (Section 10: "stored as translation-key strings editable by Central Admin,
// never hard-coded"). src/lib/i18n/dict.ts is the code-shipped fallback; a
// row here for the same (key, lang) wins over it. A missing row (and a
// missing key here) falls back to the English fallback dict entry, never a
// blank string.
// ---------------------------------------------------------------------------
export const uiStrings = pgTable(
  "ui_strings",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull(),
    lang: varchar("lang", { length: 2 }).notNull(), // 'hi' | 'en'
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("ui_strings_key_lang_uq").on(t.key, t.lang)]
);

// ---------------------------------------------------------------------------
// Relations (for query ergonomics)
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ one }) => ({
  jobSeekerProfile: one(jobSeekerProfiles, {
    fields: [users.id],
    references: [jobSeekerProfiles.userId],
  }),
  jobGiverProfile: one(jobGiverProfiles, {
    fields: [users.id],
    references: [jobGiverProfiles.userId],
  }),
}));

export const jobSeekerProfilesRelations = relations(
  jobSeekerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [jobSeekerProfiles.userId],
      references: [users.id],
    }),
    hometownDistrict: one(locations, {
      fields: [jobSeekerProfiles.hometownDistrictId],
      references: [locations.id],
    }),
    approver: one(approvers, {
      fields: [jobSeekerProfiles.approverId],
      references: [approvers.id],
    }),
    locationPreferences: many(seekerLocationPreferences),
    skills: many(jobSeekerSkills),
    applications: many(applications),
  })
);

export const jobGiverProfilesRelations = relations(
  jobGiverProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [jobGiverProfiles.userId],
      references: [users.id],
    }),
    location: one(locations, {
      fields: [jobGiverProfiles.locationId],
      references: [locations.id],
    }),
    approver: one(approvers, {
      fields: [jobGiverProfiles.approverId],
      references: [approvers.id],
    }),
    jobs: many(jobs),
  })
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  giver: one(jobGiverProfiles, {
    fields: [jobs.giverId],
    references: [jobGiverProfiles.id],
  }),
  location: one(locations, {
    fields: [jobs.locationId],
    references: [locations.id],
  }),
  skills: many(jobSkills),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  seeker: one(jobSeekerProfiles, {
    fields: [applications.seekerId],
    references: [jobSeekerProfiles.id],
  }),
}));

export const approversRelations = relations(approvers, ({ one, many }) => ({
  district: one(locations, {
    fields: [approvers.districtId],
    references: [locations.id],
  }),
  seekerProfiles: many(jobSeekerProfiles),
  giverProfiles: many(jobGiverProfiles),
}));
