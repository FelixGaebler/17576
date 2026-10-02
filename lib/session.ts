import { EncryptJWT, jwtDecrypt, type JWTPayload } from "jose"

export const SESSION_COOKIE = "session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

let cachedKey: Promise<Uint8Array> | undefined

/** 256-bit AES key derived from SESSION_SECRET. */
function getKey() {
  cachedKey ??= (async () => {
    const secret = process.env.SESSION_SECRET
    if (!secret || secret.length < 32) {
      throw new Error("SESSION_SECRET must be set to at least 32 characters when OIDC is enabled.")
    }
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))
    return new Uint8Array(digest)
  })()
  return cachedKey
}

/** Encrypts a payload into a compact JWE, used as cookie value. */
export async function seal(payload: JWTPayload, maxAgeSeconds: number) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(await getKey())
}

/** Returns the payload, or null if the value is missing, tampered with or expired. */
export async function unseal<T extends JWTPayload>(value: string | undefined): Promise<T | null> {
  if (!value) return null
  try {
    const { payload } = await jwtDecrypt<T>(value, await getKey())
    return payload
  } catch {
    return null
  }
}

export type Session = { userId: string }
