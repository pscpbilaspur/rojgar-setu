"use client";

import { useState, useTransition } from "react";
import { createSuggestionAction } from "@/app/actions/reports";

export function SuggestForm({ strings }: { strings: { placeholder: string; submit: string; thanks: string } }) {
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return <p className="text-[var(--ok)] font-medium">{strings.thanks}</p>;
  }

  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={strings.placeholder}
        rows={5}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]"
      />
      <button
        type="button"
        disabled={isPending || !body.trim()}
        onClick={() =>
          startTransition(async () => {
            await createSuggestionAction(body);
            setDone(true);
          })
        }
        className="bg-[var(--accent)] text-white rounded-md px-5 py-2 font-medium disabled:opacity-60"
      >
        {strings.submit}
      </button>
    </div>
  );
}
