"use client";

import { useState, useTransition } from "react";
import { decideApplicationAction } from "@/app/actions/jobs";
import type { ApplicantRow } from "@/lib/queries/applicants";

export function ApplicantCard({ applicant }: { applicant: ApplicantRow }) {
  const [status, setStatus] = useState(applicant.status);
  const [isPending, startTransition] = useTransition();

  function decide(decision: "shortlisted" | "not_a_fit") {
    startTransition(async () => {
      await decideApplicationAction(applicant.applicationId, decision);
      setStatus(decision);
    });
  }

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{applicant.seekerName}</h3>
          <p className="text-sm text-[var(--ink-muted)]">Father&apos;s name: {applicant.fatherName}</p>
          <p className="text-sm text-[var(--ink-muted)]">
            {applicant.mobile ? `Mobile: ${applicant.mobile}` : "Mobile: not shared by user"}
          </p>
          <p className="text-xs text-[var(--ink-faint)] mt-1">
            Expected salary: {applicant.expectedSalary ?? "-"} · Verification: {applicant.verificationStatus}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === "shortlisted"
              ? "bg-[var(--ok-soft)] text-[var(--ok)]"
              : status === "not_a_fit"
              ? "bg-[var(--danger-soft)] text-[var(--danger)]"
              : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
          }`}
        >
          {status === "sent" ? "New" : status === "shortlisted" ? "Shortlisted" : "Not a fit"}
        </span>
      </div>
      {status === "sent" && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide("shortlisted")}
            className="flex-1 bg-[var(--ok)] text-white rounded-md py-1.5 text-sm font-medium disabled:opacity-60"
          >
            Shortlist
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide("not_a_fit")}
            className="flex-1 bg-[var(--surface-2)] text-[var(--ink)] rounded-md py-1.5 text-sm font-medium disabled:opacity-60"
          >
            Not a fit
          </button>
        </div>
      )}
    </div>
  );
}
