
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Placeholder: Replace with actual session/token check logic (e.g., using Firebase Admin SDK)
async function isAuthenticated(request: NextRequest): Promise<{ authenticated: boolean; role: string | null }> {
  // Simulate checking for a session cookie or token
  const sessionToken = request.cookies.get('auth-session')?.value;
  console.log(`[Middleware] Checking cookie 'auth-session': ${sessionToken}`);

  if (!sessionToken) {
    return { authenticated: false, role: null };
  }

  // In a real app, verify the token server-side (e.g., using Firebase Admin SDK)
  // and fetch the user's role from your database based on the verified user ID.
  // Example simulation:
  try {
    // const decodedToken = await verifyToken(sessionToken); // Replace with actual verification
    // const userRole = await getUserRole(decodedToken.uid); // Replace with actual role fetching
    // For demo purposes, simulate role based on token value
    let role = 'client';
    if (sessionToken === 'chef-token') role = 'chef';
    if (sessionToken === 'manager-token') role = 'manager';

    // Assume token is valid if present for simulation
    console.log(`[Middleware] Simulated authentication successful. Role: ${role}`);
    return { authenticated: true, role: role };
  } catch (error) {
    console.error("[Middleware] Auth verification failed:", error);
    return { authenticated: false, role: null };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Checking path: ${pathname}`);

  const authInfo = await isAuthenticated(request);
  console.log(`[Middleware] Auth Info:`, authInfo);


  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
  const isApiRoute = pathname.startsWith('/api/'); // Exclude API routes explicitly if needed beyond matcher
  const isAppRoute = pathname.startsWith('/app'); // Checks if it's any route under /app

  // Allow API routes to pass through without auth checks here if necessary
  if (isApiRoute) {
      console.log(`[Middleware] Allowing API route: ${pathname}`);
      return NextResponse.next();
  }

  // If user is authenticated
  if (authInfo.authenticated) {
    console.log(`[Middleware] User is authenticated. Role: ${authInfo.role}`);

    // If trying to access auth pages while logged in, redirect to dashboard based on role
    if (isAuthPage) {
       let redirectPath = '/app/dashboard'; // Client dashboard
       if (authInfo.role === 'chef') redirectPath = '/app/chef/dashboard';
       if (authInfo.role === 'manager') redirectPath = '/app/manager/dashboard';
       console.log(`[Middleware] Authenticated user on auth page, redirecting to ${redirectPath}`);
       return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Role-based access control for specific sections within /app
    if (pathname.startsWith('/app/chef') && authInfo.role !== 'chef') {
      // Allow manager to access chef pages
      if (authInfo.role === 'manager') {
         console.log(`[Middleware] Manager accessing chef path: ${pathname}`);
         return NextResponse.next(); // Manager can access chef pages
      }
      console.warn(`[Middleware] Access denied for ${authInfo.role} to chef path: ${pathname}. Redirecting to /app/dashboard.`);
      return NextResponse.redirect(new URL('/app/dashboard', request.url)); // Redirect non-chefs/managers away
    }
    if (pathname.startsWith('/app/manager') && authInfo.role !== 'manager') {
      console.warn(`[Middleware] Access denied for ${authInfo.role} to manager path: ${pathname}. Redirecting to /app/dashboard.`);
      return NextResponse.redirect(new URL('/app/dashboard', request.url)); // Redirect non-managers away
    }

     // If accessing root path '/' while logged in, redirect to appropriate dashboard
     if (pathname === '/') {
        let redirectPath = '/app/dashboard';
        if (authInfo.role === 'chef') redirectPath = '/app/chef/dashboard';
        if (authInfo.role === 'manager') redirectPath = '/app/manager/dashboard';
        console.log(`[Middleware] Authenticated user on root path, redirecting to ${redirectPath}`);
        return NextResponse.redirect(new URL(redirectPath, request.url));
     }

    // Allow access to other app pages if authenticated and role conditions met
    console.log(`[Middleware] Allowing authenticated user access to: ${pathname}`);
    return NextResponse.next();
  }

  // If user is not authenticated
  if (!authInfo.authenticated) {
    console.log(`[Middleware] User is not authenticated.`);

    // If trying to access any /app route while not logged in, redirect to login
    if (isAppRoute) {
      console.log(`[Middleware] Unauthenticated access attempt to app page: ${pathname}. Redirecting to /login.`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

     // If accessing root path '/' while not logged in, redirect to login
     if (pathname === '/') {
         console.log(`[Middleware] Unauthenticated user on root path, redirecting to /login.`);
         return NextResponse.redirect(new URL('/login', request.url));
     }
  }

  // Allow access to auth pages (/login, /signup, /forgot-password) if not authenticated
  if (!authInfo.authenticated && isAuthPage) {
    console.log(`[Middleware] Allowing unauthenticated access to auth page: ${pathname}`);
    return NextResponse.next();
  }

  // Fallback just in case (should ideally not be reached with current logic)
  console.log(`[Middleware] Fallback: Allowing access to ${pathname}`);
  return NextResponse.next();
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes) - handled inside middleware logic now
     * - any other static assets (e.g., /images/, /fonts/)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|api/).*)',
     // Include the root path explicitly if not caught by the above
    '/'
  ],
};
