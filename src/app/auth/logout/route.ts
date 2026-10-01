import { NextResponse, type NextRequest } from "next/server"

import { getLogoutUrl, isOidcEnabled } from "@/lib/oidc"
import { SESSION_COOKIE } from "@/lib/session"

export async function POST(request: NextRequest) {
  const target = isOidcEnabled() ? await getLogoutUrl() : new URL("/", request.url)

  // 303 turns the POST into a GET on the target.
  const response = NextResponse.redirect(target, 303)
  response.cookies.delete(SESSION_COOKIE)
  return response
}
