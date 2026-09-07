import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { BrandMark, ORG_NAME_HI, PLATFORM_NAME_HI } from "@/components/Brand";

export async function SiteFooter() {
  const { lang, t } = await getTranslations();
  return (
    <footer className="border-t-[3px] border-[var(--accent)] mt-10 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-7 text-center">
        <div className="flex justify-center mb-2">
          <BrandMark size={40} />
        </div>
        <div className="font-bold text-[15px] text-[var(--ink)]">
          {ORG_NAME_HI} (छ.ग.)
        </div>
        <div className="text-[13px] font-semibold text-[var(--accent-ink)] mt-0.5">
          {PLATFORM_NAME_HI}
        </div>
        <div className="text-[12.5px] text-[var(--ink-muted)] mt-1.5">
          {lang === "hi"
            ? "सिंधी समाज के युवाओं को रोजगार से जोड़ने की पहल"
            : "An initiative connecting the youth of the Sindhi community with employment"}
        </div>
        <div className="text-[11.5px] text-[var(--ink-faint)] mt-4 flex justify-center gap-1.5 flex-wrap">
          <Link href="/policy" className="underline">
            {t("footer_policy")}
          </Link>
          <span>·</span>
          <Link href="/disclaimer" className="underline">
            {t("footer_disclaimer")}
          </Link>
          <span>·</span>
          <Link href="/help" className="underline">
            {t("footer_help")}
          </Link>
          <span>·</span>
          <Link href="/suggest" className="underline">
            {t("footer_suggest")}
          </Link>
        </div>
      </div>
      <div className="text-center pb-5 pt-1 px-4 bg-[var(--bg)]">
        <a
          href="mailto:abhimnani@gmail.com?subject=Website%20Design%20Inquiry"
          className="text-[11px] text-[var(--ink-faint)]"
        >
          Website Design By AB Soft
        </a>
      </div>
    </footer>
  );
}
