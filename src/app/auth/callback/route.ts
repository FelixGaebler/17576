import { NextResponse, type NextRequest } from "next/server"

import { upsertOidcUser } from "@/lib/auth"
import { appUrl, completeLogin, cookieOptions, LOGIN_COOKIE, type LoginState } from "@/lib/oidc"
import { seal, SESSION_COOKIE, SESSION_MAX_AGE, unseal, type Session } from "@/lib/session"

export async function GET(request: NextRequest) {
  const login = await unseal<LoginState>(request.cookies.get(LOGIN_COOKIE)?.value)
  // Expired or missing login state, e.g. the login page was open for too long.
  if (!login) return NextResponse.redirect(appUrl("/auth/login"))

  // Behind a reverse proxy request.url is the internal address; the provider knows the public one.
  const callbackUrl = appUrl(request.nextUrl.pathname + request.nextUrl.search)

  let session: Session
  try {
    const claims = await completeLogin(callbackUrl, login)
    session = { userId: await upsertOidcUser(claims) }
  } catch (error) {
    console.error("OIDC login failed", error)
    return new NextResponse("Sign-in failed. Please try again.", { status: 401 })
  }

  const response = NextResponse.redirect(appUrl(login.returnTo))
  response.cookies.set(SESSION_COOKIE, await seal(session, SESSION_MAX_AGE), cookieOptions("/", SESSION_MAX_AGE))
  response.cookies.delete({ name: LOGIN_COOKIE, path: "/auth" })
  return response
}
