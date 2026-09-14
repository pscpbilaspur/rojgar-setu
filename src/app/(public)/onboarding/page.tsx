import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";

// Step 0 of onboarding: choose Job Seeker or Job Giver (Section 3). The
// actual multi-step forms (basic info -> education & work -> preferences ->
// select approver, per Section 3's panel outlines) are the next slice of
// work — this page exists so the OTP login flow has somewhere real to land.
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { user, seekerProfile, giverProfile } = await requireUser();
  const { t } = await getTranslations();
  const { role } = await searchParams;

  // Already has a profile (of either kind) — nothing to choose, and one
  // role per account means they can't pick the other one from here either.
  if (seekerProfile || giverProfile) redirect("/dashboard");

  // Came here from the homepage's "I'm looking for work" / "I want to hire"
  // tile (via /login?role=...) — skip the choice screen and go straight to
  // the right form instead of asking again.
  if (role === "seeker") redirect("/onboarding/seeker");
  if (role === "giver") redirect("/onboarding/giver");

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
