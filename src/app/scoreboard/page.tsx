import type { Metadata } from "next"

import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { formatNumber } from "@/lib/format"
import { getI18n } from "@/lib/i18n-server"
import { getLeaderboard } from "@/lib/scoring"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.scoreboard.title }
}

const podiumStyles: Record<number, string> = {
  1: "bg-primary text-primary-foreground",
  2: "bg-secondary text-secondary-foreground ring-1 ring-foreground/15",
  3: "bg-secondary text-secondary-foreground ring-1 ring-foreground/10",
}

export default async function ScoreboardPage() {
  const [leaderboard, currentUser, { locale, t }] = await Promise.all([
    getLeaderboard(),
    getCurrentUser(),
    getI18n(),
  ])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.scoreboard.title}</h1>
        <p className="text-muted-foreground">{t.scoreboard.intro}</p>
      </div>

      <ol className="divide-y rounded-3xl border">
        {leaderboard.map((user) => {
          const isCurrentUser = user.id === currentUser.id

          return (
            <li
              key={user.id}
              aria-current={isCurrentUser ? "true" : undefined}
              className={cn(
                "flex items-center gap-4 px-4 py-3 first:rounded-t-3xl last:rounded-b-3xl sm:px-6",
                isCurrentUser && "bg-muted/70",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  podiumStyles[user.rank] ?? "text-muted-foreground",
                )}
              >
                <span className="sr-only">{t.scoreboard.rank} </span>
                {user.rank}
              </span>
              <UserAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} />
              <span className={cn("min-w-0 flex-1 truncate", user.rank <= 3 && "font-medium")}>
                {user.displayName}
              </span>
              {isCurrentUser && <Badge variant="outline">{t.scoreboard.you}</Badge>}
              <span className="font-semibold tabular-nums">
                {formatNumber(user.score, locale)}
                <span className="sr-only"> {t.common.points}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
