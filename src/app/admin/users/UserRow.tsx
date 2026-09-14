"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatusAction, setProfileVerificationAction } from "@/app/actions/admin";

function verificationBadgeCls(v: string | null) {
  if (v === "confirmed") return "bg-[var(--ok-soft)] text-[var(--ok)]";
  if (v === "unable_to_confirm") return "bg-[var(--danger-soft)] text-[var(--danger)]";
  if (v === "pending") return "bg-[var(--warn-soft,#fef3c7)] text-[var(--warn,#92400e)]";
  return "bg-[var(--surface-muted,#f1f1f1)] text-[var(--ink-muted)]";
}

function verificationLabel(v: string | null) {
  if (v === "confirmed") return "Confirmed";
  if (v === "unable_to_confirm") return "Unable to confirm";
  if (v === "pending") return "Pending (Approver)";
  return "Not yet done";
}

function ProfileVerification({
  profileType,
  profileId,
  verification,
  name,
}: {
  profileType: "seeker" | "giver";
  profileId: number | null;
  verification: string | null;
  name: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!profileId) return <span className="text-[var(--ink-faint)]">—</span>;

  function act(status: "confirmed" | "unable_to_confirm" | "not_yet_done") {
    startTransition(async () => {
      await setProfileVerificationAction(profileType, profileId!, status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span>{name ?? "—"}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${verificationBadgeCls(verification)}`}>
        {verificationLabel(verification)}
      </span>
      <div className="flex gap-2">
        {verification !== "confirmed" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => act("confirmed")}
            className="text-xs underline text-[var(--ok)]"
          >
            Approve
          </button>
        )}
        {verification !== "unable_to_confirm" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => act("unable_to_confirm")}
            className="text-xs underline text-[var(--danger)]"
          >
            Reject
          </button>
        )}
        {verification !== "not_yet_done" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => act("not_yet_done")}
            className="text-xs underline text-[var(--ink-muted)]"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export function UserRow({
  id,
  mobile,
  status,
  seekerId,
  seekerName,
  seekerVerification,
  giverId,
  giverName,
  giverVerification,
}: {
  id: number;
  mobile: string;
  status: string;
  seekerId: number | null;
  seekerName: string | null;
  seekerVerification: string | null;
  giverId: number | null;
  giverName: string | null;
  giverVerification: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-[var(--border)] align-top">
      <td className="py-2 px-2">{mobile}</td>
      <td className="py-2 px-2">
        <ProfileVerification profileType="seeker" profileId={seekerId} verification={seekerVerification} name={seekerName} />
      </td>
      <td className="py-2 px-2">
        <ProfileVerification profileType="giver" profileId={giverId} verification={giverVerification} name={giverName} />
      </td>
      <td className="py-2 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
          {status}
        </span>
      </td>
      <td className="py-2 px-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await toggleUserStatusAction(id); router.refresh(); })}
          className="text-xs underline text-[var(--ink-muted)]"
        >
          {status === "active" ? "Suspend" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
