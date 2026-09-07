"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReportStatusAction } from "@/app/actions/admin";

export function ReportRow({
  id,
  targetType,
  targetId,
  reason,
  status,
  reporterMobile,
  createdAt,
}: {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  status: string;
  reporterMobile: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(next: "reviewed" | "dismissed") {
    startTransition(async () => {
      await setReportStatusAction(id, next);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-[var(--border)] align-top">
      <td className="py-2 px-2">
        {targetType} #{targetId}
      </td>
      <td className="py-2 px-2 max-w-xs">{reason}</td>
      <td className="py-2 px-2">{reporterMobile}</td>
      <td className="py-2 px-2 text-[var(--ink-faint)]">{new Date(createdAt).toLocaleDateString("en-IN")}</td>
      <td className="py-2 px-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            status === "open"
              ? "bg-[var(--warn-soft)] text-[var(--ink)]"
              : status === "reviewed"
              ? "bg-[var(--ok-soft)] text-[var(--ok)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]"
          }`}
        >
          {status}
        </span>
      </td>
      <td className="py-2 px-2 space-x-2">
        {status !== "reviewed" && (
          <button type="button" disabled={isPending} onClick={() => set("reviewed")} className="text-xs underline">
            Mark reviewed
          </button>
        )}
        {status !== "dismissed" && (
          <button type="button" disabled={isPending} onClick={() => set("dismissed")} className="text-xs underline text-[var(--ink-muted)]">
            Dismiss
          </button>
        )}
      </td>
    </tr>
  );
}
