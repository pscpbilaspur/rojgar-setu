"use client";

import { useMemo, useState, useTransition } from "react";
import { createSeekerProfileAction } from "@/app/actions/seeker";
import { ensureSkillAction, getApproversForDistrictAction } from "@/app/actions/lookups";

type Lookup = { id: number; label?: string; district?: string; state?: string; isRemote?: boolean };
type Approver = { id: number; name: string };

export function SeekerOnboardingForm({
  districts,
  qualifications,
  initialSkills,
}: {
  districts: { id: number; district: string; isRemote: boolean }[];
  qualifications: Lookup[];
  initialSkills: Lookup[];
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
  const [skillList, setSkillList] = useState(initialSkills);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [customSkill, setCustomSkill] = useState("");
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

  function toggleSkill(id: number) {
    setSelectedSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleLocation(id: number) {
    setPreferredLocationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function addCustomSkill() {
    const label = customSkill.trim();
    if (!label) return;
    const created = await ensureSkillAction(label);
    if (created && !skillList.some((s) => s.id === created.id)) {
      setSkillList((prev) => [...prev, created]);
      setSelectedSkillIds((prev) => [...prev, created.id]);
    }
    setCustomSkill("");
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
    if (!approverId) {
      setError("Please select an Approver.");
      return;
    }
    startTransition(async () => {
      const result = await createSeekerProfileAction({
        name,
        fatherName,
        hometownDistrictId: Number(hometownDistrictId),
        qualificationId: qualificationId ? Number(qualificationId) : undefined,
        qualificationOther: qualificationOther || undefined,
        skillIds: selectedSkillIds,
        experience: experience || undefined,
        expectedSalary: expectedSalary || undefined,
        jobType,
        preferredLocationIds,
        approverId: Number(approverId),
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
          <Field label="Hometown district">
            <select
              value={hometownDistrictId}
              onChange={(e) => setHometownDistrictId(e.target.value ? Number(e.target.value) : "")}
              className={inputCls}
            >
              <option value="">Select district</option>
              {realDistricts.map((d) => (
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
          <Field label="Skills">
            <div className="flex flex-wrap gap-2">
              {skillList.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border ${
                    selectedSkillIds.includes(s.id)
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-ink)]"
                      : "border-[var(--border)] text-[var(--ink-muted)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                placeholder="Add your own skill"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                className={inputCls}
              />
              <button type="button" onClick={addCustomSkill} className="px-3 py-2 border border-[var(--border)] rounded-md text-sm">
                Add
              </button>
            </div>
          </Field>
          <Field label="Experience">
            <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} rows={2} />
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
            <div className="flex gap-2 flex-wrap">
              {(["full_time", "part_time", "wfh"] as const).map((jt) => (
                <button
                  key={jt}
                  type="button"
                  onClick={() => setJobType(jt)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    jobType === jt ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-ink)]" : "border-[var(--border)]"
                  }`}
                >
                  {jt === "full_time" ? "Full-time" : jt === "part_time" ? "Part-time" : "Work From Home"}
                </button>
              ))}
            </div>
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
            <p className="text-xs text-[var(--ink-faint)] mt-1">
              Pick someone who personally knows you or your work.
            </p>
          </Field>
          <Field label="Who can see your mobile number?">
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["never", "Never share it"],
                  ["on_application", "Only when I apply / am contacted"],
                  ["always", "Always visible to registered users"],
                ] as const
              ).map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contactShare"
                    checked={contactSharePolicy === val}
                    onChange={() => setContactSharePolicy(val)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--ink-faint)] mt-1">You can change this later in Privacy Settings.</p>
          </Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2">
            <BackButton onClick={() => setStep(3)} />
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
      )}
    </div>
  );
}

const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-1">{label}</label>
      {children}
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
