"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatusAction } from "@/app/actions/admin";

export function UserRow({
  id,
  mobile,
  status,
  seekerName,
  giverName,
}: {
  id: number;
  mobile: string;
  status: string;
  seekerName: string | null;
  giverName: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="py-2 px-2">{mobile}</td>
      <td className="py-2 px-2">{seekerName ?? "—"}</td>
      <td className="py-2 px-2">{giverName ?? "—"}</td>
      <td className="py-2 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
          {status}
        </span>
      </td>
      <td className="py-2 px-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await toggleUserStatusAction(id); router.refresh(); })}
          className="text-xs underline text-[var(--ink-muted)]"
        >
          {status === "active" ? "Suspend" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
