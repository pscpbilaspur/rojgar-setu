import Link from "next/link";
import { browseOpenJobs } from "@/lib/queries/jobs-browse";
import { getAllDistricts } from "@/lib/queries/lookups";
import { getCurrentUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";
import { jobTypeLabel, postedAgoLabel } from "@/lib/format";
import { InitialAvatar, FilterChipRow } from "@/components/ui";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;
  const jobType = params.type || undefined;
  const q = params.q || undefined;

  const { lang } = await getTranslations();
  const current = await getCurrentUser();
  const [jobsList, districts] = await Promise.all([
    browseOpenJobs({ districtId, jobType, q }, current?.seekerProfile?.id),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find Jobs</h1>

      {/* Keyword stays a text box + submit (a chip can't represent free
          text) — hidden fields carry the current district/type pills
          through a keyword search so switching one filter doesn't reset
          the other. */}
      <form className="flex flex-wrap gap-2 mb-4" method="get">
        <input type="hidden" name="district" value={params.district ?? ""} />
        <input type="hidden" name="type" value={params.type ?? ""} />
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Job title, company or skill"
          className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm flex-1 min-w-[160px]"
        />
        <button type="submit" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          🔎 Search
        </button>
      </form>

      {/* District + job-type filters as tap-to-select pills (mockup style)
          instead of dropdowns — each preserves the other two params. */}
      <div className="space-y-2 mb-6">
        <FilterChipRow
          basePath="/jobs"
          paramName="district"
          allLabel="All districts"
          activeValue={params.district}
          otherParams={{ type: params.type, q: params.q }}
          options={districts.filter((d) => !d.isRemote).map((d) => ({ value: String(d.id), label: d.district }))}
        />
        <FilterChipRow
          basePath="/jobs"
          paramName="type"
          allLabel="Any job type"
          activeValue={params.type}
          otherParams={{ district: params.district, q: params.q }}
          options={[
            { value: "full_time", label: jobTypeLabel("full_time", lang) },
            { value: "part_time", label: jobTypeLabel("part_time", lang) },
            { value: "wfh", label: jobTypeLabel("wfh", lang) },
          ]}
        />
      </div>

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
              <div className="flex items-start gap-3">
                <InitialAvatar name={job.businessName} />
                <div className="flex-1 min-w-0">
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
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {job.salaryRange && (
                      <span className="text-[11px] font-medium text-[var(--accent2)] bg-[var(--accent2-soft)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        ₹ {job.salaryRange}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--ink-faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      🕒 {postedAgoLabel(job.createdAt, lang)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
