import { intlLocales, type Locale } from "@/lib/i18n"

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocales[locale]).format(value)
}

export function formatPercentage(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocales[locale], {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocales[locale], { day: "numeric", month: "short", year: "numeric" }).format(date)
}

/** "Today, 14:32", "Yesterday, 10:15", "Monday, 09:42" or "12 Sept 2026, 09:42" (localized). */
export function formatTimestamp(date: Date, locale: Locale, now = new Date()) {
  const intlLocale = intlLocales[locale]
  const time = new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(date)
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  let day: string
  if (daysAgo <= 1) day = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" }).format(-daysAgo, "day")
  else if (daysAgo < 7) day = new Intl.DateTimeFormat(intlLocale, { weekday: "long" }).format(date)
  else day = formatDate(date, locale)

  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
