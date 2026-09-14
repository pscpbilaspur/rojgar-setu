"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postJobAction } from "@/app/actions/jobs";

type Lookup = { id: number; label: string };

export function PostJobForm({
  districts,
  qualifications,
  defaultLocationId,
}: {
  districts: { id: number; district: string; isRemote: boolean }[];
  qualifications: Lookup[];
  defaultLocationId: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [qualificationId, setQualificationId] = useState<number | "">("");
  const [qualificationOther, setQualificationOther] = useState("");
  const [skillsNote, setSkillsNote] = useState("");
  const [jobType, setJobType] = useState<"full_time" | "part_time" | "wfh">("full_time");
  const [locationId, setLocationId] = useState<number>(defaultLocationId);
  const [salaryRange, setSalaryRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await postJobAction({
        title,
        description,
        // -1 is the "Other" sentinel in the dropdown, not a real qualification
        // id — never send it as qualificationId (the server requires a
        // positive id); qualificationOther carries the actual free-text value.
        qualificationId: qualificationId && qualificationId !== -1 ? Number(qualificationId) : undefined,
        qualificationOther: qualificationOther || undefined,
        skillsNote: skillsNote || undefined,
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
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          What does this job involve?
        </label>
        <p className="text-xs text-[var(--ink-faint)] mb-1">
          Describe the day-to-day work clearly — what they'll actually do, timings/shift, and anything else a Job
          Seeker should know before applying.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={"e.g. Help run the shop counter — billing, stock, and customer service.\nTimings: 10am–7pm, Monday to Saturday."}
          className={inputCls}
        />
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
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Skills / anything specific you're looking for (optional)
        </label>
        <textarea
          value={skillsNote}
          onChange={(e) => setSkillsNote(e.target.value)}
          rows={2}
          placeholder="e.g. Should know two-wheeler driving and basic Hindi/English."
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Job type</label>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value as "full_time" | "part_time" | "wfh")}
          className={inputCls}
        >
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="wfh">Work From Home</option>
        </select>
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
