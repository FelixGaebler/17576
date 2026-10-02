import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { IDToken } from "openid-client"

import { isOidcEnabled } from "@/lib/oidc"
import { SESSION_COOKIE, unseal, type Session } from "@/lib/session"
import { getDb } from "@/src/prisma/db"

const DEVELOPMENT_USER = {
  externalId: "dev-user",
  displayName: "Felix Weber",
  email: "felix.weber@example.com",
}

function users() {
  return getDb().orm.public.User.select("id", "displayName", "avatarUrl", "score")
}

/**
 * Returns the signed-in user. With OIDC configured this is the user from the
 * session cookie; without it, a fixed development user.
 */
export const getCurrentUser = cache(async () => {
  if (!isOidcEnabled()) return getDevelopmentUser()

  const session = await unseal<Session>((await cookies()).get(SESSION_COOKIE)?.value)
  // Cookies issued before the switch to UUIDs carry a numeric id; treat them as logged out.
  const user = typeof session?.userId === "string" && (await users().where({ id: session.userId }).first())
  if (!user) redirect("/auth/login")
  // Group membership is read at sign-in, so changes apply with the next login.
  return { ...user, isAdmin: session?.isAdmin === true }
})

async function getDevelopmentUser() {
  // Without OIDC everyone is the same user, so production has to opt in explicitly.
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_USER !== "true") {
    throw new Error("OIDC is not configured. Set OIDC_* (see README) or AUTH_DEV_USER=true for a demo.")
  }

  const user =
    (await users().where({ externalId: DEVELOPMENT_USER.externalId }).first()) ??
    (await users().create(DEVELOPMENT_USER))
  // Locally the development user can try the admin features; never in a production demo.
  return { ...user, isAdmin: process.env.NODE_ENV !== "production" }
}

function stringClaim(claims: IDToken, name: string) {
  const value = claims[name]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/** Creates or updates the user for a successful OIDC login and returns its id. */
export async function upsertOidcUser(claims: IDToken) {
  const email = stringClaim(claims, "email") ?? `${claims.sub}@users.invalid`
  const profile = {
    displayName:
      stringClaim(claims, "name") ?? stringClaim(claims, "preferred_username") ?? email.split("@")[0],
    email,
    avatarUrl: stringClaim(claims, "picture") ?? null,
  }

  const user = await getDb()
    .orm.public.User.select("id")
    .upsert({
      create: { externalId: claims.sub, ...profile },
      update: profile,
      conflictOn: { externalId: claims.sub },
    })
  return user.id
}
