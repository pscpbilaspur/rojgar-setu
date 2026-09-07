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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg mx-auto mb-2"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-[var(--ink)] text-[15px]">{title}</h4>
      <p className="text-[13px] text-[var(--ink-muted)] mt-1">{sub}</p>
    </div>
  );
}

export function StepCard({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-center">
      <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold mx-auto mb-2">
        {num}
      </div>
      <h4 className="font-semibold text-[var(--ink)] text-[15px]">{title}</h4>
      <p className="text-[13px] text-[var(--ink-muted)] mt-1">{sub}</p>
    </div>
  );
}
