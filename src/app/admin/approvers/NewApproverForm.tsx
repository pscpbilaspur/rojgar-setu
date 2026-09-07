"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createApproverAction } from "@/app/actions/admin";

export function NewApproverForm({ districts }: { districts: { id: number; district: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [districtId, setDistrictId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createApproverAction({ name, mobile, districtId: Number(districtId) });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setMobile("");
      setDistrictId("");
      router.refresh();
    });
  }

  const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)] text-sm";

  return (
    <div className="space-y-2">
      <input placeholder="Approver name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      <input placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} />
      <select value={districtId} onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
        <option value="">Select district</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>{d.district}</option>
        ))}
      </select>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !name || !mobile || !districtId}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        Assign Approver
      </button>
    </div>
  );
}
