import { ApproverLoginForm } from "./ApproverLoginForm";

export default function ApproverLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Approver Login</h1>
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <ApproverLoginForm />
        </div>
      </div>
    </div>
  );
}
