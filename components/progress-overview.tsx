import { Progress } from "@/components/ui/progress"
import { formatNumber, formatPercentage } from "@/lib/format"
import { TOTAL_COMBINATIONS } from "@/lib/glossary"
import { getI18n } from "@/lib/i18n-server"

export async function ProgressOverview({ discovered, percentage }: { discovered: number; percentage: number }) {
  const { locale, t } = await getI18n()
  const discoveredText = formatNumber(discovered, locale)
  const totalText = formatNumber(TOTAL_COMBINATIONS, locale)

  return (
    <div className="space-y-3">
      <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
        {discoveredText}
        <span className="text-muted-foreground"> / {totalText}</span>
      </p>
      <Progress
        value={percentage}
        aria-label={t.home.progressLabel}
        aria-valuetext={t.home.progressSummary(discoveredText, totalText)}
      />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{formatPercentage(percentage, locale)}</span>{" "}
        {t.home.discovered}
      </p>
    </div>
  )
}
