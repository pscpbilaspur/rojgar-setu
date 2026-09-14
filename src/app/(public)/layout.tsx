import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackHomeBar } from "@/components/BackHomeBar";
import { getCurrentUser } from "@/lib/dal";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  // Prefer the person's own name (Seeker's name, or the Giver's contact
  // person) over their business name — "apna naam" (their own name), not
  // the business's — falling back to the mobile number if neither profile
  // is set up yet.
  const identity = current
    ? current.seekerProfile?.name ?? current.giverProfile?.contactPersonName ?? current.user.mobile
    : undefined;

  return (
    <>
      <SiteHeader />
      <BackHomeBar homeHref="/" homeLabel="Home" identity={identity} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
