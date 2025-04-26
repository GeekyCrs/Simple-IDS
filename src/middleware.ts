
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is now simplified as client-side AuthContext handles most auth checks.
// We only need basic structural redirects here, like handling the root path
// if the client-side redirect hasn't kicked in yet.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for path: ${pathname}`);

  // Redirect root path to login page by default if no client-side auth redirects yet.
  // The client-side AuthProvider will later redirect authenticated users to their dashboard.
  if (pathname === '/') {
    console.log('[Middleware] Request for root path, redirecting to /login as initial default.');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow all other requests to proceed. Client-side checks will handle app/* routes.
  console.log(`[Middleware] Allowing request for ${pathname} to proceed.`);
  return NextResponse.next();
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - protect these separately if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (static image assets)
     * - fonts/ (static font assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
    // Include the root path explicitly
    '/'
  ],
};
