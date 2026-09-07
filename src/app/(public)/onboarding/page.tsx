import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";

// Step 0 of onboarding: choose Job Seeker or Job Giver (Section 3). The
// actual multi-step forms (basic info -> education & work -> preferences ->
// select approver, per Section 3's panel outlines) are the next slice of
// work — this page exists so the OTP login flow has somewhere real to land.
export default async function OnboardingPage() {
  const { user } = await requireUser();
  const { t } = await getTranslations();

  return (
    <div className="max-w-md mx-auto px-4 py-14 text-center">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-2">{t("onboard_chooseRole")}</h1>
      <p className="text-sm text-[var(--ink-muted)] mb-6">{user.mobile}</p>
      <div className="space-y-3">
        <Link
          href="/onboarding/seeker"
          className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-left hover:border-[var(--accent)]"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {t("onboard_asSeeker")}
        </Link>
        <Link
          href="/onboarding/giver"
          className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-left hover:border-[var(--accent)]"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {t("onboard_asGiver")}
        </Link>
      </div>
    </div>
  );
}
