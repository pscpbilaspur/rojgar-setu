"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type AccountMenuItem = {
  href: string;
  label: string;
  icon?: string;
};

/**
 * The "☰" account menu shown top-right on every dashboard header (Job
 * Seeker/Giver, Admin, Approver — see DashboardHeader in ui.tsx, which all
 * four call the same way). Replaces what used to be a bare underlined
 * "Log out" text link with one consistent, tappable menu button that also
 * holds each panel's own settings/profile/log links — so every account
 * type gets the same polished pattern instead of each one inventing (or
 * not having) its own.
 *
 * `items` is intentionally allowed to be empty (a panel with no settings
 * pages of its own yet still gets the same-looking menu, just with only
 * Log out inside) so every panel stays visually consistent even as more
 * items get added to any one of them later.
 */
export function AccountMenu({
  items,
  logoutAction,
}: {
  items: AccountMenuItem[];
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-9 h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]"
      >
        <span aria-hidden className="text-base leading-none">☰</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] py-1.5 z-30 overflow-hidden"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]"
            >
              {item.icon && <span aria-hidden>{item.icon}</span>}
              {item.label}
            </Link>
          ))}
          {items.length > 0 && <div className="border-t border-[var(--border)] my-1" />}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)]"
            >
              <span aria-hidden>🚪</span> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
