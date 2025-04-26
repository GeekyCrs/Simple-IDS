"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

// Define user types
type UserRole = 'client' | 'chef' | 'manager';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

// Define context type
interface AuthContextValue {
  user: UserData | null;
  loading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Safe logging functions (only log on client)
const safeLog = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined') {
    console.log(message, ...args);
  }
};

const safeWarn = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined') {
    console.warn(message, ...args);
  }
};

const safeError = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined') {
    console.error(message, ...args);
  }
};

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Route types
  const authPages = ['/login', '/signup', '/forgot-password'];
  const unauthorizedPage = '/unauthorized';
  const publicPages = ['/unauthorized', '/privacy-policy', '/terms']; // Add any other public pages

  // Route check helpers
  const isAuthPage = (path: string | null): boolean => {
    if (!path) return false;
    return authPages.some(p => path.startsWith(p));
  };

  const isPublicPage = (path: string | null): boolean => {
    if (!path) return false;
    // Exact match for public pages
    return publicPages.some(p => path === p);
  };

  const isProtectedRoute = (path: string | null): boolean => {
    if (!path) return false;
    // Anything not an auth page or explicitly public is considered protected
    return !isAuthPage(path) && !isPublicPage(path);
  };

  const isUnauthorizedPage = (path: string | null): boolean => {
    return path === unauthorizedPage;
  };

  // Role-based route restrictions (using route group prefixes)
  const roleRestrictedRoutes: Record<string, UserRole[]> = {
    '/manager': ['manager'],
    '/chef': ['chef', 'manager'],
    // Add client-specific routes if any, e.g., '/client-only': ['client']
  };

  // Check if user has permission for the current route
  const hasPermissionForRoute = (userData: UserData | null, path: string | null): boolean => {
    if (!userData || !path) return false; // No user or path, no permission

     // Default allow if no specific restriction matches
    let hasPermission = true;

    for (const [routePrefix, allowedRoles] of Object.entries(roleRestrictedRoutes)) {
      if (path.startsWith(routePrefix)) {
        // If path starts with a restricted prefix, check roles
        if (!allowedRoles.includes(userData.role)) {
          hasPermission = false;
          break; // Found a restriction, no need to check further
        }
        // If the user's role is allowed for this prefix, they have permission *for this level*
        // Continue checking potentially more specific nested routes if needed (not currently implemented here)
      }
    }

    // Special case: Non-clients should generally not access the base '/dashboard' etc. unless explicitly allowed elsewhere
    const clientOnlyRoutes = ['/dashboard', '/menu', '/orders', '/order-history', '/my-bill'];
    if (clientOnlyRoutes.some(route => path === route) && userData.role !== 'client') {
      // Allow manager/chef to access specific client routes if needed by adding them above
      // e.g., if manager should see the client menu: add '/menu': ['client', 'manager'] to roleRestrictedRoutes
      // Otherwise, deny access to base client routes for non-clients
       safeLog(`[AuthContext] Non-client (${userData.role}) trying to access client-only route: ${path}`);
       // Uncomment the line below to enforce strict client-only access for these base routes
       // hasPermission = false;
    }


    return hasPermission;
  };

  // Authentication state listener
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    safeLog("[AuthContext] Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      safeLog("[AuthContext] Auth state changed. User:", firebaseUser?.uid || "null");

      if (!firebaseUser) {
        safeLog("[AuthContext] No Firebase user logged in.");
        setUser(null);
        setLoading(false);
        safeLog("[AuthContext] No user. Loading set to false.");
        return;
      }

      setLoading(true); // Set loading true while fetching Firestore data
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const enrichedUser: UserData = {
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            role: (userData.role as UserRole) || 'client', // Default to client if role is missing/invalid
            status: userData.status || 'active', // Default to active if status is missing
            imageUrl: userData.imageUrl || undefined,
          };

           // Validate role
           const validRoles: UserRole[] = ['client', 'chef', 'manager'];
           if (!validRoles.includes(enrichedUser.role)) {
              safeWarn(`[AuthContext] Invalid role "${enrichedUser.role}" found for user ${firebaseUser.uid}. Defaulting to 'client'.`);
              enrichedUser.role = 'client';
           }

          if (enrichedUser.status === 'active') {
            safeLog("[AuthContext] Active user data fetched:", enrichedUser);
            setUser(enrichedUser);
          } else {
            safeWarn(`[AuthContext] User account ${firebaseUser.uid} is inactive. Signing out.`);
            setUser(null);
            await auth.signOut();
          }
        } else {
          safeWarn(`[AuthContext] User document not found for UID: ${firebaseUser.uid}. Treating as unauthenticated.`);
           // If user exists in Auth but not Firestore, something is wrong. Log out.
          setUser(null);
          await auth.signOut();
        }
      } catch (error) {
        safeError("[AuthContext] Error fetching user data:", error);
        setUser(null);
        await auth.signOut(); // Log out on error fetching data
      } finally {
        setLoading(false);
        safeLog("[AuthContext] User data processed. Loading set to false.");
      }
    });

    return () => {
      safeLog("[AuthContext] Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle redirections based on auth state and path
  useEffect(() => {
    // Skip during SSR or while loading initial auth state
    if (typeof window === 'undefined' || loading) {
      safeLog(`[AuthContext] Skipping redirection check because loading is ${loading}.`);
      return;
    }

    safeLog(`[AuthContext] Checking redirection. Path: ${pathname}, User: ${user?.id}, Loading: ${loading}`);

    // Determine the correct dashboard path based on role
     const getDashboardPath = (role: UserRole | undefined): string => {
        switch (role) {
          case 'manager': return '/manager/dashboard';
          case 'chef': return '/chef/dashboard';
          case 'client':
          default: return '/dashboard'; // Default client dashboard
        }
     };

    // Case 1: Unauthenticated user trying to access protected routes
    if (!user && isProtectedRoute(pathname)) {
      safeLog(`[AuthContext] Redirecting unauthenticated user from ${pathname} to /login.`);
      router.replace('/login'); // Use replace to avoid login page in history
      return;
    }

    // Case 2: Authenticated user trying to access auth pages
    if (user && isAuthPage(pathname)) {
       const dashboardPath = getDashboardPath(user.role);
       safeLog(`[AuthContext] Redirecting authenticated user from auth page ${pathname} to ${dashboardPath}.`);
       router.replace(dashboardPath);
       return;
    }

    // Case 3: Authenticated user trying to access a route without permission
    if (user && isProtectedRoute(pathname) && !isUnauthorizedPage(pathname) && !hasPermissionForRoute(user, pathname)) {
      safeWarn(`[AuthContext] User ${user.id} (role: ${user.role}) lacks permission for ${pathname}. Redirecting to ${unauthorizedPage}.`);
      router.replace(unauthorizedPage);
      return;
    }

    // Case 4: Handle root path redirection (if middleware didn't catch it)
    if (pathname === '/') {
       if (user) {
         const dashboardPath = getDashboardPath(user.role);
         safeLog(`[AuthContext] Redirecting authenticated user from root / to ${dashboardPath}.`);
         router.replace(dashboardPath);
       } else {
         safeLog(`[AuthContext] Redirecting unauthenticated user from root / to /login.`);
         router.replace('/login');
       }
       return;
    }


    safeLog(`[AuthContext] No redirection needed for path: ${pathname}`);

  }, [user, loading, pathname, router]); // Rerun whenever these dependencies change


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
