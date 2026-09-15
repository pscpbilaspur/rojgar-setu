import { notFound } from "next/navigation";
import { getSeekerPublicProfile } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/dal";
import { MessageButton } from "@/components/MessageButton";
import { VERIFICATION_STATUS_LABEL, jobTypeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";

export default async function SeekerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getTranslations();
  const current = await getCurrentUser();
  const profile = await getSeekerPublicProfile(Number(id), Boolean(current));
  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{profile.name}</h1>
        <p className="text-[var(--ink-muted)] mt-1">{profile.qualification ?? "—"}</p>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          {t("profile_hometown")}: {profile.district} · {jobTypeLabel(profile.jobType, lang)}
          {profile.expectedSalary ? ` · ${profile.expectedSalary}` : ""}
        </p>
        {profile.verificationPending && (
          <p className="text-sm text-[var(--warn)] mt-2">{VERIFICATION_STATUS_LABEL.not_yet_done}</p>
        )}

        {profile.preferredDistricts.length > 0 && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">{t("profile_availableIn")}</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {profile.preferredDistricts.map((d) => (
                <span key={d} className="text-xs bg-[var(--accent2-soft)] text-[var(--ink)] px-2 py-1 rounded-full">
                  {d}
                </span>
              ))}
            </div>
          </>
        )}

        {profile.experience && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">{t("field_experience")}</div>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-line">{profile.experience}</p>
          </>
        )}

        {profile.skills && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">{t("field_skills")}</div>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-line">{profile.skills}</p>
          </>
        )}

        {profile.additionalNote && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">{t("profile_anythingElse")}</div>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-line">{profile.additionalNote}</p>
          </>
        )}

        {current && current.user.id !== profile.userId && current.seekerProfile && (
          <div className="mt-4">
            <MessageButton otherUserId={profile.userId} />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          {profile.mobile ? (
            <p className="text-sm text-[var(--ink)]">
              {t("profile_contactLabel")}: <span className="font-medium">{profile.mobile}</span>
            </p>
          ) : current ? (
            <p className="text-sm text-[var(--ink-faint)]">{t("profile_contactConditional")}</p>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">
              <a href="/login" className="underline">{t("profile_loginToSeeMore")}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
