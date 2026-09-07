import Link from "next/link";
import { browseOpenJobs } from "@/lib/queries/jobs-browse";
import { getAllDistricts } from "@/lib/queries/lookups";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  wfh: "Work From Home",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;
  const jobType = params.type || undefined;

  const [jobsList, districts] = await Promise.all([
    browseOpenJobs({ districtId, jobType }),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find Jobs</h1>

      <form className="flex flex-wrap gap-2 mb-6" method="get">
        <select name="district" defaultValue={params.district ?? ""} className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm">
          <option value="">All districts</option>
          {districts.filter((d) => !d.isRemote).map((d) => (
            <option key={d.id} value={d.id}>{d.district}</option>
          ))}
        </select>
        <select name="type" defaultValue={params.type ?? ""} className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm">
          <option value="">Any job type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="wfh">Work From Home</option>
        </select>
        <button type="submit" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          Filter
        </button>
      </form>

      {jobsList.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No jobs match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobsList.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <h3 className="font-semibold text-[var(--ink)]">{job.title}</h3>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">{job.businessName}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">
                {job.district} · {JOB_TYPE_LABEL[job.jobType]}
                {job.salaryRange ? ` · ${job.salaryRange}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
