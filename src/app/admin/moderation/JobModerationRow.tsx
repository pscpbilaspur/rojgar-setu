"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setJobModerationAction } from "@/app/actions/admin";

export function JobModerationRow({
  id,
  title,
  businessName,
  moderationState,
}: {
  id: number;
  title: string;
  businessName: string;
  moderationState: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(state: "approved" | "flagged" | "removed") {
    startTransition(async () => {
      await setJobModerationAction(id, state);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="py-2 px-2">{title}</td>
      <td className="py-2 px-2">{businessName}</td>
      <td className="py-2 px-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            moderationState === "approved"
              ? "bg-[var(--ok-soft)] text-[var(--ok)]"
              : moderationState === "flagged"
              ? "bg-[var(--warn-soft)] text-[var(--ink)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]"
          }`}
        >
          {moderationState}
        </span>
      </td>
      <td className="py-2 px-2 space-x-2">
        {moderationState !== "approved" && (
          <button type="button" disabled={isPending} onClick={() => set("approved")} className="text-xs underline">Approve</button>
        )}
        {moderationState !== "flagged" && (
          <button type="button" disabled={isPending} onClick={() => set("flagged")} className="text-xs underline">Flag</button>
        )}
        {moderationState !== "removed" && (
          <button type="button" disabled={isPending} onClick={() => set("removed")} className="text-xs underline text-[var(--danger)]">Remove</button>
        )}
      </td>
    </tr>
  );
}
