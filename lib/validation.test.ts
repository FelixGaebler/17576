import { describe, expect, test } from "bun:test"

import { getInitials, normalizeMeaning, submissionSchema, validateSubmission } from "./validation"

describe("validateSubmission", () => {
  test.each([
    ["AOF", "Apple Often Fails"],
    ["ABC", "Alpha Beta Charlie"],
    ["ABC", "alpha beta charlie"],
    ["ABC", "Alpha  Beta   Charlie"],
    ["POS", "Point of Sale"],
    ["abc", "  Alpha Beta Charlie  "],
  ])("%s / %s is valid", (acronym, meaning) => {
    expect(validateSubmission({ acronym, meaning }).success).toBe(true)
  })

  test("rejects a meaning whose initials don't match", () => {
    expect(validateSubmission({ acronym: "AOF", meaning: "Apple Offers" })).toEqual({
      success: false,
      errors: { meaning: "initialsMismatch" },
    })
  })

  test("reports the initials actually found", () => {
    expect(getInitials("Apple   offers")).toBe("AO")
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

  test("keeps different meanings apart", () => {
    expect(normalizeMeaning("Apple Often Fails")).not.toBe(normalizeMeaning("Apple Often Fail"))
  })
})
