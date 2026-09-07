"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/dal";

export async function markAllNotificationsReadAction() {
  const current = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.userId, current.user.id));
  revalidatePath("/dashboard/notifications");
}
