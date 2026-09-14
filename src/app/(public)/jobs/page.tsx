import Link from "next/link";
import { browseOpenJobs } from "@/lib/queries/jobs-browse";
import { getAllDistricts } from "@/lib/queries/lookups";
import { getCurrentUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";
import { jobTypeLabel } from "@/lib/format";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;
  const jobType = params.type || undefined;

  const { lang } = await getTranslations();
  const current = await getCurrentUser();
  const [jobsList, districts] = await Promise.all([
    browseOpenJobs({ districtId, jobType }, current?.seekerProfile?.id),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
          <option value="full_time">{jobTypeLabel("full_time", lang)}</option>
          <option value="part_time">{jobTypeLabel("part_time", lang)}</option>
          <option value="wfh">{jobTypeLabel("wfh", lang)}</option>
        </select>
        <button type="submit" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          Filter
        </button>
      </form>

      {jobsList.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No jobs match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobsList.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[var(--ink)]">{job.title}</h3>
                {job.alreadyApplied && (
                  <span className="shrink-0 text-[11px] font-medium text-[var(--ok)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    ✓ Applied
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">{job.businessName}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">
                {job.district} · {jobTypeLabel(job.jobType, lang)}
                {job.salaryRange ? ` · ${job.salaryRange}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
