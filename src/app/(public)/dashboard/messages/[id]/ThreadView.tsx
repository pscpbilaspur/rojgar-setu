"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  respondToChatRequestAction,
  sendMessageAction,
  blockThreadAction,
} from "@/app/actions/chat";

type Message = { id: number; body: string; senderId: number; createdAt: string };

export function ThreadView({
  threadId,
  currentUserId,
  status,
  isInitiator,
  messages,
}: {
  threadId: number;
  currentUserId: number;
  status: string;
  isInitiator: boolean;
  messages: Message[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSend = status === "accepted" || (status === "pending" && !isInitiator);

  return (
    <div>
      <div className="space-y-2 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.senderId === currentUserId
                ? "ml-auto bg-[var(--accent)] text-white"
                : "bg-[var(--surface-2)] text-[var(--ink)]"
            }`}
          >
            {m.body}
          </div>
        ))}
      </div>

      {status === "pending" && !isInitiator && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await respondToChatRequestAction(threadId, true);
                router.refresh();
              })
            }
            className="bg-[var(--ok)] text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await respondToChatRequestAction(threadId, false);
                router.refresh();
              })
            }
            className="bg-[var(--surface-2)] text-[var(--ink)] rounded-md px-4 py-2 text-sm font-medium"
          >
            Decline
          </button>
        </div>
      )}

      {status === "pending" && isInitiator && (
        <p className="text-sm text-[var(--ink-faint)] mb-4">Waiting for them to accept your message request.</p>
      )}
      {status === "declined" && <p className="text-sm text-[var(--danger)] mb-4">This request was declined.</p>}
      {status === "blocked" && <p className="text-sm text-[var(--danger)] mb-4">This conversation is blocked.</p>}

      {canSend && (
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)] text-sm"
          />
          <button
            type="button"
            disabled={isPending || !body.trim()}
            onClick={() =>
              startTransition(async () => {
                await sendMessageAction(threadId, body);
                setBody("");
                router.refresh();
              })
            }
            className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Send
          </button>
        </div>
      )}

      {(status === "accepted" || status === "pending") && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await blockThreadAction(threadId);
              router.refresh();
            })
          }
          className="text-xs text-[var(--ink-faint)] underline mt-4 block"
        >
          Block this conversation
        </button>
      )}
    </div>
  );
}
