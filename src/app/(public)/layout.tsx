import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackHomeBar } from "@/components/BackHomeBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { getCurrentUser } from "@/lib/dal";
import { getTranslations } from "@/lib/i18n";

// Identity ("👤 name") now shows inside SiteHeader itself, right next to
// the Dashboard button, rather than as its own separate row here — keeps it
// anchored to the header on every page instead of floating below it.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [current, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);
  // A Job Giver's whole logged-in experience re-themes to the blue
  // "giver" accent (see globals.css's `[data-role="giver"]` override) —
  // a Job Seeker's data-role="seeker" needs no override, it's just the
  // site's default teal. Anonymous visitors get neither, so browsing stays
  // the default color until someone actually logs in.
  const role = current?.seekerProfile ? "seeker" : current?.giverProfile ? "giver" : undefined;

  return (
    <div data-role={role} className="contents">
      <SiteHeader />
      <BackHomeBar homeHref="/" homeLabel="Home" />
      {/* pb-16 on mobile only — reserves room so the fixed bottom nav never
          overlaps the footer/last content; sm:pb-0 since the bar itself is
          sm:hidden and desktop needs no extra space. */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav
        isLoggedIn={Boolean(current)}
        labels={{
          home: t("nav_home"),
          jobs: t("nav_findJobs"),
          people: t("nav_findPeople"),
          givers: t("nav_findGivers"),
          account: current ? t("nav_dashboard") : t("nav_loginShort"),
        }}
      />
    </div>
  );
}
