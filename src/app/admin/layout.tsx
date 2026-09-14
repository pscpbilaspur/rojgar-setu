import { BackHomeBar } from "@/components/BackHomeBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackHomeBar homeHref="/admin/dashboard" homeLabel="Admin Home" hideOn={["/admin/login"]} />
      {children}
    </>
  );
}
