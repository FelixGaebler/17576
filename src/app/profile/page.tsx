import type { Metadata } from "next"
import Link from "next/link"

import { ScoreBadge } from "@/components/score-badge"
import { TileCharacter } from "@/components/tile-character"
import { UserAvatar } from "@/components/user-avatar"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatNumber, formatTimestamp } from "@/lib/format"
import { getI18n } from "@/lib/i18n-server"
import { getLeaderboard, getScoreHistory } from "@/lib/scoring"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.profile.title }
}

export default async function ProfilePage() {
  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getI18n()])
  const [leaderboard, history] = await Promise.all([getLeaderboard(), getScoreHistory(user.id)])
  const rank = leaderboard.find((entry) => entry.id === user.id)?.rank

  const stats = [
    { label: t.profile.submissions, value: history.length },
    { label: t.profile.newAcronyms, value: history.filter((entry) => entry.type === "NEW_ACRONYM").length },
    { label: t.profile.duplicatesFound, value: history.filter((entry) => entry.type === "DUPLICATE_FOUND").length },
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex items-center gap-4 sm:gap-6">
          <UserAvatar
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            className="size-16 text-lg sm:size-20 sm:text-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {user.displayName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.profile.rank} <span className="font-semibold text-foreground">#{rank ?? "–"}</span>{" "}
              {t.profile.ofTotal(leaderboard.length)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
              {formatNumber(user.score, locale)}
            </p>
            <p className="text-sm text-muted-foreground">{t.profile.score}</p>
          </div>
        </CardContent>

        <CardContent>
          <dl className="grid grid-cols-3 gap-2 rounded-3xl bg-muted/60 p-2">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-0.5 rounded-2xl px-3 py-2">
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{formatNumber(stat.value, locale)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t.profile.history}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="space-y-4 py-6 text-center">
              <TileCharacter mood="happy" className="mx-auto w-20" />
              <p className="text-muted-foreground">{t.profile.empty}</p>
              <Link href="/submit" className={buttonVariants()}>
                {t.profile.firstSubmission}
              </Link>
            </div>
          ) : (
            <ol className="-my-3 divide-y">
              {history.map((transaction) => (
                <li key={transaction.id} className="flex items-center gap-4 py-3">
                  <ScoreBadge points={transaction.amount} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <Link
                        href={`/search?q=${transaction.acronym}`}
                        className="font-mono font-semibold tracking-wider underline-offset-4 outline-none hover:underline focus-visible:underline"
                      >
                        {transaction.acronym}
                      </Link>{" "}
                      <span className="text-muted-foreground">— {transaction.meaning}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.profile.transactionTypes[transaction.type]} ·{" "}
                      <time dateTime={transaction.createdAt.toISOString()}>
                        {formatTimestamp(transaction.createdAt, locale)}
                      </time>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
