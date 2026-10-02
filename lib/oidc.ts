import * as client from "openid-client"

export const LOGIN_COOKIE = "oidc-login"
export const LOGIN_MAX_AGE = 60 * 10

export type LoginState = {
  state: string
  nonce: string
  codeVerifier: string
  returnTo: string
}

export function isOidcEnabled() {
  return Boolean(process.env.OIDC_ISSUER)
}

/** Whether the ID token lists the admin group in its `groups` claim (Authentik, Keycloak group mapper). */
export function isAdminGroupMember(claims: Record<string, unknown>) {
  const adminGroup = process.env.OIDC_ADMIN_GROUP || "twentysix_admin"
  const groups = claims.groups
  if (!Array.isArray(groups)) return false
  // Keycloak sends full group paths ("/twentysix_admin") unless "Full group path" is turned off.
  return groups.some((group) => typeof group === "string" && group.replace(/^\//, "") === adminGroup)
}

function getSettings() {
  const issuer = process.env.OIDC_ISSUER
  const clientId = process.env.OIDC_CLIENT_ID
  const appUrl = process.env.APP_URL
  if (!issuer || !clientId || !appUrl) {
    throw new Error("OIDC needs OIDC_ISSUER, OIDC_CLIENT_ID and APP_URL.")
  }

  return {
    issuer: new URL(issuer),
    clientId,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    scope: process.env.OIDC_SCOPES ?? "openid profile email",
    appUrl: new URL(appUrl),
  }
}

let cachedConfig: Promise<client.Configuration> | undefined

/** Provider metadata from the issuer's discovery document, fetched once per process. */
export function getOidcConfig() {
  cachedConfig ??= (async () => {
    const { issuer, clientId, clientSecret } = getSettings()
    return client.discovery(
      issuer,
      clientId,
      clientSecret,
      // Without a secret the app acts as a public client and relies on PKCE alone.
      clientSecret ? undefined : client.None(),
      // Allows plain-HTTP issuers such as a local Keycloak during development.
      issuer.protocol === "http:" ? { execute: [client.allowInsecureRequests] } : undefined,
    )
  })().catch((error) => {
    cachedConfig = undefined
    throw error
  })
  return cachedConfig
}

export function appUrl(path: string) {
  return new URL(path, getSettings().appUrl)
}

export function cookieOptions(path: string, maxAge: number) {
  return {
    httpOnly: true,
    secure: getSettings().appUrl.protocol === "https:",
    // "lax" keeps the cookie on the top-level redirect back from the identity provider.
    sameSite: "lax" as const,
    path,
    maxAge,
  }
}

/** Only same-origin paths, so the login flow cannot be abused as an open redirect. */
export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/"
  return value
}

export async function createLoginRequest(returnTo: string | null) {
  const config = await getOidcConfig()
  const login: LoginState = {
    state: client.randomState(),
    nonce: client.randomNonce(),
    codeVerifier: client.randomPKCECodeVerifier(),
    returnTo: safeReturnTo(returnTo),
  }

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: appUrl("/auth/callback").href,
    scope: getSettings().scope,
    code_challenge: await client.calculatePKCECodeChallenge(login.codeVerifier),
    code_challenge_method: "S256",
    state: login.state,
    nonce: login.nonce,
  })

  return { authorizationUrl, login }
}

/** Exchanges the authorization code and returns the validated ID token claims. */
export async function completeLogin(callbackUrl: URL, login: LoginState) {
  const config = await getOidcConfig()
  const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: login.codeVerifier,
    expectedState: login.state,
    expectedNonce: login.nonce,
    idTokenExpected: true,
  })

  const claims = tokens.claims()
  if (!claims) throw new Error("The identity provider returned no ID token.")
  return claims
}

/** Where to send the browser after signing out; the provider's logout page if it has one. */
export async function getLogoutUrl() {
  const config = await getOidcConfig()
  if (!config.serverMetadata().end_session_endpoint) return appUrl("/")

  return client.buildEndSessionUrl(config, {
    client_id: getSettings().clientId,
    post_logout_redirect_uri: appUrl("/").href,
  })
}
