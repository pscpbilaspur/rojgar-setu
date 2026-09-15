"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; icon: string; label: string };

/**
 * Fixed bottom tab bar, mobile only (`sm:hidden`) — closes a real gap, not
 * just a cosmetic addition: SiteHeader already hides its Find Jobs/Find
 * People/Find Job Givers links below the `sm` breakpoint (there's no room
 * for them next to the brand lockup, language switch, identity and
 * Dashboard/Login button), so on a phone those three destinations were only
 * reachable from the homepage's own tiles — nowhere else. This puts primary
 * navigation within thumb reach on every page instead, the way a mobile app
 * normally would.
 *
 * Labels/hrefs are passed in from the server layout (PublicLayout), which
 * already has the translated strings and knows whether someone is logged
 * in — this component only needs to be a Client Component for
 * `usePathname()` (active-tab highlighting).
 */
export function MobileBottomNav({
  isLoggedIn,
  labels,
}: {
  isLoggedIn: boolean;
  labels: { home: string; jobs: string; people: string; givers: string; account: string };
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", icon: "🏠", label: labels.home },
    { href: "/jobs", icon: "🔎", label: labels.jobs },
    { href: "/people", icon: "🧑‍🤝‍🧑", label: labels.people },
    { href: "/givers", icon: "🏢", label: labels.givers },
    { href: isLoggedIn ? "/dashboard" : "/login", icon: "👤", label: labels.account },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] flex items-stretch justify-around"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        // "/" only counts as active on the homepage itself; every other tab
        // is active on its own path and any sub-path (e.g. /jobs/[id]).
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10.5px] font-medium ${
              active ? "text-[var(--accent-ink)]" : "text-[var(--ink-muted)]"
            }`}
          >
            <span className="text-[18px] leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
