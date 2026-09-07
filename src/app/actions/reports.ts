"use server";

import { db } from "@/db";
import { reports, suggestions } from "@/db/schema";
import { getCurrentUser } from "@/lib/dal";

export async function createReportAction(targetType: string, targetId: number, reason: string) {
  const current = await getCurrentUser();
  if (!current) throw new Error("Must be logged in to report.");
  if (!reason.trim()) throw new Error("Please describe the issue.");

  await db.insert(reports).values({
    reporterId: current.user.id,
    targetType,
    targetId,
    reason: reason.trim(),
  });
}

export async function createSuggestionAction(body: string) {
  const current = await getCurrentUser();
  if (!body.trim()) throw new Error("Please write a suggestion.");

  await db.insert(suggestions).values({
    userId: current?.user.id,
    body: body.trim(),
  });
}
