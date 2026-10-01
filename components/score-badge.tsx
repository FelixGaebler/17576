"use client"

import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

/** "+10", "+5", "+1" or "0" points. Duplicates get the accent colour. */
export function ScoreBadge({ points, className }: { points: number; className?: string }) {
  const { t } = useI18n()

  return (
    <span
      className={cn(
        "inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
        points >= 10 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        className,
      )}
    >
      {points > 0 ? `+${points}` : points}
      <span className="sr-only"> {t.common.points}</span>
    </span>
  )
}
