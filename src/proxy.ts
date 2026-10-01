import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, unseal } from "@/lib/session"

// Optimistic check only: redirects visitors without a valid session to the login.
// getCurrentUser() still verifies the user on every request.
export async function proxy(request: NextRequest) {
  if (!process.env.OIDC_ISSUER) return NextResponse.next()
  if (await unseal(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()

  const login = new URL("/auth/login", process.env.APP_URL ?? request.url)
  login.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/((?!auth/|_next/|icon\\.svg|favicon\\.ico).*)"],
}
