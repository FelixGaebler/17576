"use client"

import { createContext, useContext, type ReactNode } from "react"

import { DEFAULT_LOCALE, dictionaries, type Locale } from "@/lib/i18n"

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const locale = useContext(LocaleContext)
  return { locale, t: dictionaries[locale] }
}
