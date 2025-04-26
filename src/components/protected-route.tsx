"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children,
  requiredRoles = []
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only run checks when auth state is determined
    if (!loading) {
      // If user is not authenticated, redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // If specific roles are required and user doesn't have any of them
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, loading, router, requiredRoles]);

  // Show loading state while determining authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children until verification completes
  if (!user) {
    return null;
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return null; // Don't render while redirecting to unauthorized
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}