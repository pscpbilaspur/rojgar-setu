"use client";

import { useState, useTransition } from "react";
import { applyToJobAction } from "@/app/actions/jobs";

export function ApplyButton({ jobId }: { jobId: number }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "applied" | "error">("idle");
  const [error, setError] = useState("");

  function apply() {
    startTransition(async () => {
      const result = await applyToJobAction(jobId);
      if ("error" in result) {
        setError(result.error);
        setState("error");
      } else {
        setState("applied");
      }
    });
  }

  if (state === "applied") {
    return <p className="text-[var(--ok)] font-medium">Application sent.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={apply}
        disabled={isPending}
        className="bg-[var(--accent)] text-white rounded-md px-5 py-2 font-medium disabled:opacity-60"
      >
        Apply
      </button>
      {state === "error" && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
    </div>
  );
}
