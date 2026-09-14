"use client";

import { useState, useTransition } from "react";
import { updateContactSharePolicyAction } from "@/app/actions/privacy";

const OPTIONS = [
  ["never", "Never share it"],
  ["on_application", "Only when I apply / am contacted"],
  ["always", "Always visible to registered users"],
] as const;

export function PrivacyForm({ initialPolicy }: { initialPolicy: "never" | "on_application" | "always" }) {
  const [policy, setPolicy] = useState(initialPolicy);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(next: typeof policy) {
    setPolicy(next);
    setSaved(false);
    startTransition(async () => {
      await updateContactSharePolicyAction(next);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-2">
      <select
        value={policy}
        onChange={(e) => save(e.target.value as typeof policy)}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)] text-sm"
      >
        {OPTIONS.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      {isPending && <p className="text-xs text-[var(--ink-faint)]">Saving...</p>}
      {saved && !isPending && <p className="text-xs text-[var(--ok)]">Saved ✓</p>}
    </div>
  );
}
