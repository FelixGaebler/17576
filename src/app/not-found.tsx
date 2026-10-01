import type { Metadata } from "next"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { TileCharacter } from "@/components/tile-character"
import { buttonVariants } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.notFound.title }
}

export default async function NotFound() {
  const { t } = await getI18n()

  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="flex items-end gap-4" aria-hidden>
        <div className="flex">
          {["4", "0", "4"].map((digit, index) => (
            <span
              key={index}
              className="flex size-16 items-center justify-center border-y border-r border-input bg-input/50 font-mono text-3xl font-semibold text-muted-foreground first:rounded-l-3xl first:border-l last:rounded-r-3xl sm:size-20 sm:text-4xl"
            >
              {digit}
            </span>
          ))}
        </div>
        <TileCharacter mood="confused" className="w-20 sm:w-24" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.notFound.title}</h1>
        <p className="text-muted-foreground">{t.notFound.description}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          {t.notFound.home}
        </Link>
        <Link href="/search" className={buttonVariants({ size: "lg", variant: "outline" })}>
          <SearchIcon data-icon="inline-start" aria-hidden />
          {t.home.searchCta}
        </Link>
      </div>
    </div>
  )
}
