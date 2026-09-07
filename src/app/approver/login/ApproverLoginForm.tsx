"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestApproverOtpAction, verifyApproverOtpAction } from "@/app/actions/approver-auth";

export function ApproverLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [requestState, requestAction, requestPending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const m = String(formData.get("mobile") ?? "");
      setMobile(m);
      const result = await requestApproverOtpAction(_prev, formData);
      if (!result?.error) setStage("otp");
      return result;
    },
    undefined
  );

  function handleVerify() {
    setVerifyError(null);
    startTransition(async () => {
      const result = await verifyApproverOtpAction(mobile, code);
      if ("error" in result) {
        setVerifyError(result.error);
        return;
      }
      router.push("/approver/dashboard");
      router.refresh();
    });
  }

  if (stage === "mobile") {
    return (
      <form action={requestAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">Mobile number</label>
          <input
            name="mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            required
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]"
          />
        </div>
        {requestState?.error && <p className="text-sm text-[var(--danger)]">{requestState.error}</p>}
        <button
          type="submit"
          disabled={requestPending}
          className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Send OTP
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">{mobile}</p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 tracking-[0.4em] text-center text-lg bg-[var(--surface)] text-[var(--ink)]"
      />
      {verifyError && <p className="text-sm text-[var(--danger)]">{verifyError}</p>}
      <button
        type="button"
        onClick={handleVerify}
        disabled={isPending || code.length !== 6}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
      >
        Verify
      </button>
    </div>
  );
}
