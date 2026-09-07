import "server-only";
import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { uiStrings } from "@/db/schema";
import { dict, type Lang, type DictKey } from "./dict";

export type { Lang, DictKey };
export const LANG_COOKIE = "cprs_lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "hi"; // Hindi is the default throughout.
}

/** Loads the fallback dict for `lang`, then overlays any Central-Admin
 * edits from the `ui_strings` table. A key missing from both DB and the
 * requested language's dict falls back to English (Section 10) — never
 * blank. */
export async function loadStrings(
  lang: Lang
): Promise<Record<DictKey, string>> {
  const base: Record<string, string> = { ...dict.en, ...dict[lang] };

  const keys = Object.keys(dict.en);
  const overrides = await db
    .select()
    .from(uiStrings)
    .where(and(eq(uiStrings.lang, lang), inArray(uiStrings.key, keys)));

  for (const row of overrides) {
    base[row.key] = row.value;
  }

  return base as Record<DictKey, string>;
}

/** Convenience for a single page: returns (lang, t) where t(key) looks up
 * the merged dictionary. */
export async function getTranslations() {
  const lang = await getLang();
  const strings = await loadStrings(lang);
  function t(key: DictKey): string {
    return strings[key] ?? dict.en[key] ?? key;
  }
  return { lang, t, strings };
}
