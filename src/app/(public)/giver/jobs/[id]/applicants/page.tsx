import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getApplicantsForJob } from "@/lib/queries/applicants";
import { ApplicantCard } from "./ApplicantCard";

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { giverProfile } = await requireUser();
  if (!giverProfile) redirect("/onboarding/giver");

  const { id } = await params;
  const applicants = await getApplicantsForJob(Number(id), giverProfile.id);
  if (applicants === null) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Applicants</h1>
      {applicants.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => (
            <ApplicantCard key={a.applicationId} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
