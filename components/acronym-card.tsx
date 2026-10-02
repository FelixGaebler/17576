"use client"

import { useI18n } from "@/components/i18n-provider"
import { InvalidateMeaningButton } from "@/components/invalidate-meaning-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type AcronymCardProps = {
  code: string
  meanings: { id: string; text: string; addedBy: string; addedAt: Date }[]
  /** Meaning text to emphasise, e.g. the one just submitted. */
  highlight?: string
  /** Shows the admin button to invalidate a meaning. */
  canInvalidate?: boolean
}

export function AcronymCard({ code, meanings, highlight, canInvalidate = false }: AcronymCardProps) {
  const { locale, t } = useI18n()
  const highlighted = highlight?.toLowerCase()

  return (
    <Card className="text-base">
      <CardContent>
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="font-mono text-5xl font-bold tracking-widest">{code}</h2>
          <Badge variant={meanings.length > 1 ? "default" : "secondary"}>
            {t.acronym.meanings(meanings.length)}
          </Badge>
        </header>

        <ul className="mt-5 divide-y">
          {meanings.map((meaning) => (
            <li key={meaning.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium",
                    meaning.text.toLowerCase() === highlighted &&
                    "underline decoration-primary decoration-3 underline-offset-4",
                  )}
                >
                  {meaning.text}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.acronym.addedBy(meaning.addedBy, formatDate(meaning.addedAt, locale))}
                </p>
              </div>
              {canInvalidate && <InvalidateMeaningButton meaningId={meaning.id} meaning={meaning.text} />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
