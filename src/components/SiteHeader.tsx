import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/dal";
import { BrandHeaderLockup } from "@/components/Brand";
import { LangSwitch } from "@/components/LangSwitch";

export async function SiteHeader() {
  const { t } = await getTranslations();
  const current = await getCurrentUser();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/">
          <BrandHeaderLockup />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
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
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white font-medium"
            >
              {t("nav_dashboard")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white font-medium"
            >
              {t("nav_login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
