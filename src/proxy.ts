import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/server-session'

export default async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const session = await getServerSession(request)
  if (!session) {
    const returnUrl = encodeURIComponent(
      request.nextUrl.pathname + request.nextUrl.search
    )
    return NextResponse.redirect(
      new URL(`/?returnUrl=${returnUrl}`, request.url)
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
