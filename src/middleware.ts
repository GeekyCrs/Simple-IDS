
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is now simplified as client-side AuthContext handles most auth checks.
// We only need basic structural redirects here, like handling the root path
// and ensuring basic role access if the client-side check hasn't completed.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for path: ${pathname}`);

  // --- Path Prefixes for Route Groups ---
  const managerPath = '/manager';
  const chefPath = '/chef';
  // Client paths are assumed to be directly under the root (e.g., /dashboard, /menu)
  // or handled by the default case.

  // --- Redirect root path ---
  // If the request is for the absolute root '/', redirect to /login.
  // The AuthContext will handle redirecting authenticated users later.
  if (pathname === '/') {
    console.log('[Middleware] Request for root path /, redirecting to /login.');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- Basic Role Checks (Optional Layer of Defense) ---
  // Although AuthContext handles detailed checks, we can add basic middleware
  // checks as an extra layer. This requires getting the user's role, typically
  // from a cookie or token, which is NOT implemented here.
  // If you implement server-side session/token reading, uncomment and adapt:

  /*
  const getUserRoleFromRequest = (req: NextRequest): string | null => {
    // Implement logic to read role from session cookie or token
    // Example: const session = await getIronSession(req, sessionOptions); return session.user?.role;
    return null; // Placeholder
  };

  const userRole = getUserRoleFromRequest(request);

  if (userRole) { // If user role is available
    // Redirect manager trying to access chef-only areas (if any)
    // Redirect chef trying to access manager-only areas
    if (pathname.startsWith(managerPath) && userRole !== 'manager') {
       console.warn(`[Middleware] Non-manager role (${userRole}) attempting manager path: ${pathname}. Redirecting.`);
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    // Chef access: Allow manager too
    if (pathname.startsWith(chefPath) && !['chef', 'manager'].includes(userRole)) {
       console.warn(`[Middleware] Non-chef/manager role (${userRole}) attempting chef path: ${pathname}. Redirecting.`);
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    // Client path checks (if needed)
    // Example: if (pathname === '/dashboard' && !['client', 'chef', 'manager'].includes(userRole)) {...}
  } else { // If no role info (likely unauthenticated)
    // Redirect unauthenticated users trying to access protected areas
    const isAuthPage = ['/login', '/signup', '/forgot-password'].some(p => pathname.startsWith(p));
    const isPublicPage = ['/unauthorized'].some(p => pathname.startsWith(p));
    if (!isAuthPage && !isPublicPage) {
       console.log(`[Middleware] Unauthenticated access to protected path ${pathname}. Redirecting to /login.`);
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  */

  // If none of the above conditions caused a redirect, allow the request.
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
    // Include the root path explicitly if you want middleware to run on it
     '/',
  ],
};
