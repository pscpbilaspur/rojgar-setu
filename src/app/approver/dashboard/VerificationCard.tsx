"use client";

import { useState, useTransition } from "react";
import { confirmVerificationAction, markUnableToConfirmAction } from "@/app/actions/approver";
import type { VerificationQueueItem } from "@/lib/queries/verification";

export function VerificationCard({ item }: { item: VerificationQueueItem }) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<null | "confirmed" | "unable_to_confirm">(null);

  function decide(decision: "confirmed" | "unable_to_confirm") {
    startTransition(async () => {
      if (decision === "confirmed") await confirmVerificationAction(item.requestId, note);
      else await markUnableToConfirmAction(item.requestId, note);
      setDone(decision);
    });
  }

  if (done) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 opacity-60">
        <p className="text-sm">
          {item.displayName} — marked{" "}
          <strong>{done === "confirmed" ? "Confirmed" : "Unable to Confirm"}</strong>
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{item.displayName}</h3>
          <p className="text-sm text-[var(--ink-muted)]">
            {item.profileType === "seeker" ? "Father's name" : "Contact person"}: {item.secondaryName}
          </p>
          <p className="text-sm text-[var(--ink-muted)]">Mobile: {item.mobile}</p>
          <p className="text-xs text-[var(--ink-faint)] mt-0.5">
            {item.district} · {item.profileType === "seeker" ? "Job Seeker" : "Job Giver"}
          </p>
        </div>
      </div>
      <textarea
        placeholder="Internal note (not shown to the user)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 mt-3 text-sm bg-[var(--surface)] text-[var(--ink)]"
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("confirmed")}
          className="flex-1 bg-[var(--ok)] text-white rounded-md py-1.5 text-sm font-medium disabled:opacity-60"
        >
          Confirm
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("unable_to_confirm")}
          className="flex-1 bg-[var(--danger)] text-white rounded-md py-1.5 text-sm font-medium disabled:opacity-60"
        >
          Unable to Confirm
        </button>
      </div>
    </div>
  );
}
