"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSeekerProfileAction } from "@/app/actions/seeker";
import { ensureSkillAction } from "@/app/actions/lookups";

type Lookup = { id: number; label: string };
type District = { id: number; district: string; isRemote: boolean };

export function EditSeekerForm({
  districts,
  qualifications,
  initialSkills,
  profile,
}: {
  districts: District[];
  qualifications: Lookup[];
  initialSkills: Lookup[];
  profile: {
    name: string;
    fatherName: string;
    hometownDistrictId: number;
    qualificationId: number | null;
    qualificationOther: string | null;
    experience: string | null;
    expectedSalary: string | null;
    jobType: "full_time" | "part_time" | "wfh";
    skillIds: number[];
    preferredLocationIds: number[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(profile.name);
  const [fatherName, setFatherName] = useState(profile.fatherName);
  const [hometownDistrictId, setHometownDistrictId] = useState(profile.hometownDistrictId);
  const [qualificationId, setQualificationId] = useState<number | "">(profile.qualificationId ?? "");
  const [qualificationOther, setQualificationOther] = useState(profile.qualificationOther ?? "");
  const [skillList, setSkillList] = useState(initialSkills);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(profile.skillIds);
  const [customSkill, setCustomSkill] = useState("");
  const [experience, setExperience] = useState(profile.experience ?? "");
  const [expectedSalary, setExpectedSalary] = useState(profile.expectedSalary ?? "");
  const [jobType, setJobType] = useState(profile.jobType);
  const [preferredLocationIds, setPreferredLocationIds] = useState<number[]>(profile.preferredLocationIds);

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

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSeekerProfileAction({
        name,
        fatherName,
        hometownDistrictId,
        qualificationId: qualificationId ? Number(qualificationId) : undefined,
        qualificationOther: qualificationOther || undefined,
        skillIds: selectedSkillIds,
        experience: experience || undefined,
        expectedSalary: expectedSalary || undefined,
        jobType,
        preferredLocationIds,
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Full name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Father's name">
        <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Hometown district">
        <select
          value={hometownDistrictId}
          onChange={(e) => setHometownDistrictId(Number(e.target.value))}
          className={inputCls}
        >
          {realDistricts.map((d) => (
            <option key={d.id} value={d.id}>{d.district}</option>
          ))}
        </select>
      </Field>
      <Field label="Qualification">
        <select
          value={qualificationId}
          onChange={(e) => setQualificationId(e.target.value ? Number(e.target.value) : "")}
          className={inputCls}
        >
          <option value="">Select qualification</option>
          {qualifications.map((q) => (
            <option key={q.id} value={q.id}>{q.label}</option>
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
        <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} rows={3} />
      </Field>
      <Field label="Expected salary">
        <input value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} className={inputCls} />
      </Field>
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
      <Field label="Preferred districts">
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
      </Field>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {saved && <p className="text-sm text-[var(--ok)]">Saved.</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !name || !fatherName || preferredLocationIds.length === 0}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
      >
        Save changes
      </button>
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
