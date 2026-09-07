"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { chatThreads, chatParticipants, messages, users } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { notify } from "@/lib/notify";
import { findExistingThread, getThreadForParticipant, getDisplayName } from "@/lib/queries/chat";

/** Starts a message request to another user, or reuses an existing thread
 * between the two (Section 4.8: "First contact ... creates a message
 * request, not an open thread"). The first message is stored right away so
 * the recipient sees what the request is about when they open it. */
export async function startChatAction(otherUserId: number, firstMessage: string) {
  const current = await requireUser();
  if (current.user.id === otherUserId) throw new Error("You cannot message yourself.");
  if (!firstMessage.trim()) throw new Error("Write a message first.");

  const otherUser = await db.query.users.findFirst({ where: eq(users.id, otherUserId) });
  if (!otherUser) throw new Error("User not found.");

  const existingThreadId = await findExistingThread(current.user.id, otherUserId);
  let threadId = existingThreadId;

  if (!threadId) {
    const [thread] = await db
      .insert(chatThreads)
      .values({ initiatorId: current.user.id, status: "pending" })
      .returning();
    threadId = thread.id;
    await db.insert(chatParticipants).values([
      { threadId, userId: current.user.id },
      { threadId, userId: otherUserId },
    ]);
  }

  await db.insert(messages).values({ threadId, senderId: current.user.id, body: firstMessage.trim() });

  if (!existingThreadId) {
    const senderName = await getDisplayName(current.user.id);
    await notify(otherUserId, "new_message_request", `${senderName} sent you a message request.`);
  }

  redirect(`/dashboard/messages/${threadId}`);
}

export async function respondToChatRequestAction(threadId: number, accept: boolean) {
  const current = await requireUser();
  const thread = await getThreadForParticipant(threadId, current.user.id);
  if (!thread) throw new Error("Thread not found.");
  if (thread.isInitiator) throw new Error("Only the recipient can accept or decline a request.");
  if (thread.status !== "pending") throw new Error("This request has already been responded to.");

  await db
    .update(chatThreads)
    .set({ status: accept ? "accepted" : "declined" })
    .where(eq(chatThreads.id, threadId));

  if (accept && thread.otherUserId) {
    const recipientName = await getDisplayName(current.user.id);
    await notify(thread.otherUserId, "message_request_accepted", `${recipientName} accepted your message request.`);
  }

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${threadId}`);
}

export async function sendMessageAction(threadId: number, body: string) {
  const current = await requireUser();
  if (!body.trim()) throw new Error("Message cannot be empty.");

  const thread = await getThreadForParticipant(threadId, current.user.id);
  if (!thread) throw new Error("Thread not found.");
  if (thread.status === "blocked") throw new Error("This conversation is blocked.");
  if (thread.status === "declined") throw new Error("This request was declined.");
  if (thread.status === "pending" && thread.isInitiator) {
    throw new Error("Wait for the other person to accept your request before sending more messages.");
  }

  await db.insert(messages).values({ threadId, senderId: current.user.id, body: body.trim() });
  // A reply from the recipient to a still-pending thread implicitly accepts it.
  if (thread.status === "pending" && !thread.isInitiator) {
    await db.update(chatThreads).set({ status: "accepted" }).where(eq(chatThreads.id, threadId));
  }

  revalidatePath(`/dashboard/messages/${threadId}`);
}

/** Either participant can block at any point (Section 4.8) — locks the
 * thread for both sides. */
export async function blockThreadAction(threadId: number) {
  const current = await requireUser();
  const thread = await getThreadForParticipant(threadId, current.user.id);
  if (!thread) throw new Error("Thread not found.");

  await db.update(chatThreads).set({ status: "blocked" }).where(eq(chatThreads.id, threadId));
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${threadId}`);
}
