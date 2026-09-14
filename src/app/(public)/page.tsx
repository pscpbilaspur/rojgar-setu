import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { BrandHeroLockup } from "@/components/Brand";
import { FeatureCard, StepCard, CollapsibleSection } from "@/components/ui";
import { getRecentOpenJobs } from "@/lib/queries/jobs";
import { countPlatformStats } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/dal";

const JOB_TYPE_LABEL: Record<string, { hi: string; en: string }> = {
  full_time: { hi: "पूर्णकालिक", en: "Full-time" },
  part_time: { hi: "अंशकालिक", en: "Part-time" },
  wfh: { hi: "घर से काम", en: "Work From Home" },
};

export default async function HomePage() {
  const { lang, t } = await getTranslations();
  const [recentJobs, stats, current] = await Promise.all([
    getRecentOpenJobs(3),
    countPlatformStats(),
    getCurrentUser(),
  ]);
  // Once someone is logged in as a Seeker or a Giver, one account = one role
  // (see (public)/onboarding — the other role is blocked outright), so the
  // "I'm looking for work" / "I want to hire" tile for the role they're NOT
  // is just a dead end for them now — hidden rather than shown-but-blocked.
  // Their own tile instead goes straight to their dashboard (they already
  // have a profile, no need to log in again). Anonymous visitors, and
  // accounts with no profile yet, still see both, unchanged. Each keeps its
  // own fixed brand color (--seeker-accent-soft / --giver-accent-soft, see
  // globals.css) regardless of which theme is currently active on the page,
  // so the tile someone picks always looks like the account it leads to.
  const role = current?.seekerProfile ? "seeker" : current?.giverProfile ? "giver" : undefined;

  const actionTiles = [
    role !== "giver" && {
      href: role === "seeker" ? "/dashboard" : "/login?role=seeker",
      icon: "📝",
      title: t("home_needJobTitle"),
      sub: t("home_needJobSub"),
      accentSoft: "var(--seeker-accent-soft)",
    },
    role !== "seeker" && {
      href: role === "giver" ? "/dashboard" : "/login?role=giver",
      icon: "🏢",
      title: t("home_haveJobTitle"),
      sub: t("home_haveJobSub"),
      accentSoft: "var(--giver-accent-soft)",
    },
    { href: "/jobs", icon: "🔎", title: t("nav_findJobs"), sub: t("home_findJobsSub"), accentSoft: "var(--accent-soft)" },
    { href: "/people", icon: "👤", title: t("nav_findPeople"), sub: t("home_findPeopleSub"), accentSoft: "var(--accent2-soft)" },
  ].filter((tile): tile is { href: string; icon: string; title: string; sub: string; accentSoft: string } => Boolean(tile));

  const features = [
    { icon: "🤝", title: t("home_feature1Title"), sub: t("home_feature1Sub"), v: "a" },
    { icon: "🌱", title: t("home_feature2Title"), sub: t("home_feature2Sub"), v: "b" },
    { icon: "🛠️", title: t("home_feature3Title"), sub: t("home_feature3Sub"), v: "a" },
    { icon: "🚀", title: t("home_feature4Title"), sub: t("home_feature4Sub"), v: "b" },
  ] as const;

  const steps = [
    { num: "1", title: t("home_step1Title"), sub: t("home_step1Sub") },
    { num: "2", title: t("home_step2Title"), sub: t("home_step2Sub") },
    { num: "3", title: t("home_step3Title"), sub: t("home_step3Sub") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="pt-6 pb-6 sm:pt-9 sm:pb-8 text-center">
        <BrandHeroLockup />
        <p className="max-w-[56ch] mx-auto mt-3 text-[14px] sm:text-base text-[var(--ink-muted)]">
          {t("home_heroSubtitle")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 sm:mt-7">
          {actionTiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98] hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg mb-2"
                style={{ background: tile.accentSoft }}
              >
                {tile.icon}
              </div>
              <h4 className="font-semibold text-[var(--ink)] text-[14px] sm:text-[15px] leading-snug">
                {tile.title}
              </h4>
              <p className="text-[12px] sm:text-[13px] text-[var(--ink-muted)] mt-1 leading-snug">{tile.sub}</p>
            </Link>
          ))}
        </div>

        {/* Platform stats — one place showing total counts (Section 3.1, Public Website panel) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4 sm:mt-5 max-w-md mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] py-2.5 sm:py-3">
            <div className="text-lg sm:text-xl font-bold text-[var(--accent-ink)]">{stats.seekers}</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-[var(--ink-muted)] mt-0.5 leading-snug">
              {t("home_statsSeekers")}
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] py-2.5 sm:py-3">
            <div className="text-lg sm:text-xl font-bold text-[var(--accent-ink)]">{stats.givers}</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-[var(--ink-muted)] mt-0.5 leading-snug">
              {t("home_statsGivers")}
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] py-2.5 sm:py-3">
            <div className="text-lg sm:text-xl font-bold text-[var(--accent-ink)]">{stats.openJobs}</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-[var(--ink-muted)] mt-0.5 leading-snug">
              {t("home_statsJobs")}
            </div>
          </div>
        </div>
      </section>

      {/* Purpose — collapsed by default, tap to expand (keeps the mobile page short) */}
      <section className="py-3 sm:py-4 border-t border-[var(--border)]">
        <CollapsibleSection title={t("home_purposeTitle")}>
          <p className="max-w-[70ch] mx-auto text-center text-[14px] sm:text-base text-[var(--ink-muted)] leading-relaxed">
            {t("home_purposeLead")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
            {features.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} sub={f.sub} variant={f.v} />
            ))}
          </div>
        </CollapsibleSection>
      </section>

      {/* How it works */}
      <section className="py-3 sm:py-4 -mx-4 px-4 bg-[var(--surface-2)] rounded-[var(--radius)]">
        <CollapsibleSection title={t("home_howItWorks")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-4xl mx-auto">
            {steps.map((s) => (
              <StepCard key={s.num} num={s.num} title={s.title} sub={s.sub} />
            ))}
          </div>
        </CollapsibleSection>
      </section>

      {/* Recent jobs — kept open by default (real, actionable content, not filler) */}
      <section className="py-3 sm:py-4 border-t border-[var(--border)]">
        <CollapsibleSection title={t("home_recentJobs")} defaultOpen>
          {recentJobs.length === 0 ? (
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-5 text-center">
              <p className="text-[14px] sm:text-base text-[var(--ink-muted)]">{t("home_noJobsYet")}</p>
              <Link
                href="/login?role=giver"
                className="inline-block mt-3 text-[14px] font-semibold text-[var(--accent-ink)] underline underline-offset-2"
              >
                {t("home_postFirstJobCta")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
                  style={{ boxShadow: "var(--shadow)" }}
                >
                  <h4 className="font-semibold text-[var(--ink)]">{job.title}</h4>
                  <p className="text-[13px] text-[var(--ink-muted)] mt-1">{job.businessName}</p>
                  <p className="text-[12px] text-[var(--ink-faint)] mt-2">
                    {job.district} · {JOB_TYPE_LABEL[job.jobType]?.[lang] ?? job.jobType}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <div className="text-center mt-4">
            <Link href="/jobs" className="text-[13px] font-medium text-[var(--accent-ink)] underline underline-offset-2">
              {t("home_viewAllJobsCta")}
            </Link>
          </div>
        </CollapsibleSection>
      </section>
    </div>
  );
}
