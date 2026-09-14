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

  // Each choice is shown in its own fixed brand color (see globals.css:
  // --seeker-accent / --giver-accent) — the same color that account's
  // whole dashboard re-themes to once they're logged in (via the
  // data-role="seeker"/"giver" attribute set in (public)/layout.tsx), so
  // the color someone picks here is the color they'll see everywhere from
  // here on, not just on this one screen.
  const roleCards = [
    {
      href: "/onboarding/seeker",
      icon: "📝",
      label: t("onboard_asSeeker"),
      accent: "var(--seeker-accent)",
      accentSoft: "var(--seeker-accent-soft)",
      accentInk: "var(--seeker-accent-ink)",
    },
    {
      href: "/onboarding/giver",
      icon: "🏢",
      label: t("onboard_asGiver"),
      accent: "var(--giver-accent)",
      accentSoft: "var(--giver-accent-soft)",
      accentInk: "var(--giver-accent-ink)",
    },
  ] as const;

  return (
    <div className="max-w-md mx-auto px-4 py-14 text-center">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-2">{t("onboard_chooseRole")}</h1>
      <p className="text-sm text-[var(--ink-muted)] mb-6">{user.mobile}</p>
      <div className="grid grid-cols-2 gap-3">
        {roleCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col items-center gap-2.5 bg-[var(--surface)] border-2 rounded-[var(--radius)] p-4 sm:p-5 text-center transition-transform active:scale-[0.98] hover:-translate-y-0.5"
            style={{ boxShadow: "var(--shadow)", borderColor: card.accentSoft }}
          >
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl"
              style={{ background: card.accentSoft }}
            >
              {card.icon}
            </div>
            <span className="text-[13.5px] sm:text-[14.5px] font-semibold leading-snug" style={{ color: card.accentInk }}>
              {card.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
