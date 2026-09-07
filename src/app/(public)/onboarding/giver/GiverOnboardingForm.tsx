"use client";

import { useState, useTransition } from "react";
import { createGiverProfileAction } from "@/app/actions/giver";
import { getApproversForDistrictAction } from "@/app/actions/lookups";
import { JOB_CATEGORIES } from "@/db/seed-data/districts";

type Approver = { id: number; name: string };

export function GiverOnboardingForm({
  districts,
}: {
  districts: { id: number; district: string; isRemote: boolean }[];
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [businessName, setBusinessName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");

  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [approverId, setApproverId] = useState<number | "">("");
  const [approversLoading, setApproversLoading] = useState(false);

  const realDistricts = districts.filter((d) => !d.isRemote);

  async function goToStep2() {
    setError(null);
    if (!locationId) return;
    setStep(2);
    setApproversLoading(true);
    const list = await getApproversForDistrictAction(Number(locationId));
    setApprovers(list);
    setApproversLoading(false);
  }

  function submit() {
    setError(null);
    if (!approverId) {
      setError("Please select an Approver.");
      return;
    }
    startTransition(async () => {
      const result = await createGiverProfileAction({
        businessName,
        contactPersonName,
        category: category === "__other__" ? categoryOther : category,
        categoryOther: category === "__other__" ? categoryOther : undefined,
        locationId: Number(locationId),
        about: about || undefined,
        website: website || undefined,
        approverId: Number(approverId),
      });
      if (result && "error" in result) setError(result.error);
    });
  }

  const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

  if (step === 1) {
    return (
      <div className="space-y-3">
        <Field label="Business name" cls={inputCls}>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Contact person" cls={inputCls}>
          <input value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category" cls={inputCls}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            <option value="">Select category</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__other__">Other</option>
          </select>
        </Field>
        {category === "__other__" && (
          <input
            placeholder="Specify category"
            value={categoryOther}
            onChange={(e) => setCategoryOther(e.target.value)}
            className={inputCls}
          />
        )}
        <Field label="District" cls={inputCls}>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
            <option value="">Select district</option>
            {realDistricts.map((d) => (
              <option key={d.id} value={d.id}>{d.district}</option>
            ))}
          </select>
        </Field>
        <Field label="About the business (optional)" cls={inputCls}>
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} className={inputCls} rows={2} />
        </Field>
        <Field label="Website / social (optional)" cls={inputCls}>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
        </Field>
        <button
          type="button"
          onClick={goToStep2}
          disabled={!businessName || !contactPersonName || !category || !locationId}
          className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Select an Approver in your district" cls={inputCls}>
        {approversLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
        ) : approvers.length === 0 ? (
          <p className="text-sm text-[var(--warn)]">
            No Approver is assigned to your district yet. Please check back later or contact support.
          </p>
        ) : (
          <div className="space-y-2">
            {approvers.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => setApproverId(a.id)}
                className={`w-full text-left px-3 py-2 rounded-md border ${
                  approverId === a.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </Field>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border border-[var(--border)] rounded-md text-sm">
          Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !approverId}
          className="flex-1 bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode; cls: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-1">{label}</label>
      {children}
    </div>
  );
}
