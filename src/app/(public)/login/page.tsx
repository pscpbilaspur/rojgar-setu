import { getTranslations } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const { t } = await getTranslations();
  return (
    <div className="max-w-sm mx-auto px-4 py-14">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">
        {t("login_title")}
      </h1>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <LoginForm
          strings={{
            mobileLabel: t("login_mobileLabel"),
            sendOtp: t("login_sendOtp"),
            otpLabel: t("login_otpLabel"),
            verifyOtp: t("login_verifyOtp"),
            resend: t("login_resend"),
            changeNumber: t("login_changeNumber"),
          }}
        />
      </div>
    </div>
  );
}
