import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackHomeBar } from "@/components/BackHomeBar";

// Identity ("👤 name") now shows inside SiteHeader itself, right next to
// the Dashboard button, rather than as its own separate row here — keeps it
// anchored to the header on every page instead of floating below it.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <BackHomeBar homeHref="/" homeLabel="Home" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
