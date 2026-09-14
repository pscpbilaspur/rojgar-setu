"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatusAction, setProfileVerificationAction } from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui";

// Colors come from the shared StatusBadge (ui.tsx) now — this only supplies
// the Admin-specific label text ("Pending (Approver)" reads clearer here
// than the plain "Pending" used elsewhere).
function verificationLabel(v: string | null) {
  if (v === "confirmed") return "Confirmed";
  if (v === "unable_to_confirm") return "Unable to confirm";
  if (v === "pending") return "Pending (Approver)";
  return "Not yet done";
}

/** A small solid action pill — the same visual weight as the Confirm/Reject
 * buttons on VerificationCard and Shortlist/Not-a-fit on ApplicantCard, just
 * sized for a compact table cell instead of a full-width card. Previously
 * this table's actions were plain underlined text, a lighter weight than
 * every other status-changing button in the app. */
function ActionPill({
  tone,
  disabled,
  onClick,
  children,
}: {
  tone: "ok" | "danger" | "muted";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneCls =
    tone === "ok"
      ? "bg-[var(--ok)] text-white"
      : tone === "danger"
      ? "bg-[var(--danger)] text-white"
      : "bg-[var(--surface-2)] text-[var(--ink)]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded-md font-medium disabled:opacity-60 ${toneCls}`}
    >
      {children}
    </button>
  );
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
    <div className="flex flex-col gap-1.5">
      <span>{name ?? "—"}</span>
      <div className="w-fit">
        <StatusBadge status={verification ?? "not_yet_done"} label={verificationLabel(verification)} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {verification !== "confirmed" && (
          <ActionPill tone="ok" disabled={isPending} onClick={() => act("confirmed")}>
            Approve
          </ActionPill>
        )}
        {verification !== "unable_to_confirm" && (
          <ActionPill tone="danger" disabled={isPending} onClick={() => act("unable_to_confirm")}>
            Reject
          </ActionPill>
        )}
        {verification !== "not_yet_done" && (
          <ActionPill tone="muted" disabled={isPending} onClick={() => act("not_yet_done")}>
            Reset
          </ActionPill>
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
        <StatusBadge status={status} />
      </td>
      <td className="py-2 px-2">
        <ActionPill
          tone={status === "active" ? "danger" : "ok"}
          disabled={isPending}
          onClick={() => startTransition(async () => { await toggleUserStatusAction(id); router.refresh(); })}
        >
          {status === "active" ? "Suspend" : "Reactivate"}
        </ActionPill>
      </td>
    </tr>
  );
}
