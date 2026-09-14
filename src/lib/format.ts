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
