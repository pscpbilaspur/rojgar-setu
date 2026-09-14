"use client";

import { useMemo, useState, useTransition } from "react";
import { createGiverProfileAction } from "@/app/actions/giver";
import { getApproversForDistrictAction } from "@/app/actions/lookups";
import { JOB_CATEGORIES } from "@/db/seed-data/districts";
import { Field, inputCls } from "@/components/ui";

type Approver = { id: number; name: string };

export function GiverOnboardingForm({
  districts,
}: {
  districts: { id: number; district: string; state: string; isRemote: boolean }[];
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
  const states = useMemo(() => Array.from(new Set(realDistricts.map((d) => d.state))), [realDistricts]);
  const [locationState, setLocationState] = useState(states[0] ?? "");
  const locationDistrictOptions = useMemo(
    () => realDistricts.filter((d) => d.state === locationState),
    [realDistricts, locationState]
  );

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
    // Approver selection is always optional and skippable (Section 4.2) —
    // never a condition for creating the account. Skipped, or no Approver
    // exists in this district yet -> status just stays "not yet done".
    startTransition(async () => {
      const result = await createGiverProfileAction({
        businessName,
        contactPersonName,
        category: category === "__other__" ? categoryOther : category,
        categoryOther: category === "__other__" ? categoryOther : undefined,
        locationId: Number(locationId),
        about: about || undefined,
        website: website || undefined,
        approverId: approverId ? Number(approverId) : undefined,
      });
      if (result && "error" in result) setError(result.error);
    });
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <Field label="Business name">
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Contact person">
          <input value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category">
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
        <Field label="State">
          <select
            value={locationState}
            onChange={(e) => {
              setLocationState(e.target.value);
              setLocationId("");
            }}
            className={inputCls}
          >
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="District">
          <select value={locationId} onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
            <option value="">Select district</option>
            {locationDistrictOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.district}</option>
            ))}
          </select>
        </Field>
        <Field label="About the business (optional)">
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} className={inputCls} rows={2} />
        </Field>
        <Field label="Website / social (optional)">
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
      <Field label="Select an Approver in your district">
        <p className="text-xs text-[var(--ink-muted)] mb-2">
          An Approver personally vouches for real businesses, to keep fake profiles off the platform — so pick
          someone here only if they'd actually recognize you or your business, like a known community member,
          nearby shopkeeper, or someone from your panchayat.
        </p>
        {approversLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
        ) : approvers.length === 0 ? (
          <p className="text-sm text-[var(--warn)]">
            No Approver is assigned to your district yet. You can continue without one — your Basic Verification will simply stay &quot;not yet done&quot; until an Approver is available.
          </p>
        ) : (
          <>
            <select
              value={approverId}
              onChange={(e) => setApproverId(e.target.value ? Number(e.target.value) : "")}
              className={inputCls}
            >
              <option value="">Skip for now</option>
              {approvers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--ink-faint)] mt-1">
              Only pick someone who personally knows you or your business. Optional — you can also do this later.
            </p>
          </>
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
          disabled={isPending}
          className="flex-1 bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
