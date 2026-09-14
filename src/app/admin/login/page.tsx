import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-bold text-[var(--ink)] mb-1 text-center">
          Central Admin
        </h1>
        <p className="text-sm text-[var(--ink-muted)] text-center mb-6">
          Password + authenticator app required — no mobile OTP for this account.
        </p>
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
