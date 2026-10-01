import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { getI18n } from "@/lib/i18n-server"
import { isLocale, LOCALE_COOKIE, LOCALES, localeNames } from "@/lib/i18n"
import { cn } from "@/lib/utils"

async function setLocale(formData: FormData) {
  "use server"

  const locale = formData.get("locale")
  if (!isLocale(locale)) return

    ; (await cookies()).set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
  revalidatePath("/", "layout")
}

export async function LanguageSwitcher() {
  const { locale, t } = await getI18n()

  return (
    <form action={setLocale} aria-label={t.nav.language} className="flex rounded-full bg-muted p-0.5">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="submit"
          name="locale"
          value={option}
          lang={option}
          aria-label={localeNames[option]}
          aria-pressed={option === locale}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            option === locale && "bg-background text-foreground ring-1 ring-border",
          )}
        >
          {option}
        </button>
      ))}
    </form>
  )
}
