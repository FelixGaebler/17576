import { getDb } from "@/src/prisma/db"
import { findAcronym } from "@/lib/glossary"
import { normalizeMeaning, submissionSchema, type Submission } from "@/lib/validation"

export const POINTS = {
  NEW_ACRONYM: 5,
  EXISTING_ENTRY: 1,
  DUPLICATE_FOUND: 10,
  ALREADY_SUBMITTED: 0,
} as const

export type SubmissionOutcome = keyof typeof POINTS

export type ScoreTransactionType = Exclude<SubmissionOutcome, "ALREADY_SUBMITTED">

export type SubmissionResult = {
  outcome: SubmissionOutcome
  awardedPoints: number
  acronym: string
  meaning: string
  glossaryEntry: Awaited<ReturnType<typeof findAcronym>>
}

/**
 * Classifies a submission, records it and awards the points. The server is the
 * only place that decides the outcome; callers pass nothing but the raw input.
 * `submittedAt` is only overridden by the seed script to backdate history.
 */
export async function submitAcronym(
  userId: number,
  input: Submission,
  submittedAt = new Date(),
): Promise<SubmissionResult> {
  const submission = submissionSchema.parse(input)

  let outcome: SubmissionOutcome
  try {
    outcome = await recordSubmission(userId, submission, submittedAt)
  } catch (error) {
    // Two concurrent requests can both pass the checks before either commits.
    // The unique constraints reject the second one; retrying classifies it
    // again against the committed data (e.g. as ALREADY_SUBMITTED).
    if (!isUniqueViolation(error)) throw error
    outcome = await recordSubmission(userId, submission, submittedAt)
  }

  return {
    outcome,
    awardedPoints: POINTS[outcome],
    acronym: submission.acronym,
    meaning: submission.meaning,
    glossaryEntry: await findAcronym(submission.acronym),
  }
}

function recordSubmission(
  userId: number,
  { acronym: code, meaning: text }: Submission,
  submittedAt: Date,
) {
  const normalizedText = normalizeMeaning(text)
  const createdAt = Temporal.Instant.fromEpochMilliseconds(submittedAt.getTime())

  return getDb().transaction(async (tx): Promise<SubmissionOutcome> => {
    const existingAcronym = await tx.orm.public.Acronym.where({ code }).first()

    if (existingAcronym) {
      const hasUserSubmittedAcronym =
        (await tx.orm.public.ScoreTransaction.where({
          userId,
          acronymId: existingAcronym.id,
        }).first()) !== null

      if (hasUserSubmittedAcronym) return "ALREADY_SUBMITTED"
    }

    const existingMeaning = existingAcronym
      ? await tx.orm.public.Meaning.where({
        acronymId: existingAcronym.id,
        normalizedText,
      }).first()
      : null

    let type: ScoreTransactionType
    if (!existingAcronym) type = "NEW_ACRONYM"
    else if (existingMeaning) type = "EXISTING_ENTRY"
    else type = "DUPLICATE_FOUND"

    const acronym =
      existingAcronym ??
      (await tx.orm.public.Acronym.create({ code, createdByUserId: userId, createdAt }))

    const meaning =
      existingMeaning ??
      (await tx.orm.public.Meaning.create({
        acronymId: acronym.id,
        text,
        normalizedText,
        createdByUserId: userId,
        createdAt,
      }))

    const amount = POINTS[type]

    await tx.orm.public.ScoreTransaction.create({
      userId,
      acronymId: acronym.id,
      meaningId: meaning.id,
      amount,
      type,
      createdAt,
    })

    // Increment in SQL so concurrent submissions by the same user can't overwrite each other.
    await tx.execute(
      tx.sql.public.user
        .update((user, fns) => ({
          score: fns.raw`${user.score} + ${amount}`.returns("pg/int4@1"),
        }))
        .where((user, fns) => fns.eq(user.id, userId))
        .build(),
    )

    return type
  })
}

function isUniqueViolation(error: unknown) {
  return error instanceof Error && "sqlState" in error && error.sqlState === "23505"
}

/** All users, best first. Ties are broken by name and id so the order is stable. */
export async function getLeaderboard() {
  const users = await getDb()
    .orm.public.User.select("id", "displayName", "avatarUrl", "score")
    .orderBy([(u) => u.score.desc(), (u) => u.displayName.asc(), (u) => u.id.asc()])
    .all()

  return users.map((user, index) => ({ ...user, rank: index + 1 }))
}

export async function getScoreHistory(userId: number) {
  const transactions = await getDb()
    .orm.public.ScoreTransaction.where({ userId })
    .include("acronym", (acronym) => acronym.select("code"))
    .include("meaning", (meaning) => meaning.select("text"))
    .orderBy([(t) => t.createdAt.desc(), (t) => t.id.desc()])
    .all()

  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    acronym: transaction.acronym.code,
    meaning: transaction.meaning.text,
    createdAt: new Date(transaction.createdAt.epochMilliseconds),
  }))
}
