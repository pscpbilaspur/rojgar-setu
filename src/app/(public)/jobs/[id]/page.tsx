import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobDetail } from "@/lib/queries/jobs-browse";
import { getCurrentUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";
import { jobTypeLabel } from "@/lib/format";
import { ApplyButton } from "./ApplyButton";
import { ReportJobButton } from "./ReportJobButton";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang } = await getTranslations();
  const current = await getCurrentUser();
  const job = await getJobDetail(Number(id), current?.seekerProfile?.id);
  if (!job) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{job.title}</h1>
        <p className="text-[var(--ink-muted)] mt-1">
          <Link href={`/givers/${job.giverId}`} className="underline">{job.businessName}</Link>
        </p>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          {job.district} · {jobTypeLabel(job.jobType, lang)}
          {job.salaryRange ? ` · ${job.salaryRange}` : ""}
        </p>
        {job.qualification && (
          <p className="text-sm text-[var(--ink-muted)] mt-1">Minimum qualification: {job.qualification}</p>
        )}
        <div className="text-sm font-semibold text-[var(--ink)] mt-4">What this job involves</div>
        <p className="mt-1 whitespace-pre-line text-[var(--ink)]">{job.description}</p>

        {job.skills && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">Skills / requirements</div>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-line">{job.skills}</p>
          </>
        )}

        <div className="mt-6">
          {!current ? (
            <Link href="/login" className="bg-[var(--accent)] text-white rounded-md px-5 py-2 font-medium inline-block">
              Log in to Apply
            </Link>
          ) : !current.seekerProfile ? (
            <p className="text-sm text-[var(--ink-muted)]">
              You need a Job Seeker profile to apply.{" "}
              <Link href="/onboarding/seeker" className="underline">Create one</Link>
            </p>
          ) : job.alreadyApplied ? (
            <p className="text-[var(--ok)] font-medium">✓ You've already applied to this job.</p>
          ) : (
            <ApplyButton jobId={job.id} />
          )}
        </div>

        {current && <ReportJobButton jobId={job.id} />}
      </div>
    </div>
  );
}
