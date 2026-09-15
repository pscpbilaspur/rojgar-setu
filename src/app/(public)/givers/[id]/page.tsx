import { notFound } from "next/navigation";
import Link from "next/link";
import { getGiverPublicProfile } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/dal";
import { MessageButton } from "@/components/MessageButton";
import { VERIFICATION_STATUS_LABEL, jobTypeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";

export default async function GiverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getTranslations();
  const current = await getCurrentUser();
  const profile = await getGiverPublicProfile(Number(id), Boolean(current));
  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{profile.businessName}</h1>
        <p className="text-[var(--ink-muted)] mt-1">{profile.category} · {profile.district}</p>
        {profile.verificationPending && (
          <p className="text-sm text-[var(--warn)] mt-2">{VERIFICATION_STATUS_LABEL.not_yet_done}</p>
        )}
        {profile.about && <p className="mt-4 whitespace-pre-line text-[var(--ink)]">{profile.about}</p>}
        {profile.website && (
          <p className="text-sm mt-2">
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-ink)]">
              {profile.website}
            </a>
          </p>
        )}

        {current && current.user.id !== profile.userId && current.seekerProfile && (
          <div className="mt-4">
            <MessageButton otherUserId={profile.userId} />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {profile.contactPersonName ? (
            <p className="text-sm text-[var(--ink)]">
              {t("giver_contactPersonLabel")}: <span className="font-medium">{profile.contactPersonName}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">
              <a href="/login" className="underline">{t("giver_loginToSeeContact")}</a>
            </p>
          )}
        </div>

        <div className="section-title text-sm font-semibold text-[var(--ink)] mt-6 mb-2">{t("giver_openJobsHeading")}</div>
        {profile.openJobs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">{t("giver_noActiveJobs")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.openJobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="border border-[var(--border)] rounded-[var(--radius)] p-3"
              >
                <h4 className="font-medium text-[var(--ink)] text-sm">{j.title}</h4>
                <p className="text-xs text-[var(--ink-faint)] mt-1">{jobTypeLabel(j.jobType, lang)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
