import { cache } from "react"
import { cookies, headers } from "next/headers"

import { DEFAULT_LOCALE, dictionaries, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n"

/** The visitor's chosen language, falling back to the browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return chosen

  const acceptLanguage = (await headers()).get("accept-language") ?? ""
  const preferred = acceptLanguage
    .split(",")
    .map((entry) => entry.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((language) => LOCALES.includes(language as Locale))

  return isLocale(preferred) ? preferred : DEFAULT_LOCALE
})

export async function getI18n() {
  const locale = await getLocale()
  return { locale, t: dictionaries[locale] }
}
