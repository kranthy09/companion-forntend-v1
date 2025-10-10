// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/notes', '/tasks', '/profile', '/settings']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const hasAccessToken = request.cookies.has('access_token')

    // Protect routes requiring authentication
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        if (!hasAccessToken) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    // Redirect authenticated users away from auth pages
    if (hasAccessToken && pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}