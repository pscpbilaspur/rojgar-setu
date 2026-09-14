import { BackHomeBar } from "@/components/BackHomeBar";

export default function ApproverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackHomeBar homeHref="/approver/dashboard" homeLabel="Approver Home" hideOn={["/approver/login"]} />
      {children}
    </>
  );
}
