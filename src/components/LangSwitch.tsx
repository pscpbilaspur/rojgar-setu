import { getLang } from "@/lib/i18n";
import { setLangAction } from "@/app/actions/lang";

export async function LangSwitch() {
  const lang = await getLang();
  return (
    <div className="flex text-xs border border-[var(--border)] rounded-full overflow-hidden">
      <form
        action={async () => {
          "use server";
          await setLangAction("hi");
        }}
      >
        <button
          type="submit"
          className={`px-2.5 py-1 ${lang === "hi" ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold" : "text-[var(--ink-muted)]"}`}
        >
          हिं
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await setLangAction("en");
        }}
      >
        <button
          type="submit"
          className={`px-2.5 py-1 ${lang === "en" ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold" : "text-[var(--ink-muted)]"}`}
        >
          EN
        </button>
      </form>
    </div>
  );
}
