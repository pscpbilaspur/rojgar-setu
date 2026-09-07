"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { LANG_COOKIE } from "@/lib/i18n";

export async function setLangAction(lang: "hi" | "en") {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
}
