import { ApproverLoginForm } from "./ApproverLoginForm";

export default function ApproverLoginPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-14">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Approver Login</h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <ApproverLoginForm />
      </div>
    </div>
  );
}
