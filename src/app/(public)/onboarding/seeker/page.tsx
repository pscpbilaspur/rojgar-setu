import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getAllDistricts, getQualifications } from "@/lib/queries/lookups";
import { SeekerOnboardingForm } from "./SeekerOnboardingForm";

export default async function SeekerOnboardingPage() {
  const { seekerProfile, giverProfile } = await requireUser();
  if (seekerProfile) redirect("/dashboard");

  // One role per account — an account already registered as a Job Giver
  // can't also become a Job Seeker. Explained here, before any form-filling
  // effort, rather than only rejected at submit.
  if (giverProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center">
        <h1 className="text-xl font-bold text-[var(--ink)] mb-3">Job Seeker Registration</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          This account is already registered as a Job Giver ({giverProfile.businessName}). To keep one clear
          identity per account, an account can only be a Job Seeker or a Job Giver, not both.
        </p>
        <Link href="/dashboard" className="inline-block mt-4 underline text-[var(--accent-ink)]">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  const [districts, qualifications] = await Promise.all([getAllDistricts(), getQualifications()]);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Job Seeker Registration</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <SeekerOnboardingForm districts={districts} qualifications={qualifications} />
      </div>
    </div>
  );
}
