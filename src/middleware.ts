import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token
  const token = request.cookies.get('hadirtadz_session')?.value;

  // Public routes that don't need auth
  const publicPaths = ['/login', '/register-school', '/api/auth/login', '/api/schools', '/scan'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // If no token and trying to access protected route, redirect to login
  if (!token && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|service-worker.js|assets/).*)'],
};
