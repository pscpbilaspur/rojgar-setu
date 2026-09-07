"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminPasswordAction,
  adminEnrollTotpAction,
  adminVerifyTotpAction,
} from "@/app/actions/admin-auth";

type Stage =
  | { kind: "password" }
  | { kind: "enroll"; username: string; secret: string; qrDataUri: string }
  | { kind: "totp"; username: string };

export function AdminLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "password" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitPassword() {
    setError(null);
    startTransition(async () => {
      const result = await adminPasswordAction(username, password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.stage === "enroll") {
        setStage({ kind: "enroll", username: result.username, secret: result.secret, qrDataUri: result.qrDataUri });
      } else {
        setStage({ kind: "totp", username: result.username });
      }
    });
  }

  function submitTotp() {
    setError(null);
    startTransition(async () => {
      const result =
        stage.kind === "enroll"
          ? await adminEnrollTotpAction(stage.username, stage.secret, code)
          : stage.kind === "totp"
          ? await adminVerifyTotpAction(stage.username, code)
          : null;
      if (!result) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    });
  }

  if (stage.kind === "password") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]"
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && submitPassword()}
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="button"
          onClick={submitPassword}
          disabled={isPending || !username || !password}
          className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    );
  }

  if (stage.kind === "enroll") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">
          First login — set up two-factor authentication. Scan this QR code with
          an authenticator app (Google Authenticator, Authy, etc.), then enter
          the 6-digit code it shows.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stage.qrDataUri} alt="TOTP QR code" className="mx-auto" />
        <p className="text-xs text-center text-[var(--ink-faint)] break-all">
          Manual key: {stage.secret}
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-center tracking-[0.4em] text-lg bg-[var(--surface)] text-[var(--ink)]"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="button"
          onClick={submitTotp}
          disabled={isPending || code.length !== 6}
          className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Confirm & finish setup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[var(--ink)] mb-1">
        Authenticator code
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-center tracking-[0.4em] text-lg bg-[var(--surface)] text-[var(--ink)]"
      />
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submitTotp}
        disabled={isPending || code.length !== 6}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
      >
        Log in
      </button>
    </div>
  );
}
