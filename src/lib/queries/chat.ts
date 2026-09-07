import "server-only";
import { and, desc, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { chatThreads, chatParticipants, messages, users, jobSeekerProfiles, jobGiverProfiles } from "@/db/schema";

/** All threads a user participates in, with the other participant's display
 * name (their Job Seeker or Job Giver profile name if they have one, else
 * just their mobile), the latest message preview, and whether this user is
 * the one waiting on a pending request they did not start. */
export async function getThreadsForUser(userId: number) {
  const participantRows = await db
    .select({ threadId: chatParticipants.threadId })
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, userId));
  const threadIds = participantRows.map((r) => r.threadId);
  if (threadIds.length === 0) return [];

  const results = [];
  for (const threadId of threadIds) {
    const thread = await db.query.chatThreads.findFirst({ where: eq(chatThreads.id, threadId) });
    if (!thread) continue;

    const otherParticipant = await db
      .select({ userId: chatParticipants.userId })
      .from(chatParticipants)
      .where(and(eq(chatParticipants.threadId, threadId)));
    const otherUserId = otherParticipant.map((p) => p.userId).find((id) => id !== userId);
    if (!otherUserId) continue;

    const otherName = await getDisplayName(otherUserId);

    const [lastMessage] = await db
      .select({ body: messages.body, createdAt: messages.createdAt, senderId: messages.senderId })
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    results.push({
      threadId,
      status: thread.status,
      isInitiator: thread.initiatorId === userId,
      otherUserId,
      otherName,
      lastMessage: lastMessage?.body ?? null,
      lastMessageAt: lastMessage?.createdAt ?? thread.createdAt,
    });
  }

  return results.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}

export async function getDisplayName(userId: number): Promise<string> {
  const seeker = await db.query.jobSeekerProfiles.findFirst({ where: eq(jobSeekerProfiles.userId, userId) });
  if (seeker) return seeker.name;
  const giver = await db.query.jobGiverProfiles.findFirst({ where: eq(jobGiverProfiles.userId, userId) });
  if (giver) return giver.businessName;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user?.mobile ?? "Unknown";
}

export async function getThreadForParticipant(threadId: number, userId: number) {
  const participant = await db.query.chatParticipants.findFirst({
    where: and(eq(chatParticipants.threadId, threadId), eq(chatParticipants.userId, userId)),
  });
  if (!participant) return null; // ownership check — not a participant in this thread

  const thread = await db.query.chatThreads.findFirst({ where: eq(chatThreads.id, threadId) });
  if (!thread) return null;

  const otherParticipant = await db
    .select({ userId: chatParticipants.userId })
    .from(chatParticipants)
    .where(eq(chatParticipants.threadId, threadId));
  const otherUserId = otherParticipant.map((p) => p.userId).find((id) => id !== userId) ?? null;
  const otherName = otherUserId ? await getDisplayName(otherUserId) : "Unknown";

  const threadMessages = await db
    .select({ id: messages.id, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  return {
    id: thread.id,
    status: thread.status,
    isInitiator: thread.initiatorId === userId,
    otherUserId,
    otherName,
    messages: threadMessages,
  };
}

/** Finds an existing thread between these two users (in either direction),
 * regardless of who started it — used to avoid creating duplicate threads. */
export async function findExistingThread(userIdA: number, userIdB: number) {
  const rowsA = await db
    .select({ threadId: chatParticipants.threadId })
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, userIdA));
  const rowsB = await db
    .select({ threadId: chatParticipants.threadId })
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, userIdB));
  const setB = new Set(rowsB.map((r) => r.threadId));
  const common = rowsA.map((r) => r.threadId).find((id) => setB.has(id));
  return common ?? null;
}
