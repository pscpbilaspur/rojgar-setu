import "server-only";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotificationType =
  | "verification_confirmed"
  | "verification_unable_to_confirm"
  | "new_applicant"
  | "application_shortlisted"
  | "application_not_a_fit"
  | "new_message_request"
  | "message_request_accepted";

/** Best-effort: a notification failing to write should never break the
 * action that triggered it (Section 7 keeps the primary write authoritative). */
export async function notify(userId: number, type: NotificationType, body: string) {
  try {
    await db.insert(notifications).values({ userId, type, body });
  } catch {
    // best-effort only
  }
}
