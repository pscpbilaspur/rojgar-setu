import { requireUser } from "@/lib/dal";
import { getAllDistricts } from "@/lib/queries/lookups";
import { GiverOnboardingForm } from "./GiverOnboardingForm";

export default async function GiverOnboardingPage() {
  await requireUser();
  const districts = await getAllDistricts();

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Job Giver Registration</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <GiverOnboardingForm districts={districts} />
      </div>
    </div>
  );
}
