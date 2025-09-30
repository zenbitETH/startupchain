import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const privyToken =
      request.cookies.get('privy-token') || request.cookies.get('privy-session')

    if (!privyToken) {
      const returnUrl = encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      )
      return NextResponse.redirect(
        new URL(`/?returnUrl=${returnUrl}`, request.url)
      )
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
