import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getAllDistricts, getQualifications, getSkills, getSeekerSkillIds, getSeekerLocationIds } from "@/lib/queries/lookups";
import { EditSeekerForm } from "./EditSeekerForm";

export default async function SeekerProfilePage() {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) redirect("/onboarding/seeker");

  const [districts, qualifications, skills, skillIds, locationIds] = await Promise.all([
    getAllDistricts(),
    getQualifications(),
    getSkills(),
    getSeekerSkillIds(seekerProfile.id),
    getSeekerLocationIds(seekerProfile.id),
  ]);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">My Profile</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <EditSeekerForm
          districts={districts}
          qualifications={qualifications}
          initialSkills={skills}
          profile={{
            name: seekerProfile.name,
            fatherName: seekerProfile.fatherName,
            hometownDistrictId: seekerProfile.hometownDistrictId,
            qualificationId: seekerProfile.qualificationId,
            qualificationOther: seekerProfile.qualificationOther,
            experience: seekerProfile.experience,
            expectedSalary: seekerProfile.expectedSalary,
            jobType: seekerProfile.jobType as "full_time" | "part_time" | "wfh",
            skillIds,
            preferredLocationIds: locationIds,
          }}
        />
      </div>
    </div>
  );
}
