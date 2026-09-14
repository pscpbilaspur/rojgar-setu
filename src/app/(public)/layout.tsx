import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackHomeBar } from "@/components/BackHomeBar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <BackHomeBar homeHref="/" homeLabel="Home" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
