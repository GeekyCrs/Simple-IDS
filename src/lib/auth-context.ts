
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
}

// Define context type
interface AuthContextValue {
  user: UserData | null;
  loading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Auth pages that should be redirected away from if logged in
  const authPages = ['/login', '/signup', '/forgot-password'];

  // Role-based route restrictions
  const roleRestrictedRoutes: Record<string, UserRole[]> = {
    '/app/manager': ['manager'],
    '/app/chef': ['chef', 'manager'], // Manager can also access chef routes
    // Add other restricted routes if needed
  };

  // Check if the current path requires authentication
  const isAppRoute = (path: string | null) => path?.startsWith('/app') || false;

  // Check if the current path is an authentication page
  const isAuthPage = (path: string | null) => path ? authPages.some(p => path.startsWith(p)) : false;

  // Check if user has permission for the current route
  const hasPermissionForRoute = (userData: UserData | null, path: string | null): boolean => {
    if (!userData || !path) return false; // Cannot have permission if not logged in or no path

    const restrictedRoute = Object.keys(roleRestrictedRoutes).find(route =>
      path.startsWith(route)
    );

    // If the route is not restricted, permission is granted
    if (!restrictedRoute) return true;

    // If the route is restricted, check if the user's role is allowed
    return roleRestrictedRoutes[restrictedRoute].includes(userData.role);
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("[AuthContext] Auth state changed. User:", firebaseUser?.uid || "null");
      setLoading(true); // Start loading whenever auth state might change
      try {
        if (firebaseUser) {
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
            };

            if (enrichedUser.status === 'active') {
              console.log("[AuthContext] Active user data fetched:", enrichedUser);
              setUser(enrichedUser);
            } else {
              console.warn(`[AuthContext] User account ${firebaseUser.uid} is inactive.`);
              setUser(null);
              await auth.signOut(); // Sign out inactive user
            }
          } else {
            console.warn(`[AuthContext] User document not found for UID: ${firebaseUser.uid}. Signing out.`);
            setUser(null);
            await auth.signOut(); // Sign out if Firestore document is missing
          }
        } else {
          console.log("[AuthContext] No Firebase user logged in.");
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error fetching user data:", error);
        setUser(null);
        await auth.signOut(); // Sign out on error
      } finally {
        setLoading(false); // Finish loading AFTER processing auth state
        console.log("[AuthContext] Auth state processing finished. Loading set to false.");
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
    if (!loading) {
        console.log(`[AuthContext] Checking redirection. Path: ${pathname}, User: ${user?.id}, Loading: ${loading}`);

        // Redirect unauthenticated users trying to access app routes
        if (!user && isAppRoute(pathname)) {
            console.log(`[AuthContext] Redirecting unauthenticated user from ${pathname} to /login.`);
            router.push('/login');
            return; // Stop further checks after redirect
        }

        // Redirect authenticated users trying to access auth pages
        if (user && isAuthPage(pathname)) {
            let redirectPath = '/app/dashboard'; // Default client dashboard
            if (user.role === 'chef') redirectPath = '/app/chef/dashboard';
            if (user.role === 'manager') redirectPath = '/app/manager/dashboard';
            console.log(`[AuthContext] Redirecting authenticated user from ${pathname} to ${redirectPath}.`);
            router.push(redirectPath);
            return; // Stop further checks after redirect
        }

        // Redirect authenticated users without permission for the current route
        if (user && isAppRoute(pathname) && !hasPermissionForRoute(user, pathname)) {
            console.warn(`[AuthContext] User ${user.id} (role: ${user.role}) lacks permission for ${pathname}. Redirecting to /unauthorized.`);
            router.push('/unauthorized');
            return; // Stop further checks after redirect
        }

        // Handle root path redirection for authenticated users
         if (user && pathname === '/') {
             let redirectPath = '/app/dashboard'; // Default client dashboard
             if (user.role === 'chef') redirectPath = '/app/chef/dashboard';
             if (user.role === 'manager') redirectPath = '/app/manager/dashboard';
             console.log(`[AuthContext] Redirecting authenticated user from root / to ${redirectPath}.`);
             router.push(redirectPath);
             return;
         }
         // Handle root path redirection for unauthenticated users
         if (!user && pathname === '/') {
              console.log(`[AuthContext] Redirecting unauthenticated user from root / to /login.`);
              router.push('/login');
              return;
         }

    } else {
        console.log(`[AuthContext] Skipping redirection check because loading is true.`);
    }
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
