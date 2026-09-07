import { requireUser } from "@/lib/dal";
import { getAllDistricts, getQualifications, getSkills } from "@/lib/queries/lookups";
import { SeekerOnboardingForm } from "./SeekerOnboardingForm";

export default async function SeekerOnboardingPage() {
  await requireUser();
  const [districts, qualifications, skills] = await Promise.all([
    getAllDistricts(),
    getQualifications(),
    getSkills(),
  ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Job Seeker Registration</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <SeekerOnboardingForm districts={districts} qualifications={qualifications} initialSkills={skills} />
      </div>
    </div>
  );
}
