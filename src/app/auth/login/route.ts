import { NextResponse, type NextRequest } from "next/server"

import { cookieOptions, createLoginRequest, isOidcEnabled, LOGIN_COOKIE, LOGIN_MAX_AGE } from "@/lib/oidc"
import { seal } from "@/lib/session"

export async function GET(request: NextRequest) {
  if (!isOidcEnabled()) return NextResponse.redirect(new URL("/", request.url))

  const { authorizationUrl, login } = await createLoginRequest(request.nextUrl.searchParams.get("returnTo"))

  const response = NextResponse.redirect(authorizationUrl)
  response.cookies.set(LOGIN_COOKIE, await seal(login, LOGIN_MAX_AGE), cookieOptions("/auth", LOGIN_MAX_AGE))
  return response
}
