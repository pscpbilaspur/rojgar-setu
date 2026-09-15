import Image from "next/image";

// The two fixed brand-identity lines (Section 2 of the master build prompt).
// These NEVER participate in the hi/en toggle — always Hindi, on every page
// that shows branding (header, hero, footer). Do not wire these to t().
export const ORG_NAME_HI = "पूज्य सिंधी सेंट्रल पंचायत बिलासपुर";
export const PLATFORM_NAME_HI = "सेंट्रल पंचायत रोजगार सेतु";

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/pscp-logo.png"
      alt="Pujya Sindhi Central Panchayat Bilaspur"
      width={size}
      height={Math.round(size * (700 / 571))}
      className={className}
      priority
    />
  );
}

/**
 * Compact header lockup: logo + brand name, shown on every page except the
 * homepage (see HeaderBrand). Two different treatments by screen size, not
 * just two font sizes — the full two-line org-name+platform-name lockup has
 * real room to breathe on desktop, but on a narrow phone the header row also
 * has to fit the language switch, the identity text, and the Dashboard/Login
 * button, so the long org name (~40 characters) was wrapping across 3 lines
 * with the platform name wrapping to a 4th right under it — cramped and
 * messy next to everything else in the row. Below `sm`, this instead shows
 * just the logo plus the short platform name ("रोजगार सेतु") on one line,
 * never wrapping; the full official name stays visible on mobile via the
 * homepage hero and the footer, so nothing about the org's identity is lost,
 * only decluttered where space is genuinely too tight for it.
 */
export function BrandHeaderLockup() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <BrandMark size={40} className="w-8 h-auto sm:w-10 shrink-0" />
      <div className="min-w-0">
        <div className="sm:hidden text-[13px] font-bold text-[var(--accent-ink)] leading-tight whitespace-nowrap">
          {PLATFORM_NAME_HI}
        </div>
        <div className="hidden sm:block text-[15px] font-bold text-[var(--ink)] leading-tight">
          {ORG_NAME_HI} (छ.ग.)
        </div>
        <div className="hidden sm:block text-[13px] font-semibold text-[var(--accent-ink)] leading-tight mt-0.5">
          {PLATFORM_NAME_HI}
        </div>
      </div>
    </div>
  );
}

/**
 * Large hero lockup for the homepage. Previously stacked vertically and
 * centered (logo, then org name below it, then platform name below that) —
 * changed to a side-by-side row (logo left, both name lines stacked to its
 * right) at the user's explicit request, matching the mockup's logo+title
 * row treatment instead of a centered vertical stack. The whole row is
 * still centered as a unit via `mx-auto` on the text block's parent, and
 * wraps to a centered stack again only below `sm` where a horizontal row
 * would otherwise get cramped next to a ~74px logo.
 */
export function BrandHeroLockup() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
      <BrandMark size={62} className="shrink-0" />
      <div>
        <div className="text-[14px] font-semibold text-[var(--ink-muted)]">{ORG_NAME_HI}</div>
        <h1 className="text-[clamp(24px,5.5vw,34px)] font-bold text-[var(--ink)] leading-tight mt-0.5">
          {PLATFORM_NAME_HI}
        </h1>
      </div>
    </div>
  );
}
