import Image from "next/image";

// The two fixed brand-identity lines (Section 2 of the master build prompt).
// These NEVER participate in the hi/en toggle — always Hindi, on every page
// that shows branding (header, hero, footer). Do not wire these to t().
export const ORG_NAME_HI = "पूज्य सिंधी सेंट्रल पंचायत बिलासपुर";
export const PLATFORM_NAME_HI = "सेंट्रल पंचायत रोजगार सेतु";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/pscp-logo.png"
      alt="Pujya Sindhi Central Panchayat Bilaspur"
      width={size}
      height={Math.round(size * (700 / 571))}
      priority
    />
  );
}

/** Compact header lockup: logo + the two fixed lines, stacked. */
export function BrandHeaderLockup() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark size={40} />
      <div>
        <div className="text-[15px] font-bold text-[var(--ink)] leading-tight">
          {ORG_NAME_HI} (छ.ग.)
        </div>
        <div className="text-[13px] font-semibold text-[var(--accent-ink)] leading-tight mt-0.5">
          {PLATFORM_NAME_HI}
        </div>
      </div>
    </div>
  );
}

/** Large hero lockup for the homepage. */
export function BrandHeroLockup() {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <BrandMark size={74} />
      <div className="text-[15px] font-semibold text-[var(--ink-muted)] mt-2">
        {ORG_NAME_HI}
      </div>
      <h1 className="text-[clamp(26px,5.5vw,38px)] font-bold text-[var(--ink)] mt-1">
        {PLATFORM_NAME_HI}
      </h1>
    </div>
  );
}
