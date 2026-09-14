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
