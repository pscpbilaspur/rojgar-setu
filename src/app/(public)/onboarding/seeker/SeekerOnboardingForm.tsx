"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeekerProfileAction } from "@/app/actions/seeker";
import { getApproversForDistrictAction } from "@/app/actions/lookups";
import { Field, inputCls } from "@/components/ui";

type Lookup = { id: number; label?: string; district?: string; state?: string; isRemote?: boolean };
type Approver = { id: number; name: string };

export function SeekerOnboardingForm({
  districts,
  qualifications,
}: {
  districts: { id: number; district: string; state: string; isRemote: boolean }[];
  qualifications: Lookup[];
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Step 1
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [hometownDistrictId, setHometownDistrictId] = useState<number | "">("");

  // Step 2
  const [qualificationId, setQualificationId] = useState<number | "">("");
  const [qualificationOther, setQualificationOther] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  const [experience, setExperience] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");

  // Step 3
  const [jobType, setJobType] = useState<"full_time" | "part_time" | "wfh">("full_time");
  const [preferredLocationIds, setPreferredLocationIds] = useState<number[]>([]);

  // Step 4
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [approverId, setApproverId] = useState<number | "">("");
  const [approversLoading, setApproversLoading] = useState(false);
  const [contactSharePolicy, setContactSharePolicy] = useState<"never" | "on_application" | "always">(
    "on_application"
  );

  const realDistricts = useMemo(() => districts.filter((d) => !d.isRemote), [districts]);
  // State step (only Chhattisgarh exists today — see ACTIVE_DISTRICTS in
  // src/db/seed-data/districts.ts). Kept as a real, separate selection (not
  // folded into the district list) so adding a second state later is just
  // seed data, not a form rewrite.
  const states = useMemo(() => Array.from(new Set(realDistricts.map((d) => d.state))), [realDistricts]);
  const [hometownState, setHometownState] = useState(states[0] ?? "");
  const hometownDistrictOptions = useMemo(
    () => realDistricts.filter((d) => d.state === hometownState),
    [realDistricts, hometownState]
  );

  function toggleLocation(id: number) {
    setPreferredLocationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function goToStep4() {
    setError(null);
    if (!hometownDistrictId) return;
    setStep(4);
    setApproversLoading(true);
    const list = await getApproversForDistrictAction(Number(hometownDistrictId));
    setApprovers(list);
    setApproversLoading(false);
  }

  function submit() {
    setError(null);
    // Approver selection is always optional and skippable (Section 4.2) —
    // never a condition for creating the account. Skipped, or no Approver
    // exists in this district yet -> status just stays "not yet done".
    startTransition(async () => {
      const result = await createSeekerProfileAction({
        name,
        fatherName,
        hometownDistrictId: Number(hometownDistrictId),
        // -1 is the "Other" sentinel in the dropdown, not a real qualification
        // id — never send it as qualificationId (the server requires a
        // positive id); qualificationOther carries the actual free-text value.
        qualificationId: qualificationId && qualificationId !== -1 ? Number(qualificationId) : undefined,
        qualificationOther: qualificationOther || undefined,
        skillsText: skillsText || undefined,
        additionalNote: additionalNote || undefined,
        experience: experience || undefined,
        expectedSalary: expectedSalary || undefined,
        jobType,
        preferredLocationIds,
        approverId: approverId ? Number(approverId) : undefined,
        contactSharePolicy,
      });
      if (result && "error" in result) {
        setError(result.error);
      }
      // On success the action itself redirects.
    });
  }

  return (
    <div className="space-y-5">
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Father's name">
            <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="State">
            <select
              value={hometownState}
              onChange={(e) => {
                setHometownState(e.target.value);
                setHometownDistrictId("");
              }}
              className={inputCls}
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hometown district">
            <select
              value={hometownDistrictId}
              onChange={(e) => setHometownDistrictId(e.target.value ? Number(e.target.value) : "")}
              className={inputCls}
            >
              <option value="">Select district</option>
              {hometownDistrictOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.district}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-[var(--ink-faint)]">
            We only need your district — not your full address.
          </p>
          <NextButton
            disabled={!name || !fatherName || !hometownDistrictId}
            onClick={() => setStep(2)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Field label="Qualification">
            <select
              value={qualificationId}
              onChange={(e) => setQualificationId(e.target.value ? Number(e.target.value) : "")}
              className={inputCls}
            >
              <option value="">Select qualification</option>
              {qualifications.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
              <option value={-1}>Other</option>
            </select>
          </Field>
          {qualificationId === -1 && (
            <input
              placeholder="Specify qualification"
              value={qualificationOther}
              onChange={(e) => setQualificationOther(e.target.value)}
              className={inputCls}
            />
          )}
          <Field label="Your skills (optional)">
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              rows={2}
              placeholder="e.g. Driving, tailoring, computer basics, cooking..."
              className={inputCls}
            />
          </Field>
          <Field label="Experience">
            <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} rows={2} />
          </Field>
          <Field label="Anything else you'd like employers to know? (optional)">
            <textarea
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              rows={2}
              placeholder="Anything not covered above..."
              className={inputCls}
            />
          </Field>
          <Field label="Expected salary">
            <input value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex gap-2">
            <BackButton onClick={() => setStep(1)} />
            <NextButton onClick={() => setStep(3)} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field label="Job type">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as "full_time" | "part_time" | "wfh")}
              className={inputCls}
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="wfh">Work From Home</option>
            </select>
          </Field>
          <Field label="Preferred districts (select one or more)">
            <div className="flex flex-wrap gap-2">
              {districts.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => toggleLocation(d.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border ${
                    preferredLocationIds.includes(d.id)
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-ink)]"
                      : "border-[var(--border)] text-[var(--ink-muted)]"
                  }`}
                >
                  {d.isRemote ? "Anywhere / Remote" : d.district}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--ink-faint)] mt-1">
              No sub-district &quot;area&quot; option — district is the finest location detail.
            </p>
          </Field>
          <div className="flex gap-2">
            <BackButton onClick={() => setStep(2)} />
            <NextButton disabled={preferredLocationIds.length === 0} onClick={goToStep4} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <Field label="Select an Approver in your district">
            <p className="text-xs text-[var(--ink-muted)] mb-2">
              An Approver personally vouches for real people, to keep fake profiles off the platform — so pick
              someone here only if they'd actually recognize you or your work, like a known community member,
              local shopkeeper, or someone from your panchayat.
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
                  Only pick someone who personally knows you or your work. Optional — you can also do this later.
                </p>
              </>
            )}
          </Field>
          <Field label="Who can see your mobile number?">
            <select
              value={contactSharePolicy}
              onChange={(e) => setContactSharePolicy(e.target.value as "never" | "on_application" | "always")}
              className={inputCls}
            >
              <option value="never">Never share it</option>
              <option value="on_application">Only when I apply / am contacted</option>
              <option value="always">Always visible to registered users</option>
            </select>
            <p className="text-xs text-[var(--ink-faint)] mt-1">You can change this later in Privacy Settings.</p>
          </Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2">
            <BackButton onClick={() => setStep(3)} />
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
      )}
    </div>
  );
}

function NextButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
    >
      Next
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="px-4 py-2 border border-[var(--border)] rounded-md text-sm">
      Back
    </button>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
        />
      ))}
    </div>
  );
}
