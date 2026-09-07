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
      {OPTIONS.map(([val, label]) => (
        <label key={val} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="contactShare"
            checked={policy === val}
            onChange={() => save(val)}
          />
          {label}
        </label>
      ))}
      {isPending && <p className="text-xs text-[var(--ink-faint)]">Saving...</p>}
      {saved && !isPending && <p className="text-xs text-[var(--ok)]">Saved.</p>}
    </div>
  );
}
