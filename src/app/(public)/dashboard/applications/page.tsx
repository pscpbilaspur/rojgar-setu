import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getApplicationsForSeeker } from "@/lib/queries/my-applications";

const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  shortlisted: "Shortlisted",
  not_a_fit: "Not a fit",
};

export default async function MyApplicationsPage() {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) redirect("/onboarding/seeker");

  const apps = await getApplicationsForSeeker(seekerProfile.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">My Applications</h1>
      {apps.length === 0 ? (
        <p className="text-[var(--ink-muted)]">
          You haven&apos;t applied to any jobs yet. <Link href="/jobs" className="underline">Browse jobs</Link>
        </p>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Link
              key={a.applicationId}
              href={`/jobs/${a.jobId}`}
              className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[var(--ink)]">{a.title}</h3>
                <span className="text-xs bg-[var(--surface-2)] px-2 py-1 rounded-full text-[var(--ink-muted)]">
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">{a.businessName} · {a.district}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
