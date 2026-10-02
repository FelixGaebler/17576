import { afterAll, beforeEach, describe, expect, test } from "bun:test"

import { getDb } from "@/src/prisma/db"
import { getGlossaryProgress } from "./glossary"
import { invalidateMeaning, submitAcronym } from "./scoring"
import type { Submission } from "./validation"

// These tests write to a real database and wipe it before every test, so they
// only run against an explicitly configured TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl

describe.skipIf(!testDatabaseUrl)("submitAcronym", () => {
  const db = getDb()
  let felix: string
  let anna: string

  beforeEach(async () => {
    await db.orm.public.ScoreTransaction.where((t) => t.id.isNotNull()).deleteAndCount()
    await db.orm.public.Meaning.where((m) => m.id.isNotNull()).deleteAndCount()
    await db.orm.public.Acronym.where((a) => a.id.isNotNull()).deleteAndCount()
    await db.orm.public.User.where((u) => u.id.isNotNull()).deleteAndCount()

    felix = await createUser("felix")
    anna = await createUser("anna")
  })

  afterAll(() => db.close())

  async function createUser(name: string) {
    const user = await db.orm.public.User.create({
      externalId: `test-${name}`,
      displayName: name,
      email: `${name}@example.com`,
    })
    return user.id
  }

  async function scoreOf(userId: string) {
    const user = await db.orm.public.User.where({ id: userId }).first()
    return user?.score
  }

  async function countRows() {
    const [acronyms, meanings, transactions] = await Promise.all([
      db.orm.public.Acronym.aggregate((a) => ({ count: a.count() })),
      db.orm.public.Meaning.aggregate((a) => ({ count: a.count() })),
      db.orm.public.ScoreTransaction.aggregate((a) => ({ count: a.count() })),
    ])
    return { acronyms: acronyms.count, meanings: meanings.count, transactions: transactions.count }
  }

  /** The cached user score must always equal the sum of the user's transactions. */
  async function expectScoreMatchesTransactions(userId: string) {
    const { total } = await db.orm.public.ScoreTransaction.where({ userId }).aggregate((a) => ({
      total: a.sum("amount"),
    }))
    expect(await scoreOf(userId)).toBe(total ?? 0)
  }

  test("an unknown acronym is a NEW_ACRONYM worth 5 points", async () => {
    const result = await submitAcronym(felix, { acronym: "XYZ", meaning: "Xylophone Yield Zone" })

    expect(result.outcome).toBe("NEW_ACRONYM")
    expect(result.awardedPoints).toBe(5)
    expect(result.glossaryEntry?.meanings.map((m) => m.text)).toEqual(["Xylophone Yield Zone"])
    expect(await countRows()).toEqual({ acronyms: 1, meanings: 1, transactions: 1 })
    expect(await scoreOf(felix)).toBe(5)
  })

  test("a new acronym increases the global progress", async () => {
    const before = await getGlossaryProgress()
    await submitAcronym(felix, { acronym: "XYZ", meaning: "Xylophone Yield Zone" })
    const after = await getGlossaryProgress()

    expect(after.discovered).toBe(before.discovered + 1)
    expect(after.remaining).toBe(before.remaining - 1)
  })

  test("a known acronym and normalized meaning is an EXISTING_ENTRY worth 1 point", async () => {
    await submitAcronym(anna, { acronym: "POS", meaning: "Point Of Sale" })
    const progressBefore = await getGlossaryProgress()

    const result = await submitAcronym(felix, { acronym: "pos", meaning: "  Point   Of   Sale " })

    expect(result.outcome).toBe("EXISTING_ENTRY")
    expect(result.awardedPoints).toBe(1)
    expect(await countRows()).toEqual({ acronyms: 1, meanings: 1, transactions: 2 })
    expect(await scoreOf(felix)).toBe(1)
    expect((await getGlossaryProgress()).discovered).toBe(progressBefore.discovered)

    const meaning = await db.orm.public.Meaning.first()
    const transaction = await db.orm.public.ScoreTransaction.where({ userId: felix }).first()
    expect(meaning?.text).toBe("Point Of Sale")
    expect(transaction?.meaningId).toBe(meaning?.id)
  })

  test("a known acronym with a new meaning is a DUPLICATE_FOUND worth 10 points", async () => {
    await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
    const progressBefore = await getGlossaryProgress()

    const result = await submitAcronym(felix, { acronym: "ABC", meaning: "Automated Booking Component" })

    expect(result.outcome).toBe("DUPLICATE_FOUND")
    expect(result.awardedPoints).toBe(10)
    expect(result.glossaryEntry?.meanings.map((m) => m.text)).toEqual([
      "Application Business Controller",
      "Automated Booking Component",
    ])
    expect(await countRows()).toEqual({ acronyms: 1, meanings: 2, transactions: 2 })
    expect(await scoreOf(felix)).toBe(10)

    const progressAfter = await getGlossaryProgress()
    expect(progressAfter.discovered).toBe(progressBefore.discovered)
    expect(progressAfter.meanings).toBe(progressBefore.meanings + 1)
    expect(progressAfter.duplicates).toBe(1)
  })

  test("a user can score each meaning only once", async () => {
    await submitAcronym(felix, { acronym: "ABC", meaning: "Application Business Controller" })

    const sameMeaning = await submitAcronym(felix, { acronym: "abc", meaning: "Application  Business  Controller" })
    const newMeaning = await submitAcronym(felix, { acronym: "ABC", meaning: "Automated Booking Component" })

    expect(sameMeaning).toMatchObject({ outcome: "ALREADY_SUBMITTED", awardedPoints: 0 })
    expect(newMeaning).toMatchObject({ outcome: "DUPLICATE_FOUND", awardedPoints: 10 })
    expect(await countRows()).toEqual({ acronyms: 1, meanings: 2, transactions: 2 })
    expect(await scoreOf(felix)).toBe(15)

    const otherUser = await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
    expect(otherUser.outcome).toBe("EXISTING_ENTRY")
  })

  test("invalid input cannot generate points", async () => {
    const invalid: Submission[] = [
      { acronym: "AOF", meaning: "Apple Offers" },
      { acronym: "AB1", meaning: "Alpha Beta One" },
      { acronym: "ABCD", meaning: "Alpha Beta Charlie Delta" },
    ]

    for (const submission of invalid) {
      await expect(submitAcronym(felix, submission)).rejects.toThrow()
    }
    expect(await countRows()).toEqual({ acronyms: 0, meanings: 0, transactions: 0 })
    expect(await scoreOf(felix)).toBe(0)
  })

  test("the client cannot choose the awarded points", async () => {
    const tampered = { acronym: "XYZ", meaning: "Xylophone Yield Zone", points: 1000, type: "DUPLICATE_FOUND" }

    const result = await submitAcronym(felix, tampered)

    expect(result).toMatchObject({ outcome: "NEW_ACRONYM", awardedPoints: 5 })
    expect(await scoreOf(felix)).toBe(5)
  })

  test("the score and the transaction history always agree", async () => {
    await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
    await submitAcronym(felix, { acronym: "ABC", meaning: "Automated Booking Component" })
    await submitAcronym(felix, { acronym: "POS", meaning: "Point Of Sale" })
    await submitAcronym(anna, { acronym: "POS", meaning: "Point Of Sale" })
    await submitAcronym(anna, { acronym: "POS", meaning: "Purchase Order System" })

    expect(await scoreOf(felix)).toBe(15)
    expect(await scoreOf(anna)).toBe(16)
    await expectScoreMatchesTransactions(felix)
    await expectScoreMatchesTransactions(anna)
  })

  describe("invalidateMeaning", () => {
    async function meaningId(text: string) {
      const meaning = await db.orm.public.Meaning.where({ text }).first()
      if (!meaning) throw new Error(`Expected meaning ${text}`)
      return meaning.id
    }

    test("deletes the meaning and takes back everybody's points", async () => {
      await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
      await submitAcronym(felix, { acronym: "ABC", meaning: "Automated Booking Component" })
      await submitAcronym(anna, { acronym: "ABC", meaning: "Automated Booking Component" })

      expect(await invalidateMeaning(await meaningId("Automated Booking Component"))).toBe(true)

      expect(await scoreOf(felix)).toBe(0)
      expect(await scoreOf(anna)).toBe(5)
      await expectScoreMatchesTransactions(felix)
      await expectScoreMatchesTransactions(anna)
      // Both original transactions stay in the history, each with a negative counterpart.
      expect(await countRows()).toEqual({ acronyms: 1, meanings: 1, transactions: 5 })
      expect((await getGlossaryProgress()).duplicates).toBe(0)
    })

    test("deletes the acronym with its last meaning", async () => {
      await submitAcronym(felix, { acronym: "XYZ", meaning: "Xylophone Yield Zone" })

      await invalidateMeaning(await meaningId("Xylophone Yield Zone"))

      expect(await countRows()).toEqual({ acronyms: 0, meanings: 0, transactions: 2 })
      expect(await scoreOf(felix)).toBe(0)
    })

    test("an invalidated meaning can't be submitted again", async () => {
      await submitAcronym(felix, { acronym: "XYZ", meaning: "Xylophone Yield Zone" })
      await invalidateMeaning(await meaningId("Xylophone Yield Zone"))

      const again = await submitAcronym(felix, { acronym: "xyz", meaning: "  Xylophone  Yield Zone" })
      const otherUser = await submitAcronym(anna, { acronym: "XYZ", meaning: "Xylophone Yield Zone" })
      const otherMeaning = await submitAcronym(anna, { acronym: "XYZ", meaning: "Xenon Yellow Zinc" })

      expect(again).toMatchObject({ outcome: "INVALIDATED_MEANING", awardedPoints: 0 })
      expect(otherUser).toMatchObject({ outcome: "INVALIDATED_MEANING", awardedPoints: 0 })
      expect(otherMeaning.outcome).toBe("NEW_ACRONYM")
      expect(await scoreOf(felix)).toBe(0)
    })

    test("returns false for an unknown meaning", async () => {
      expect(await invalidateMeaning(crypto.randomUUID())).toBe(false)
    })
  })

  describe("database constraints", () => {
    test("acronym codes are unique", async () => {
      await db.orm.public.Acronym.create({ code: "ABC", createdByUserId: felix })
      await expect(db.orm.public.Acronym.create({ code: "ABC", createdByUserId: anna })).rejects.toThrow()
    })

    test("acronym codes must be three uppercase letters", async () => {
      await expect(db.orm.public.Acronym.create({ code: "abc", createdByUserId: felix })).rejects.toThrow()
    })

    test("normalized meanings are unique per acronym", async () => {
      const acronym = await db.orm.public.Acronym.create({ code: "ABC", createdByUserId: felix })
      const meaning = { acronymId: acronym.id, normalizedText: "alpha beta charlie", createdByUserId: felix }

      await db.orm.public.Meaning.create({ ...meaning, text: "Alpha Beta Charlie" })
      await expect(db.orm.public.Meaning.create({ ...meaning, text: "alpha beta charlie" })).rejects.toThrow()
    })

    test("a user has at most one transaction per meaning", async () => {
      await submitAcronym(felix, { acronym: "ABC", meaning: "Alpha Beta Charlie" })
      const transaction = await db.orm.public.ScoreTransaction.first()
      if (!transaction) throw new Error("Expected a score transaction")

      await expect(
        db.orm.public.ScoreTransaction.create({
          userId: felix,
          acronymId: transaction.acronymId,
          meaningId: transaction.meaningId,
          amount: 5,
          type: "NEW_ACRONYM",
        }),
      ).rejects.toThrow()
    })
  })

  describe("concurrent requests", () => {
    test("a double submit awards the points only once", async () => {
      const submission = { acronym: "XYZ", meaning: "Xylophone Yield Zone" }

      const results = await Promise.all([submitAcronym(felix, submission), submitAcronym(felix, submission)])

      expect(results.map((r) => r.outcome).sort()).toEqual(["ALREADY_SUBMITTED", "NEW_ACRONYM"])
      expect(await countRows()).toEqual({ acronyms: 1, meanings: 1, transactions: 1 })
      expect(await scoreOf(felix)).toBe(5)
    })

    test("two users discovering the same acronym create it only once", async () => {
      const submission = { acronym: "XYZ", meaning: "Xylophone Yield Zone" }

      const results = await Promise.all([submitAcronym(felix, submission), submitAcronym(anna, submission)])

      expect(results.map((r) => r.outcome).sort()).toEqual(["EXISTING_ENTRY", "NEW_ACRONYM"])
      expect(await countRows()).toEqual({ acronyms: 1, meanings: 1, transactions: 2 })
      await expectScoreMatchesTransactions(felix)
      await expectScoreMatchesTransactions(anna)
    })

    test("a rejected concurrent submission leaves no partial glossary records", async () => {
      await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
      const submission = { acronym: "ABC", meaning: "Automated Booking Component" }

      const results = await Promise.all([submitAcronym(felix, submission), submitAcronym(felix, submission)])

      expect(results.map((r) => r.outcome).sort()).toEqual(["ALREADY_SUBMITTED", "DUPLICATE_FOUND"])
      // The losing request had already inserted its meaning; it must have been rolled back.
      expect(await countRows()).toEqual({ acronyms: 1, meanings: 2, transactions: 2 })
      expect(await scoreOf(felix)).toBe(10)
    })

    test("two users adding the same new meaning create it only once", async () => {
      await submitAcronym(anna, { acronym: "ABC", meaning: "Application Business Controller" })
      const submission = { acronym: "ABC", meaning: "Automated Booking Component" }

      const results = await Promise.all([submitAcronym(felix, submission), submitAcronym(anna, submission)])

      expect(results.map((r) => r.outcome).sort()).toEqual(["DUPLICATE_FOUND", "EXISTING_ENTRY"])
      expect(await countRows()).toEqual({ acronyms: 1, meanings: 2, transactions: 3 })
      await expectScoreMatchesTransactions(felix)
      await expectScoreMatchesTransactions(anna)
    })
  })
})
