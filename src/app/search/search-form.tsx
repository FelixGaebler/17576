"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { AcronymInput } from "@/components/acronym-input"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { isValidAcronym } from "@/lib/validation"

export function SearchForm({ initialAcronym }: { initialAcronym: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const [acronym, setAcronym] = useState(initialAcronym)
  const [isSearching, startSearch] = useTransition()

  function search(code: string) {
    startSearch(() => router.push(`/search?q=${code}`))
  }

  return (
    <form
      role="search"
      className="flex flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValidAcronym(acronym)) search(acronym)
      }}
    >
      <Label htmlFor="search-acronym">{t.search.acronym}</Label>
      <div className="flex items-center gap-3">
        <AcronymInput
          id="search-acronym"
          value={acronym}
          onChange={setAcronym}
          onComplete={search}
          autoFocus={!initialAcronym}
        />
        <Button type="submit" variant="outline" disabled={!isValidAcronym(acronym) || isSearching}>
          {isSearching ? <LoaderCircleIcon className="animate-spin" aria-hidden /> : null}
          {isSearching ? t.search.searching : t.search.search}
        </Button>
      </div>
    </form>
  )
}
