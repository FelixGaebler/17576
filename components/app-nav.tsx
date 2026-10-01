"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HouseIcon, PlusIcon, SearchIcon, TrophyIcon, UserIcon } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"

const links = [
  { href: "/", key: "home", icon: HouseIcon },
  { href: "/search", key: "search", icon: SearchIcon },
  { href: "/submit", key: "submit", icon: PlusIcon },
  { href: "/scoreboard", key: "scoreboard", icon: TrophyIcon },
  { href: "/profile", key: "profile", icon: UserIcon },
] as const

export function DesktopNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav aria-label={t.nav.label} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {links.map(({ href, key }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              {t.nav[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Bottom tab bar for small screens. */
export function MobileNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ href, key, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="group flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground outline-none focus-visible:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              <span className="rounded-full px-3 py-0.5 group-aria-[current=page]:bg-primary group-aria-[current=page]:text-primary-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              {t.nav[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
