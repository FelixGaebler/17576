import type { Metadata } from "next"
import Link from "next/link"

import { ScoreBadge } from "@/components/score-badge"
import { UserAvatar } from "@/components/user-avatar"
import { buttonVariants } from "@/components/ui/button"
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

  return (
    <div className="space-y-10">
      <section aria-labelledby="profile-name" className="flex items-center gap-5">
        <UserAvatar
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
          className="size-16 text-lg"
        />
        <div className="min-w-0 space-y-1">
          <h1 id="profile-name" className="truncate text-2xl font-bold tracking-tight">
            {user.displayName}
          </h1>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-muted-foreground">{t.profile.score}</dt>
              <dd className="text-xl font-semibold tabular-nums">{formatNumber(user.score, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.profile.rank}</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {rank ? `#${rank}` : "–"}
                <span className="text-sm font-normal text-muted-foreground"> {t.profile.ofTotal(leaderboard.length)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="history-title" className="space-y-4">
        <h2 id="history-title" className="text-lg font-semibold">
          {t.profile.history}
        </h2>

        {history.length === 0 ? (
          <div className="space-y-4 rounded-3xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">{t.profile.empty}</p>
            <Link href="/submit" className={buttonVariants()}>
              {t.profile.firstSubmission}
            </Link>
          </div>
        ) : (
          <ol className="divide-y rounded-3xl border">
            {history.map((transaction) => (
              <li key={transaction.id} className="flex items-start gap-4 px-4 py-4 sm:px-6">
                <ScoreBadge points={transaction.amount} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.profile.transactionTypes[transaction.type]}</p>
                  <p className="truncate">
                    <Link
                      href={`/search?q=${transaction.acronym}`}
                      className="font-mono font-semibold tracking-wider underline-offset-4 outline-none hover:underline focus-visible:underline"
                    >
                      {transaction.acronym}
                    </Link>{" "}
                    — {transaction.meaning}
                  </p>
                </div>
                <time
                  dateTime={transaction.createdAt.toISOString()}
                  className="shrink-0 text-right text-xs text-muted-foreground"
                >
                  {formatTimestamp(transaction.createdAt, locale)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
