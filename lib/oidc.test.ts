import { describe, expect, test } from "bun:test"

import { safeReturnTo } from "./oidc"
import { seal, unseal } from "./session"

process.env.SESSION_SECRET ??= "test-secret-that-is-at-least-32-characters"

describe("safeReturnTo", () => {
  test.each(["/", "/profile", "/search?q=ABC"])("keeps the local path %p", (path) => {
    expect(safeReturnTo(path)).toBe(path)
  })

  test.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "profile"])(
    "falls back to / for %p",
    (path) => {
      expect(safeReturnTo(path)).toBe("/")
    },
  )
})

describe("session cookies", () => {
  test("round-trip the payload", async () => {
    expect(await unseal<{ userId: number }>(await seal({ userId: 42 }, 60))).toMatchObject({ userId: 42 })
  })

  test("reject tampered values", async () => {
    const value = await seal({ userId: 42 }, 60)
    expect(await unseal(value.slice(0, -2) + "xx")).toBeNull()
  })

  test("reject expired values", async () => {
    expect(await unseal(await seal({ userId: 42 }, -10))).toBeNull()
  })

  test("reject a missing value", async () => {
    expect(await unseal(undefined)).toBeNull()
  })
})
