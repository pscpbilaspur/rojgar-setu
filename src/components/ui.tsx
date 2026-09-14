import Link from "next/link";
import { AccountMenu, type AccountMenuItem } from "@/components/AccountMenu";

/**
 * Shared dashboard building blocks — one visual standard reused across the
 * Job Seeker/Giver dashboard, the Admin dashboard, and the Approver
 * dashboard, so all four panels look and behave the same way (same header
 * row + account menu, same stat tiles, same nav-card grid, same status pill
 * colors) instead of each panel inventing its own layout.
 */

export function DashboardHeader({
  title,
  subtitle,
  menuItems = [],
  logoutAction,
}: {
  title: string;
  subtitle?: string;
  /** Panel-specific settings/profile/log links shown above Log out in the
   * "☰" menu — e.g. Edit Profile for a Seeker, My Logs for an Approver.
   * Safe to leave empty: the menu still renders with just Log out inside,
   * so every panel looks the same even before it has settings of its own. */
  menuItems?: AccountMenuItem[];
  logoutAction: () => Promise<void>;
}) {
  return (
    <div className="flex justify-between items-center mb-6 gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--ink-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <AccountMenu items={menuItems} logoutAction={logoutAction} />
    </div>
  );
}

export function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-center h-full"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="text-2xl font-bold text-[var(--ink)]">{value}</div>
      <div className="text-xs text-[var(--ink-muted)] mt-1">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function NavCard({ href, label, icon }: { href: string; label: string; icon?: string }) {
  return (
    <Link
      href={href}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-center font-medium text-[var(--ink)] hover:border-[var(--accent)] flex flex-col items-center justify-center gap-1 min-h-[76px]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="text-sm">{label}</span>
    </Link>
  );
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  confirmed: "bg-[var(--ok-soft)] text-[var(--ok)]",
  active: "bg-[var(--ok-soft)] text-[var(--ok)]",
  open: "bg-[var(--ok-soft)] text-[var(--ok)]",
  pending: "bg-[var(--warn-soft)] text-[var(--ink)]",
  not_yet_done: "bg-[var(--surface)] text-[var(--ink-muted)] border border-[var(--border)]",
  unable_to_confirm: "bg-[var(--danger-soft)] text-[var(--danger)]",
  suspended: "bg-[var(--danger-soft)] text-[var(--danger)]",
  inactive: "bg-[var(--danger-soft)] text-[var(--danger)]",
  closed: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE_STYLES[status] ?? "bg-[var(--surface)] text-[var(--ink-muted)] border border-[var(--border)]"}`}>
      {label ?? status}
    </span>
  );
}

/**
 * A native, no-JS collapsible section (the browser's own <details>/<summary>
 * disclosure widget) — used for secondary homepage content (Our Purpose, How
 * it Works, Recent Jobs) so the page is short by default on mobile and each
 * section expands on tap. This is the standard, currently-common pattern for
 * this (an accordion/disclosure), and it's fully accessible and keyboardable
 * for free since it's a real browser element, not a custom-built toggle.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex items-center justify-center gap-2 cursor-pointer list-none py-1 select-none">
        <h2 className="text-[19px] sm:text-[23px] font-bold text-[var(--ink)]">{title}</h2>
        <span className="text-[var(--ink-muted)] transition-transform group-open:rotate-180 text-[13px] mt-0.5">
          ▾
        </span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 ${className}`}
      style={{ boxShadow: "var(--shadow)" }}
    >
      {children}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  sub,
  variant = "a",
}: {
  icon: string;
  title: string;
  sub: string;
  variant?: "a" | "b";
}) {
  const bg = variant === "a" ? "var(--accent-soft)" : "var(--accent2-soft)";
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3.5 sm:p-4 text-center">
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg mx-auto mb-2"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-[var(--ink)] text-[14px] sm:text-[15px] leading-snug">{title}</h4>
      <p className="text-[12px] sm:text-[13px] text-[var(--ink-muted)] mt-1 leading-snug">{sub}</p>
    </div>
  );
}

export function StepCard({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3.5 sm:p-4 text-center">
      <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold mx-auto mb-2">
        {num}
      </div>
      <h4 className="font-semibold text-[var(--ink)] text-[14px] sm:text-[15px] leading-snug">{title}</h4>
      <p className="text-[12px] sm:text-[13px] text-[var(--ink-muted)] mt-1 leading-snug">{sub}</p>
    </div>
  );
}
