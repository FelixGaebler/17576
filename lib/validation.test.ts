import { describe, expect, test } from "bun:test"

import { getUppercaseLetters, normalizeMeaning, submissionSchema, validateSubmission } from "./validation"

describe("validateSubmission", () => {
  test.each([
    ["AOF", "Apple Often Fails"],
    ["AOF", "Allocation and Offer Force"],
    ["ABC", "Alpha Beta Charlie"],
    ["ABC", "Alpha  Beta   Charlie"],
    ["POS", "Point Of Sale"],
    ["abc", "  Alpha Beta Charlie  "],
  ])("%s / %s is valid", (acronym, meaning) => {
    expect(validateSubmission({ acronym, meaning }).success).toBe(true)
  })

  test.each([
    ["AOF", "Apple Offers"],
    ["ABC", "alpha beta charlie"],
    ["POS", "Point of Sale"],
    ["AOF", "Allocation And Offer Force"],
  ])("%s / %s is invalid because its uppercase letters don't spell the acronym", (acronym, meaning) => {
    expect(validateSubmission({ acronym, meaning })).toEqual({
      success: false,
      errors: { meaning: "initialsMismatch" },
    })
  })

  test("reports the uppercase letters actually found", () => {
    expect(getUppercaseLetters("Allocation and   Offer Force")).toBe("AOF")
    expect(getUppercaseLetters("apple offers")).toBe("")
  })

  test.each(["AB1", "ABCD", "AB", "A C", "ÄBC", ""])("rejects the acronym %p", (acronym) => {
    const result = validateSubmission({ acronym, meaning: "Alpha Beta Charlie" })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.acronym).toBe("acronymInvalid")
  })

  test("rejects an empty meaning", () => {
    expect(validateSubmission({ acronym: "ABC", meaning: "   " })).toEqual({
      success: false,
      errors: { meaning: "meaningRequired" },
    })
  })

  test("rejects non-string input", () => {
    expect(validateSubmission({ acronym: null, meaning: 42 })).toEqual({
      success: false,
      errors: { acronym: "acronymInvalid", meaning: "meaningRequired" },
    })
  })

  test("normalizes the acronym and tidies whitespace in the meaning", () => {
    expect(submissionSchema.parse({ acronym: " abc ", meaning: "  Alpha   Beta Charlie " })).toEqual({
      acronym: "ABC",
      meaning: "Alpha Beta Charlie",
    })
  })

  test("drops fields the client is not allowed to send", () => {
    const parsed = submissionSchema.parse({
      acronym: "ABC",
      meaning: "Alpha Beta Charlie",
      points: 1000,
      type: "DUPLICATE_FOUND",
    })
    expect(parsed).toEqual({ acronym: "ABC", meaning: "Alpha Beta Charlie" })
  })
})

describe("normalizeMeaning", () => {
  test("treats case and whitespace differences as the same meaning", () => {
    expect(normalizeMeaning("  apple   often fails")).toBe(normalizeMeaning("Apple Often Fails"))
  })

  test.each(["Promo Item Pool", "Promo-Item Pool", "Promo_Item  Pool", "PromoItem Pool", "Promo-Item Pool."])(
    "treats %p as the same meaning as Promo Item Pool",
    (meaning) => {
      expect(normalizeMeaning(meaning)).toBe(normalizeMeaning("Promo Item Pool"))
    },
  )

  test("keeps different meanings apart", () => {
    expect(normalizeMeaning("Apple Often Fails")).not.toBe(normalizeMeaning("Apple Often Fail"))
  })
})
