import Link from "next/link";
import { AccountMenu, type AccountMenuItem } from "@/components/AccountMenu";

/**
 * Shared dashboard building blocks — one visual standard reused across the
 * Job Seeker/Giver dashboard, the Admin dashboard, and the Approver
 * dashboard, so all four panels look and behave the same way (same header
 * row + account menu, same stat tiles, same nav-card grid, same status pill
 * colors) instead of each panel inventing its own layout.
 */

/**
 * The one input/select/textarea style used by every form in the app
 * (registration, edit-profile, post-a-job, and the Admin utility forms).
 * Previously each form file defined its own identical copy of this string —
 * two of them had already quietly drifted (an extra `text-sm`) — so this is
 * the single source of truth now; every form imports it instead of
 * redefining it.
 */
export const inputCls =
  "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

/** A form field's label + control, stacked — the label wrapper every form
 * in the app uses around its inputs/selects/textareas. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-1">{label}</label>
      {children}
    </div>
  );
}

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
  shortlisted: "bg-[var(--ok-soft)] text-[var(--ok)]",
  pending: "bg-[var(--warn-soft)] text-[var(--ink)]",
  not_yet_done: "bg-[var(--surface)] text-[var(--ink-muted)] border border-[var(--border)]",
  sent: "bg-[var(--surface-2)] text-[var(--ink-muted)]",
  unable_to_confirm: "bg-[var(--danger-soft)] text-[var(--danger)]",
  suspended: "bg-[var(--danger-soft)] text-[var(--danger)]",
  inactive: "bg-[var(--danger-soft)] text-[var(--danger)]",
  closed: "bg-[var(--danger-soft)] text-[var(--danger)]",
  not_a_fit: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE_STYLES[status] ?? "bg-[var(--surface)] text-[var(--ink-muted)] border border-[var(--border)]"}`}>
      {label ?? status}
    </span>
  );
}

// A small fixed rotation of the app's own pastel "-soft" tokens (never a
// hardcoded hex — see the no-hardcoded-color convention noted throughout
// this codebase) — each is already tuned to read correctly against
// var(--ink) text in both light and dark mode, since every "-soft" token
// is a light tint in light mode and a dark tint in dark mode, with --ink
// flipping to match. Deliberately skips --danger-soft (reads as an
// alert/error color, wrong tone for a plain name initial).
const AVATAR_PALETTE = [
  "var(--accent-soft)",
  "var(--accent2-soft)",
  "var(--ok-soft)",
  "var(--warn-soft)",
  "var(--giver-accent-soft)",
];

/** A colored circle showing someone/something's first initial — a business,
 * a candidate, a job posting — picked deterministically from `name` so the
 * same name always gets the same color (not random on every render), used
 * to give listing cards (jobs/candidates/employers) a quicker visual
 * anchor than a plain text-only row. */
export function InitialAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const trimmed = name.trim();
  const initial = trimmed ? trimmed[0].toUpperCase() : "?";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) hash = (hash * 31 + trimmed.charCodeAt(i)) % 997;
  const bg = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-[var(--ink)] shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </div>
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
