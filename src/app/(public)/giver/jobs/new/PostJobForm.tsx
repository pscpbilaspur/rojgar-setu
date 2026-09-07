"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postJobAction } from "@/app/actions/jobs";
import { ensureSkillAction } from "@/app/actions/lookups";

type Lookup = { id: number; label: string };

export function PostJobForm({
  districts,
  qualifications,
  initialSkills,
  defaultLocationId,
}: {
  districts: { id: number; district: string; isRemote: boolean }[];
  qualifications: Lookup[];
  initialSkills: Lookup[];
  defaultLocationId: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [qualificationId, setQualificationId] = useState<number | "">("");
  const [qualificationOther, setQualificationOther] = useState("");
  const [skillList, setSkillList] = useState(initialSkills);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [jobType, setJobType] = useState<"full_time" | "part_time" | "wfh">("full_time");
  const [locationId, setLocationId] = useState<number>(defaultLocationId);
  const [salaryRange, setSalaryRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

  function toggleSkill(id: number) {
    setSelectedSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    startTransition(async () => {
      const result = await postJobAction({
        title,
        description,
        qualificationId: qualificationId ? Number(qualificationId) : undefined,
        qualificationOther: qualificationOther || undefined,
        skillIds: selectedSkillIds,
        jobType,
        locationId,
        salaryRange: salaryRange || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/giver/jobs");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Job title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Minimum Required (optional)
        </label>
        <select value={qualificationId} onChange={(e) => setQualificationId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
          <option value="">No specific qualification required</option>
          {qualifications.map((q) => (
            <option key={q.id} value={q.id}>{q.label}</option>
          ))}
          <option value={-1}>Other</option>
        </select>
        {qualificationId === -1 && (
          <input
            placeholder="Specify"
            value={qualificationOther}
            onChange={(e) => setQualificationOther(e.target.value)}
            className={`${inputCls} mt-2`}
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Skills (optional)</label>
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
          <input placeholder="Add a skill" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} className={inputCls} />
          <button type="button" onClick={addCustomSkill} className="px-3 py-2 border border-[var(--border)] rounded-md text-sm">
            Add
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Job type</label>
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
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">District</label>
        <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className={inputCls}>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.isRemote ? "Anywhere / Remote" : d.district}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Salary range (optional)</label>
        <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className={inputCls} />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !title || !description}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
      >
        Post Job
      </button>
    </div>
  );
}
