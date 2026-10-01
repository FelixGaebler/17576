import Link from "next/link"
import { LogOutIcon } from "lucide-react"

import { DesktopNav } from "@/components/app-nav"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n-server"
import { isOidcEnabled } from "@/lib/oidc"

export async function AppHeader() {
  const { t } = await getI18n()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="rounded-md text-xl font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          26³
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isOidcEnabled() && (
            <form action="/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="icon-sm" aria-label={t.nav.signOut} title={t.nav.signOut}>
                <LogOutIcon aria-hidden />
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}
