import { BackHomeBar } from "@/components/BackHomeBar";
import { getCurrentAdmin } from "@/lib/dal";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <>
      <BackHomeBar
        homeHref="/admin/dashboard"
        homeLabel="Admin Home"
        hideOn={["/admin/login"]}
        identity={admin ? `${admin.username} (Admin)` : undefined}
      />
      {children}
    </>
  );
}
