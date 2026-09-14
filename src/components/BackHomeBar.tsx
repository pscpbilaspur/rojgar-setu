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
 * - `identity`, when logged in, shows who's logged in (name or mobile) on
 *   the right side of every page — including the home/dashboard page itself
 *   — so it's always obvious whether you're looking at your own
 *   profile/dashboard or a public, logged-out view of the site. Each layout
 *   looks up its own session server-side and passes this in; it's simply
 *   absent when nobody's logged in.
 */
export function BackHomeBar({
  homeHref,
  homeLabel,
  hideOn = [],
  identity,
}: {
  homeHref: string;
  homeLabel: string;
  hideOn?: string[];
  identity?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (hideOn.includes(pathname)) return null;

  const showNav = pathname !== homeHref;
  if (!showNav && !identity) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 flex items-center justify-between gap-3 text-[13px]">
      <div className="flex items-center gap-3 min-w-0">
        {showNav && (
          <>
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
          </>
        )}
      </div>
      {identity && (
        <span
          className="flex items-center gap-1 text-[var(--ink-faint)] truncate max-w-[50%] shrink-0"
          title={identity}
        >
          <span aria-hidden>👤</span> {identity}
        </span>
      )}
    </div>
  );
}
