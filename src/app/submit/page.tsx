import type { Metadata } from "next"

import { getI18n } from "@/lib/i18n-server"
import { normalizeAcronym } from "@/lib/validation"
import { SubmitForm } from "./submit-form"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.nav.submit }
}

export default async function SubmitPage({ searchParams }: PageProps<"/submit">) {
  const [{ acronym }, { t }] = await Promise.all([searchParams, getI18n()])
  const prefilledAcronym = typeof acronym === "string" ? normalizeAcronym(acronym).replace(/[^A-Z]/g, "").slice(0, 3) : ""

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.submit.title}</h1>
        <p className="text-muted-foreground">{t.submit.intro}</p>
      </div>

      <SubmitForm initialAcronym={prefilledAcronym} />
    </div>
  )
}
