/** Shared date/time formatting, always pinned to India Standard Time.
 *
 * Bug this exists to prevent: `new Date(x).toLocaleString("en-IN")` looks
 * right (Indian digit/date style) but does NOT mean "show in Indian time" —
 * without an explicit `timeZone`, `toLocaleString` uses the JS runtime's own
 * local timezone. In the browser that's usually fine (a phone in India is
 * already on IST), but every one of these calls that runs in a Server
 * Component renders on Vercel's server, which runs in UTC — so timestamps
 * were showing 5.5 hours off from the real time. Always pass
 * `timeZone: "Asia/Kolkata"` explicitly, from these helpers, everywhere a
 * timestamp is shown to a user. */

const IST_TIME_ZONE = "Asia/Kolkata";

export function formatDateTimeIST(value: Date | string): string {
  return new Date(value).toLocaleString("en-IN", { timeZone: IST_TIME_ZONE });
}

export function formatDateIST(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-IN", { timeZone: IST_TIME_ZONE });
}

/**
 * The one canonical, public-facing wording for each Basic Verification
 * status — previously each page phrased the same four statuses slightly
 * differently ("Verification pending" / "Basic verification not yet done" /
 * "Basic Verification not yet done", inconsistent capitalization, etc.),
 * which reads as sloppy when the same profile's status is seen worded
 * differently on different pages. Every public-facing page (dashboard,
 * People/Givers browse and detail pages, onboarding) should read this
 * instead of hardcoding its own string. Admin's own internal table
 * (UserRow.tsx) intentionally keeps its own shorter, admin-context wording
 * (e.g. "Pending (Approver)", which tells an admin *why* it's pending) —
 * that's a deliberate difference for a different, internal audience, not
 * drift to fix here. */
export const VERIFICATION_STATUS_LABEL: Record<string, string> = {
  confirmed: "Verified",
  pending: "Verification pending",
  unable_to_confirm: "Unable to confirm",
  not_yet_done: "Basic Verification not yet done",
};

/**
 * Bilingual job-type label, keyed by `jobType` then by the current `lang`.
 * The homepage originally had its own private copy of this map so its job
 * cards showed "पूर्णकालिक"/"अंशकालिक" in Hindi mode — every other page that
 * shows a job type (Find Jobs, a job's own detail page, a seeker's profile,
 * Find People) instead hardcoded the English words directly ("Full-time"
 * etc.) regardless of the site's language toggle, so a Hindi-reading visitor
 * still saw English there. One shared map, used everywhere a job type is
 * displayed, closes that gap and removes five duplicate copies of the same
 * three-entry table. */
export const JOB_TYPE_LABEL: Record<string, { hi: string; en: string }> = {
  full_time: { hi: "पूर्णकालिक", en: "Full-time" },
  part_time: { hi: "अंशकालिक", en: "Part-time" },
  wfh: { hi: "घर से काम", en: "Work From Home" },
};

export function jobTypeLabel(jobType: string, lang: "hi" | "en"): string {
  return JOB_TYPE_LABEL[jobType]?.[lang] ?? jobType;
}

/**
 * Bilingual "posted N days ago" style label for a job card — the mockup the
 * user shared showed a small time-posted badge on each listing, which this
 * app's job cards didn't have before. Kept simple (day-granularity, no
 * hours/minutes) since a job listing doesn't need finer precision than that,
 * and computed in whole days against IST so it lines up with the IST dates
 * shown elsewhere (formatDateIST) rather than drifting from the server's UTC
 * clock.
 */
export function postedAgoLabel(value: Date | string, lang: "hi" | "en"): string {
  const posted = new Date(value);
  const now = new Date();
  // Compare calendar dates in IST, not raw millisecond deltas, so a job
  // posted at 11:58pm IST reads "Today" a minute later rather than "1 day
  // ago" the instant midnight UTC ticks over.
  const toISTDateOnly = (d: Date) =>
    new Date(d.toLocaleDateString("en-US", { timeZone: IST_TIME_ZONE }));
  const days = Math.round(
    (toISTDateOnly(now).getTime() - toISTDateOnly(posted).getTime()) / 86400000
  );
  if (days <= 0) return lang === "hi" ? "आज" : "Today";
  if (days === 1) return lang === "hi" ? "कल" : "Yesterday";
  if (days < 30) return lang === "hi" ? `${days} दिन पहले` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return lang === "hi" ? `${months} महीने पहले` : `${months}mo ago`;
  const years = Math.floor(months / 12);
  return lang === "hi" ? `${years} साल पहले` : `${years}y ago`;
}
