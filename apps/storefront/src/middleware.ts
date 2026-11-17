import { NextRequest, NextResponse } from "next/server"

/**
 * Garb sells in Canada only, so public URLs have no country prefix:
 * "/women" is served by the "/ca/women" route. Old or internal "/ca/..."
 * links redirect to the clean URL.
 */
const COUNTRY = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "ca").toLowerCase()

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === `/${COUNTRY}` || pathname.startsWith(`/${COUNTRY}/`)) {
    // Server actions post to the current URL; don't redirect those.
    if (request.method !== "GET" && request.method !== "HEAD") {
      return NextResponse.next()
    }
    const clean = pathname.slice(COUNTRY.length + 1) || "/"
    return NextResponse.redirect(new URL(`${clean}${search}`, request.url), 308)
  }

  const response = NextResponse.rewrite(new URL(`/${COUNTRY}${pathname === "/" ? "" : pathname}${search}`, request.url))
  if (!request.cookies.get("_medusa_cache_id")) {
    response.cookies.set("_medusa_cache_id", crypto.randomUUID(), { maxAge: 60 * 60 * 24 })
  }
  return response
}

export const config = {
  matcher: [
    "/((?!api|ucp|buy|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|llms.txt|opengraph-image|twitter-image|\\.well-known|images|assets|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|txt|xml|md)$).*)",
  ],
}
