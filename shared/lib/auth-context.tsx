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
  const publicPages = ['/unauthorized', '/privacy-policy', '/terms'];

  // Route check helpers
  const isAuthPage = (path: string | null): boolean => {
    if (!path) return false;
    return authPages.some(p => path.startsWith(p));
  };

  const isPublicPage = (path: string | null): boolean => {
    if (!path) return false;
    return publicPages.some(p => path === p);
  };

  const isProtectedRoute = (path: string | null): boolean => {
    if (!path) return false;
    return !isAuthPage(path) && !isPublicPage(path);
  };

  const isUnauthorizedPage = (path: string | null): boolean => {
    return path === unauthorizedPage;
  };

  // Role-based route restrictions
  const roleRestrictedRoutes: Record<string, UserRole[]> = {
    '/manager': ['manager'],
    '/chef': ['chef', 'manager'],
  };

  // Check if user has permission for the current route
  const hasPermissionForRoute = (userData: UserData | null, path: string | null): boolean => {
    if (!userData || !path) return false;
    
    // Check for exact matches first
    for (const [route, roles] of Object.entries(roleRestrictedRoutes)) {
      if (path.startsWith(route) && !roles.includes(userData.role)) {
        return false;
      }
    }
    
    return true;
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
            safeLog("[AuthContext] Active user data fetched:", enrichedUser);
            setUser(enrichedUser);
          } else {
            safeWarn(`[AuthContext] User account ${firebaseUser.uid} is inactive. Signing out.`);
            setUser(null);
            await auth.signOut();
          }
        } else {
          safeWarn(`[AuthContext] User document not found for UID: ${firebaseUser.uid}. Signing out.`);
          setUser(null);
          await auth.signOut();
        }
      } catch (error) {
        safeError("[AuthContext] Error fetching user data:", error);
        setUser(null);
      } finally {
        setLoading(false);
        safeLog("[AuthContext] User data processed. Loading set to false.");
      }
    });

    return () => {
      safeLog("[AuthContext] Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []);

  // Handle redirections based on auth state and path
  useEffect(() => {
    // Skip during SSR or while loading
    if (typeof window === 'undefined' || loading) {
      safeLog(`[AuthContext] Skipping redirection check because loading is ${loading}.`);
      return;
    }

    safeLog(`[AuthContext] Checking redirection. Path: ${pathname}, User: ${user?.id}, Loading: ${loading}`);

    // Case 1: Unauthenticated user trying to access protected routes
    if (!user && isProtectedRoute(pathname)) {
      safeLog(`[AuthContext] Redirecting unauthenticated user from ${pathname} to /login.`);
      router.push('/login');
      return;
    }

    // Case 2: Authenticated user trying to access auth pages
    if (user && isAuthPage(pathname)) {
      let redirectPath = '/dashboard'; // Default client dashboard
      if (user.role === 'chef') redirectPath = '/chef/dashboard';
      if (user.role === 'manager') redirectPath = '/manager'; // Manager dashboard is at /manager
      safeLog(`[AuthContext] Redirecting authenticated user from auth page ${pathname} to ${redirectPath}.`);
      router.push(redirectPath);
      return;
    }

    // Case 3: Authenticated user trying to access a route without permission
    if (user && isProtectedRoute(pathname) && !isUnauthorizedPage(pathname) && !hasPermissionForRoute(user, pathname)) {
      safeWarn(`[AuthContext] User ${user.id} (role: ${user.role}) lacks permission for ${pathname}. Redirecting to ${unauthorizedPage}.`);
      router.push(unauthorizedPage);
      return;
    }

    // Case 4: Handle root path redirection
    if (pathname === '/') {
      if (user) {
        let redirectPath = '/dashboard';
        if (user.role === 'chef') redirectPath = '/chef/dashboard';
        if (user.role === 'manager') redirectPath = '/manager'; // Manager dashboard is at /manager
        safeLog(`[AuthContext] Redirecting authenticated user from root / to ${redirectPath}.`);
        router.push(redirectPath);
      } else {
        safeLog(`[AuthContext] Redirecting unauthenticated user from root / to /login.`);
        router.push('/login');
      }
      return;
    }

    safeLog(`[AuthContext] No redirection needed for path: ${pathname}`);
  }, [user, loading, pathname, router]);

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