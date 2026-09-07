import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getAllDistricts, getQualifications, getSkills } from "@/lib/queries/lookups";
import { PostJobForm } from "./PostJobForm";

export default async function NewJobPage() {
  const { giverProfile } = await requireUser();
  if (!giverProfile) redirect("/onboarding/giver");

  const [districts, qualifications, skills] = await Promise.all([
    getAllDistricts(),
    getQualifications(),
    getSkills(),
  ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Post a Job</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <PostJobForm
          districts={districts}
          qualifications={qualifications}
          initialSkills={skills}
          defaultLocationId={giverProfile.locationId}
        />
      </div>
    </div>
  );
}
