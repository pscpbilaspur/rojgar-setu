"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importSeekersAction, type ImportResult } from "@/app/actions/admin-import";
import { inputCls } from "@/components/ui";

type District = { id: number; district: string };
type Approver = { id: number; name: string; districtId: number };

export function ImportSeekersForm({
  districts,
  approvers,
}: {
  districts: District[];
  approvers: Approver[];
}) {
  const router = useRouter();
  const [districtId, setDistrictId] = useState<number | "">("");
  const [approverId, setApproverId] = useState<number | "">("");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  const filteredApprovers = districtId ? approvers.filter((a) => a.districtId === districtId) : approvers;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file, "utf-8");
  }

  async function submit() {
    setError(null);
    setResult(null);
    if (!districtId || !approverId) {
      setError("Select a district and an Approver first.");
      return;
    }
    if (!csvText.trim()) {
      setError("Choose a CSV file first.");
      return;
    }
    setIsPending(true);
    try {
      const res = await importSeekersAction(csvText, Number(districtId), Number(approverId));
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res);
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          District (applies to every row in this file)
        </label>
        <select
          value={districtId}
          onChange={(e) => {
            setDistrictId(e.target.value ? Number(e.target.value) : "");
            setApproverId("");
          }}
          className={inputCls}
        >
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.district}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Approver (applies to every row in this file)
        </label>
        <select
          value={approverId}
          onChange={(e) => setApproverId(e.target.value ? Number(e.target.value) : "")}
          className={inputCls}
          disabled={!districtId}
        >
          <option value="">{districtId ? "Select Approver" : "Select a district first"}</option>
          {filteredApprovers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {districtId && filteredApprovers.length === 0 && (
          <p className="text-xs text-[var(--warn)] mt-1">
            No active Approver for this district yet — assign one first on the Approvers page.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">CSV file</label>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className={inputCls} />
        {fileName && <p className="text-xs text-[var(--ink-muted)] mt-1">Selected: {fileName}</p>}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={isPending || !csvText || !districtId || !approverId}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? "Importing…" : "Import Job Seekers"}
      </button>

      {result && "success" in result && (
        <div className="mt-4 border border-[var(--border)] rounded-md p-3 text-sm">
          <p className="font-semibold text-[var(--ink)] mb-2">
            {result.created} created, {result.skipped} skipped (of {result.results.length} rows)
          </p>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {result.results.map((r) => (
              <div
                key={r.row}
                className={r.status === "created" ? "text-[var(--ok)]" : "text-[var(--ink-muted)]"}
              >
                Row {r.row} — {r.name}: {r.status === "created" ? "✓ created" : `skipped (${r.reason})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
