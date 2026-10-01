import type { Metadata } from "next"

import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatNumber } from "@/lib/format"
import { getI18n } from "@/lib/i18n-server"
import { getLeaderboard } from "@/lib/scoring"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.scoreboard.title }
}

// Rank 1 sits in the middle of the podium; DOM order stays 1-2-3 for screen readers.
const podiumStyles: Record<number, { order: string; block: string; avatar: string }> = {
  1: { order: "order-2", block: "h-28 bg-primary text-primary-foreground", avatar: "size-16 text-lg ring-4 ring-primary" },
  2: { order: "order-1", block: "h-20 bg-muted", avatar: "size-14" },
  3: { order: "order-3", block: "h-14 bg-muted/60", avatar: "size-14" },
}

export default async function ScoreboardPage() {
  const [leaderboard, currentUser, { locale, t }] = await Promise.all([
    getLeaderboard(),
    getCurrentUser(),
    getI18n(),
  ])

  const podium = leaderboard.slice(0, 3)
  const others = leaderboard.slice(3)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.scoreboard.title}</h1>
        <p className="text-muted-foreground">{t.scoreboard.intro}</p>
      </div>

      <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label={t.scoreboard.title}>
        {podium.map((user) => (
          <li
            key={user.id}
            value={user.rank}
            className={cn("flex min-w-0 flex-col items-center gap-2 text-center", podiumStyles[user.rank].order)}
          >
            <UserAvatar
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              className={podiumStyles[user.rank].avatar}
            />
            <div className="w-full min-w-0">
              <p className="truncate text-sm font-medium sm:text-base">{user.displayName}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatNumber(user.score, locale)} {t.common.points}
              </p>
              {user.id === currentUser.id && (
                <Badge variant="outline" className="mt-1">
                  {t.scoreboard.you}
                </Badge>
              )}
            </div>
            <div
              className={cn(
                "flex w-full items-start justify-center rounded-t-3xl pt-3 text-2xl font-bold tabular-nums",
                podiumStyles[user.rank].block,
              )}
            >
              <span className="sr-only">{t.scoreboard.rank} </span>
              {user.rank}
            </div>
          </li>
        ))}
      </ol>

      {others.length > 0 && (
        <Card size="sm" className="py-2">
          <CardContent>
            <ol className="space-y-1">
              {others.map((user) => {
                const isCurrentUser = user.id === currentUser.id

                return (
                  <li
                    key={user.id}
                    value={user.rank}
                    aria-current={isCurrentUser ? "true" : undefined}
                    className={cn(
                      "-mx-2 flex items-center gap-4 rounded-2xl px-2 py-2.5",
                      isCurrentUser && "bg-muted",
                    )}
                  >
                    <span className="w-6 text-right text-sm font-semibold text-muted-foreground tabular-nums">
                      <span className="sr-only">{t.scoreboard.rank} </span>
                      {user.rank}
                    </span>
                    <UserAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} />
                    <span className="min-w-0 flex-1 truncate">{user.displayName}</span>
                    {isCurrentUser && <Badge variant="outline">{t.scoreboard.you}</Badge>}
                    <span className="font-semibold tabular-nums">
                      {formatNumber(user.score, locale)}
                      <span className="sr-only"> {t.common.points}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
