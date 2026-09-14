"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { decideApplicationAction } from "@/app/actions/jobs";
import type { ApplicantRow } from "@/lib/queries/applicants";
import { StatusBadge } from "@/components/ui";
import { VERIFICATION_STATUS_LABEL } from "@/lib/format";

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
          <Link href={`/people/${applicant.seekerId}`} className="font-semibold text-[var(--ink)] underline">
            {applicant.seekerName}
          </Link>
          <p className="text-sm text-[var(--ink-muted)]">
            {applicant.mobile ? `Mobile: ${applicant.mobile}` : "Mobile number not shared"}
          </p>
          <p className="text-xs text-[var(--ink-faint)] mt-1">
            Expected salary: {applicant.expectedSalary ?? "-"} ·{" "}
            {VERIFICATION_STATUS_LABEL[applicant.verificationStatus] ?? applicant.verificationStatus}
          </p>
          <Link href={`/people/${applicant.seekerId}`} className="text-xs underline text-[var(--accent-ink)] inline-block mt-1">
            View full profile
          </Link>
        </div>
        <StatusBadge
          status={status}
          label={status === "sent" ? "New" : status === "shortlisted" ? "Shortlisted" : "Not a fit"}
        />
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
