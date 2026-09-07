"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleApproverStatusAction } from "@/app/actions/admin";

export function ApproverRow({ id, name, mobile, district, status }: { id: number; name: string; mobile: string; district: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="py-2 px-2">{name}</td>
      <td className="py-2 px-2">{mobile}</td>
      <td className="py-2 px-2">{district}</td>
      <td className="py-2 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--surface-2)] text-[var(--ink-muted)]"}`}>
          {status}
        </span>
      </td>
      <td className="py-2 px-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await toggleApproverStatusAction(id); router.refresh(); })}
          className="text-xs underline text-[var(--ink-muted)]"
        >
          {status === "active" ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  );
}
