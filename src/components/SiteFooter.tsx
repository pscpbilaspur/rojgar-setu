import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { BrandMark, ORG_NAME_HI, PLATFORM_NAME_HI } from "@/components/Brand";

export async function SiteFooter() {
  const { lang, t } = await getTranslations();
  return (
    <footer className="border-t-[3px] border-[var(--accent)] mt-6 sm:mt-10 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-7 text-center">
        <div className="flex justify-center mb-1.5 sm:mb-2">
          <BrandMark size={40} className="w-7 h-auto sm:w-10" />
        </div>
        <div className="font-bold text-[12px] sm:text-[15px] text-[var(--ink)] leading-snug">
          {ORG_NAME_HI} (छ.ग.)
        </div>
        <div className="text-[11px] sm:text-[13px] font-semibold text-[var(--accent-ink)] mt-0.5 leading-snug">
          {PLATFORM_NAME_HI}
        </div>
        <div className="text-[11px] sm:text-[12.5px] text-[var(--ink-muted)] mt-1 sm:mt-1.5 leading-snug">
          {lang === "hi"
            ? "सिंधी समाज के युवाओं को रोजगार से जोड़ने की पहल"
            : "An initiative connecting the youth of the Sindhi community with employment"}
        </div>
        <div className="text-[10.5px] sm:text-[11.5px] text-[var(--ink-faint)] mt-2.5 sm:mt-4 flex justify-center gap-1.5 flex-wrap">
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
      <div className="text-center pb-2.5 pt-1 sm:pb-5 px-4 bg-[var(--bg)]">
        <a
          href="mailto:abhimnani@gmail.com?subject=Website%20Design%20Inquiry"
          className="text-[10px] sm:text-[11px] text-[var(--ink-faint)]"
        >
          Website Design By AB Soft
        </a>
      </div>
    </footer>
  );
}
