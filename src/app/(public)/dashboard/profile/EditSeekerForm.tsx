"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSeekerProfileAction } from "@/app/actions/seeker";
import { Field, inputCls } from "@/components/ui";

type Lookup = { id: number; label: string };
type District = { id: number; district: string; isRemote: boolean };

export function EditSeekerForm({
  districts,
  qualifications,
  profile,
}: {
  districts: District[];
  qualifications: Lookup[];
  profile: {
    name: string;
    fatherName: string;
    hometownDistrictId: number;
    qualificationId: number | null;
    qualificationOther: string | null;
    experience: string | null;
    expectedSalary: string | null;
    jobType: "full_time" | "part_time" | "wfh";
    skillsText: string | null;
    additionalNote: string | null;
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
  const [skillsText, setSkillsText] = useState(profile.skillsText ?? "");
  const [additionalNote, setAdditionalNote] = useState(profile.additionalNote ?? "");
  const [experience, setExperience] = useState(profile.experience ?? "");
  const [expectedSalary, setExpectedSalary] = useState(profile.expectedSalary ?? "");
  const [jobType, setJobType] = useState(profile.jobType);
  const [preferredLocationIds, setPreferredLocationIds] = useState<number[]>(profile.preferredLocationIds);

  const realDistricts = useMemo(() => districts.filter((d) => !d.isRemote), [districts]);

  function toggleLocation(id: number) {
    setPreferredLocationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSeekerProfileAction({
        name,
        fatherName,
        hometownDistrictId,
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
        <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} rows={3} />
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
