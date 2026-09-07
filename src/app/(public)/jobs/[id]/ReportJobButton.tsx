"use client";

import { useState, useTransition } from "react";
import { createReportAction } from "@/app/actions/reports";

export function ReportJobButton({ jobId }: { jobId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return <p className="text-xs text-[var(--ink-faint)] mt-3">Report submitted. Thank you.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-[var(--ink-faint)] underline mt-3 block">
        Report this job
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong with this listing?"
        rows={2}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-[var(--surface)] text-[var(--ink)]"
      />
      <button
        type="button"
        disabled={isPending || !reason.trim()}
        onClick={() =>
          startTransition(async () => {
            await createReportAction("job", jobId, reason);
            setDone(true);
          })
        }
        className="text-xs bg-[var(--danger)] text-white rounded-md px-3 py-1.5 disabled:opacity-60"
      >
        Submit report
      </button>
    </div>
  );
}
