"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * A small "← Back" / "🏠 Home" row shown near the top of every page (public
 * site, Admin panel, Approver panel each get their own instance via their
 * layout — see (public)/layout.tsx, admin/layout.tsx, approver/layout.tsx).
 * One component, wired in 3 places, covers every page in the app rather
 * than needing a per-page edit.
 *
 * - "Back" uses the browser's own history (router.back()) — the same thing
 *   a phone's hardware/gesture back does, so it matches what people expect.
 * - "Home" always goes to that section's own home (site home for public
 *   pages, /admin/dashboard for Admin, /approver/dashboard for Approver) —
 *   never a dead link, and it's hidden entirely once you're already there.
 * - `hideOn` additionally hides the bar on specific routes (login screens,
 *   where there's nothing to go "back" to and no session yet for "home").
 */
export function BackHomeBar({
  homeHref,
  homeLabel,
  hideOn = [],
}: {
  homeHref: string;
  homeLabel: string;
  hideOn?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === homeHref || hideOn.includes(pathname)) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 flex items-center gap-3 text-[13px]">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        <span aria-hidden>←</span> Back
      </button>
      <span className="text-[var(--border)]">·</span>
      <Link href={homeHref} className="flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <span aria-hidden>🏠</span> {homeLabel}
      </Link>
    </div>
  );
}
