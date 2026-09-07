"use client";

import { useState, useTransition } from "react";
import { startChatAction } from "@/app/actions/chat";

export function MessageButton({ otherUserId }: { otherUserId: number }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm bg-[var(--accent)] text-white rounded-md px-4 py-2 font-medium"
      >
        💬 Message
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
        rows={3}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-[var(--surface)] text-[var(--ink)]"
      />
      <button
        type="button"
        disabled={isPending || !body.trim()}
        onClick={() => startTransition(() => startChatAction(otherUserId, body))}
        className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        Send request
      </button>
    </div>
  );
}
