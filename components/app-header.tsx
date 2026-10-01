import Link from "next/link"

import { DesktopNav } from "@/components/app-nav"
import { LanguageSwitcher } from "@/components/language-switcher"

export function AppHeader() {
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
        <LanguageSwitcher />
      </div>
    </header>
  )
}
