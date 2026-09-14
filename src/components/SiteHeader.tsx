import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/dal";
import { HeaderBrand } from "@/components/HeaderBrand";
import { LangSwitch } from "@/components/LangSwitch";

export async function SiteHeader() {
  const { t } = await getTranslations();
  const current = await getCurrentUser();
  // Prefer the person's own name (Seeker's name, or the Giver's contact
  // person) over their business name — "apna naam" (their own name), not
  // the business's — falling back to the mobile number if neither profile
  // is set up yet. Shown right next to the Dashboard button so it's always
  // obvious whose account you're looking at, on every page (this header is
  // shared by the whole public site).
  const identity = current
    ? current.seekerProfile?.name ?? current.giverProfile?.contactPersonName ?? current.user.mobile
    : undefined;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <HeaderBrand />
        <nav className="flex items-center gap-2 sm:gap-4 text-sm shrink-0">
          <Link href="/jobs" className="hidden sm:inline text-[var(--ink-muted)] hover:text-[var(--ink)]">
            {t("nav_findJobs")}
          </Link>
          <Link href="/people" className="hidden sm:inline text-[var(--ink-muted)] hover:text-[var(--ink)]">
            {t("nav_findPeople")}
          </Link>
          <Link href="/givers" className="hidden sm:inline text-[var(--ink-muted)] hover:text-[var(--ink)]">
            {t("nav_findGivers")}
          </Link>
          <LangSwitch />
          {current ? (
            <>
              {identity && (
                <span
                  className="flex items-center gap-0.5 text-[12px] text-[var(--ink-faint)] truncate max-w-[70px] sm:max-w-[140px]"
                  title={identity}
                >
                  <span aria-hidden>👤</span> {identity}
                </span>
              )}
              <Link
                href="/dashboard"
                className="px-2.5 py-1.5 sm:px-3 rounded-md bg-[var(--accent)] text-white font-medium text-[13px] sm:text-sm whitespace-nowrap"
              >
                {t("nav_dashboard")}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1.5 sm:px-3 rounded-md bg-[var(--accent)] text-white font-medium text-[13px] sm:text-sm whitespace-nowrap"
            >
              {t("nav_login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
