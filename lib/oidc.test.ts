import { describe, expect, test } from "bun:test"

import { isAdminGroupMember, safeReturnTo } from "./oidc"
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

describe("isAdminGroupMember", () => {
  test.each([["twentysix_admin"], ["users", "/twentysix_admin"]])("accepts the groups %p", (...groups) => {
    expect(isAdminGroupMember({ groups })).toBe(true)
  })

  test.each([{}, { groups: "twentysix_admin" }, { groups: ["users"] }, { groups: ["/parent/twentysix_admin"] }])(
    "rejects the claims %p",
    (claims) => {
      expect(isAdminGroupMember(claims)).toBe(false)
    },
  )
})

describe("session cookies", () => {
  test("round-trip the payload", async () => {
    const userId = crypto.randomUUID()
    expect(await unseal<{ userId: string }>(await seal({ userId }, 60))).toMatchObject({ userId })
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
