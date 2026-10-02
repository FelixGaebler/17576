import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { AcronymCard } from "@/components/acronym-card"
import { EmptyState } from "@/components/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { findAcronym } from "@/lib/glossary"
import { getI18n } from "@/lib/i18n-server"
import { isValidAcronym, normalizeAcronym } from "@/lib/validation"
import { SearchForm } from "./search-form"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.nav.search }
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const [{ q }, { t }] = await Promise.all([searchParams, getI18n()])
  const query = typeof q === "string" ? normalizeAcronym(q) : ""
  const acronym = isValidAcronym(query) ? query : ""

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.search.title}</h1>
        <p className="text-muted-foreground">{t.search.intro}</p>
      </div>

      <SearchForm key={acronym} initialAcronym={acronym} />

      {query && !acronym && (
        <p role="alert" className="text-sm text-destructive">
          {t.search.notAnAcronym(query)}
        </p>
      )}

      {acronym && <SearchResult code={acronym} />}
    </div>
  )
}

async function SearchResult({ code }: { code: string }) {
  const [acronym, { t }, user] = await Promise.all([findAcronym(code), getI18n(), getCurrentUser()])

  if (!acronym) {
    const [beforeCode, afterCode] = t.search.noMeaning.split("{code}")

    return (
      <EmptyState
        mood="confused"
        title={
          <>
            {beforeCode}
            <span className="font-mono font-semibold tracking-wider">{code}</span>
            {afterCode}
          </>
        }
      >
        <Link href={`/submit?acronym=${code}`} className={buttonVariants()}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {t.search.add(code)}
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="space-y-4">
      <AcronymCard code={acronym.code} meanings={acronym.meanings} canInvalidate={user.isAdmin} />
      <p className="text-sm text-muted-foreground">
        {t.search.anotherMeaning}{" "}
        <Link href={`/submit?acronym=${code}`} className="font-medium text-foreground underline underline-offset-4">
          {t.search.addForPoints}
        </Link>
      </p>
    </div>
  )
}
