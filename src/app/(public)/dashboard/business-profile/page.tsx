import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getAllDistricts } from "@/lib/queries/lookups";
import { EditGiverForm } from "./EditGiverForm";

export default async function BusinessProfilePage() {
  const { giverProfile } = await requireUser();
  if (!giverProfile) redirect("/onboarding/giver");

  const districts = await getAllDistricts();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Business Profile</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <EditGiverForm
          districts={districts}
          profile={{
            businessName: giverProfile.businessName,
            contactPersonName: giverProfile.contactPersonName,
            category: giverProfile.category,
            locationId: giverProfile.locationId,
            about: giverProfile.about,
            website: giverProfile.website,
          }}
        />
      </div>
    </div>
  );
}
