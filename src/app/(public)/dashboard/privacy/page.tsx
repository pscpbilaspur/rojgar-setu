import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { PrivacyForm } from "./PrivacyForm";

export default async function PrivacySettingsPage() {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) redirect("/dashboard");

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Privacy Settings</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <p className="text-sm font-medium text-[var(--ink)] mb-2">Who can see your mobile number?</p>
        <PrivacyForm initialPolicy={seekerProfile.contactSharePolicy as "never" | "on_application" | "always"} />
      </div>
    </div>
  );
}
