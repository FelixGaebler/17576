import Link from "next/link"
import { PlusIcon, SearchIcon } from "lucide-react"

import { ProgressOverview } from "@/components/progress-overview"
import { buttonVariants } from "@/components/ui/button"
import { getGlossaryProgress } from "@/lib/glossary"
import { formatNumber } from "@/lib/format"
import { getI18n } from "@/lib/i18n-server"

export default async function HomePage() {
  const [progress, { locale, t }] = await Promise.all([getGlossaryProgress(), getI18n()])

  const stats = [
    { label: t.home.acronymsDiscovered, value: progress.discovered },
    { label: t.home.meaningsDocumented, value: progress.meanings },
    { label: t.home.duplicateAcronyms, value: progress.duplicates },
    { label: t.home.remainingCombinations, value: progress.remaining },
  ]

  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-title" className="space-y-8">
        <div className="space-y-3">
          <h1 id="hero-title" className="text-6xl font-bold tracking-tight sm:text-7xl">
            26³
          </h1>
          <p className="max-w-md text-lg text-balance text-muted-foreground">
            {t.home.question}
          </p>
        </div>

        <ProgressOverview discovered={progress.discovered} percentage={progress.percentage} />

        <div className="flex flex-wrap gap-3">
          <Link href="/submit" className={buttonVariants({ size: "lg" })}>
            <PlusIcon data-icon="inline-start" aria-hidden />
            {t.home.submitCta}
          </Link>
          <Link href="/search" className={buttonVariants({ size: "lg", variant: "outline" })}>
            <SearchIcon data-icon="inline-start" aria-hidden />
            {t.home.searchCta}
          </Link>
        </div>
      </section>

      <section aria-label={t.home.statistics}>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col justify-between gap-1 bg-background p-5">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{formatNumber(stat.value, locale)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
