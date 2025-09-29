// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/']
const PROTECTED_ROUTES = ['/notes', '/tasks', '/profile']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('access_token')

    // Check protected routes
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    // Redirect authenticated users from auth pages
    if (PUBLIC_ROUTES.includes(pathname) && token && pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/notes', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}