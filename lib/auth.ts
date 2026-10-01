import { cache } from "react"

import { getDb } from "@/src/prisma/db"

const DEVELOPMENT_USER = {
  externalId: "dev-user",
  displayName: "Felix Weber",
  email: "felix.weber@example.com",
}

/**
 * Returns the signed-in user. Until Keycloak is wired up this is always the
 * development user; replace this implementation, not its callers.
 */
export const getCurrentUser = cache(async () => {
  const users = getDb().orm.public.User.select("id", "displayName", "avatarUrl", "score")

  const user = await users.where({ externalId: DEVELOPMENT_USER.externalId }).first()
  return user ?? (await users.create(DEVELOPMENT_USER))
})
