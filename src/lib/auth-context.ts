
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Correct import path
import { useRouter, usePathname } from 'next/navigation';

// Define user types
type UserRole = 'client' | 'chef' | 'manager';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  imageUrl?: string; // Added optional imageUrl
}

// Define context type
interface AuthContextValue {
  user: UserData | null;
  loading: boolean;
}

// Create context
// Initialize with undefined for better checking in useAuth hook
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Auth pages that should be redirected away from if logged in
  const authPages = ['/login', '/signup', '/forgot-password'];
  const unauthorizedPage = '/unauthorized'; // Define the unauthorized page path

  // Role-based route restrictions (base paths starting with /app/)
  const roleRestrictedRoutes: Record<string, UserRole[]> = {
     '/app/manager': ['manager'],
     '/app/chef': ['chef', 'manager'], // Manager can also access chef routes
     // Client-specific pages (if any) can be added here if needed, though generally /app/* is client accessible by default
  };

  // Check if the current path requires authentication (starts with /app/)
  const isAppRoute = (path: string | null) => path?.startsWith('/app');

  // Check if the current path is an authentication page
  const isAuthPage = (path: string | null) => path ? authPages.some(p => path.startsWith(p)) : false;

  // Check if the current path is the unauthorized page
  const isUnauthorizedPage = (path: string | null) => path === unauthorizedPage;

  // Check if user has permission for the current route
  const hasPermissionForRoute = (userData: UserData | null, path: string | null): boolean => {
    if (!userData || !path || !isAppRoute(path)) return true; // Allow access if not an app route or no user data (middleware handles primary auth)

    const restrictedRoute = Object.keys(roleRestrictedRoutes).find(route =>
      path.startsWith(route)
    );

    // If the route is not explicitly restricted, assume it's accessible by all authenticated users
    if (!restrictedRoute) return true;

    // If the route is restricted, check if the user's role is allowed
    return roleRestrictedRoutes[restrictedRoute].includes(userData.role);
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("[AuthContext] Auth state changed. User:", firebaseUser?.uid || "null");

      if (!firebaseUser) {
        console.log("[AuthContext] No Firebase user logged in.");
        setUser(null);
        setLoading(false);
        console.log("[AuthContext] No user. Loading set to false.");
        return;
      }

      // Keep loading until user data (including role) is fetched
      // setLoading(true); // Setting loading true here might cause flashes if already loaded

      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const enrichedUser: UserData = {
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            role: (userData.role as UserRole) || 'client',
            status: userData.status || 'active',
            imageUrl: userData.imageUrl || undefined,
          };

          if (enrichedUser.status === 'active') {
            console.log("[AuthContext] Active user data fetched:", enrichedUser);
            setUser(enrichedUser);
          } else {
            console.warn(`[AuthContext] User account ${firebaseUser.uid} is inactive. Signing out.`);
            setUser(null);
            await auth.signOut();
          }
        } else {
          console.warn(`[AuthContext] User document not found for UID: ${firebaseUser.uid}. Signing out.`);
          setUser(null);
          await auth.signOut(); // Sign out if Firestore document is missing
        }
      } catch (error) {
        console.error("[AuthContext] Error fetching user data:", error);
        setUser(null);
        // Consider if signing out here is always the right behavior
        // await auth.signOut(); // Sign out on error - potentially problematic if temporary network issue
      } finally {
        setLoading(false); // Finish loading AFTER processing auth state
        console.log("[AuthContext] User data processed. Loading set to false.");
      }
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("[AuthContext] Cleaning up auth state listener.");
        unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount


  // Effect for handling redirection based on auth state and pathname
  useEffect(() => {
    // Only run redirection logic if loading is complete
    if (loading) {
      console.log(`[AuthContext] Skipping redirection check because loading is true.`);
      return;
    }

    console.log(`[AuthContext] Checking redirection. Path: ${pathname}, User: ${user?.id}, Loading: ${loading}`);

    // Case 1: Unauthenticated user trying to access protected app routes
    if (!user && isAppRoute(pathname)) {
      console.log(`[AuthContext] Redirecting unauthenticated user from ${pathname} to /login.`);
      router.push('/login');
      return;
    }

    // Case 2: Authenticated user trying to access auth pages
    if (user && isAuthPage(pathname)) {
      let redirectPath = '/app/dashboard'; // Default client dashboard
      if (user.role === 'chef') redirectPath = '/app/chef/dashboard';
      if (user.role === 'manager') redirectPath = '/app/manager/dashboard';
      console.log(`[AuthContext] Redirecting authenticated user from auth page ${pathname} to ${redirectPath}.`);
      router.push(redirectPath);
      return;
    }

    // Case 3: Authenticated user trying to access a route without permission
    if (user && isAppRoute(pathname) && !isUnauthorizedPage(pathname) && !hasPermissionForRoute(user, pathname)) {
      console.warn(`[AuthContext] User ${user.id} (role: ${user.role}) lacks permission for ${pathname}. Redirecting to ${unauthorizedPage}.`);
      router.push(unauthorizedPage);
      return;
    }

    // Case 4: Handle root path redirection
    if (pathname === '/') {
      if (user) {
        let redirectPath = '/app/dashboard';
        if (user.role === 'chef') redirectPath = '/app/chef/dashboard';
        if (user.role === 'manager') redirectPath = '/app/manager/dashboard';
        console.log(`[AuthContext] Redirecting authenticated user from root / to ${redirectPath}.`);
        router.push(redirectPath);
      } else {
        console.log(`[AuthContext] Redirecting unauthenticated user from root / to /login.`);
        router.push('/login');
      }
      return;
    }

    console.log(`[AuthContext] No redirection needed for path: ${pathname}`);

  }, [user, loading, pathname, router]); // Re-run when user, loading state, or path changes

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) { // Check for undefined instead of null
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
