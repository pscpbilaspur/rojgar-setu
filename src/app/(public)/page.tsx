import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { BrandHeroLockup } from "@/components/Brand";
import { FeatureCard, StepCard } from "@/components/ui";
import { getRecentOpenJobs } from "@/lib/queries/jobs";

const JOB_TYPE_LABEL: Record<string, { hi: string; en: string }> = {
  full_time: { hi: "पूर्णकालिक", en: "Full-time" },
  part_time: { hi: "अंशकालिक", en: "Part-time" },
  wfh: { hi: "घर से काम", en: "Work From Home" },
};

export default async function HomePage() {
  const { lang, t } = await getTranslations();
  const recentJobs = await getRecentOpenJobs(3);

  const actionTiles = [
    { href: "/register?role=seeker", icon: "📝", title: t("home_needJobTitle"), sub: t("home_needJobSub"), v: "a" },
    { href: "/register?role=giver", icon: "🏢", title: t("home_haveJobTitle"), sub: t("home_haveJobSub"), v: "b" },
    { href: "/jobs", icon: "🔎", title: t("nav_findJobs"), sub: t("home_findJobsSub"), v: "a" },
    { href: "/people", icon: "👤", title: t("nav_findPeople"), sub: t("home_findPeopleSub"), v: "b" },
  ] as const;

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
      <section className="pt-9 pb-8 text-center">
        <BrandHeroLockup />
        <p className="max-w-[56ch] mx-auto mt-3 text-[var(--ink-muted)]">
          {t("home_heroSubtitle")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
          {actionTiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-left transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2"
                style={{ background: tile.v === "a" ? "var(--accent-soft)" : "var(--accent2-soft)" }}
              >
                {tile.icon}
              </div>
              <h4 className="font-semibold text-[var(--ink)] text-[15px]">{tile.title}</h4>
              <p className="text-[13px] text-[var(--ink-muted)] mt-1">{tile.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Purpose */}
      <section className="py-6">
        <h2 className="text-center text-[23px] font-bold text-[var(--ink)]">
          {t("home_purposeTitle")}
        </h2>
        <p className="max-w-[70ch] mx-auto mt-3 text-center text-[var(--ink-muted)] leading-relaxed">
          {t("home_purposeLead")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} sub={f.sub} variant={f.v} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-8 -mx-4 px-4 bg-[var(--surface-2)] rounded-[var(--radius)]">
        <h2 className="text-center text-[23px] font-bold text-[var(--ink)]">
          {t("home_howItWorks")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-4xl mx-auto">
          {steps.map((s) => (
            <StepCard key={s.num} num={s.num} title={s.title} sub={s.sub} />
          ))}
        </div>
      </section>

      {/* Recent jobs */}
      <section className="py-8">
        <h2 className="text-[20px] font-bold text-[var(--ink)]">{t("home_recentJobs")}</h2>
        {recentJobs.length === 0 ? (
          <p className="text-[var(--ink-muted)] mt-3">{t("home_noJobsYet")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
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
      </section>
    </div>
  );
}
