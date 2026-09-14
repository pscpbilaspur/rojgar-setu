import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackHomeBar } from "@/components/BackHomeBar";
import { getCurrentUser } from "@/lib/dal";

// Identity ("👤 name") now shows inside SiteHeader itself, right next to
// the Dashboard button, rather than as its own separate row here — keeps it
// anchored to the header on every page instead of floating below it.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
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
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
