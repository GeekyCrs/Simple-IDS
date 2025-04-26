
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  // requiredRoles prop is removed as role checks are handled in AuthContext
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    // This acts as a client-side safeguard, though AuthContext also handles this.
    if (!loading && !user) {
      console.log("[ProtectedRoute] No user found after loading, redirecting to /login.");
      router.push("/login");
    }
    // Role checks are removed from here, handled by AuthContext useEffect
  }, [user, loading, router]);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {/* You can use a more sophisticated spinner/loader component */}
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's a user, render the children
  if (user) {
    return <>{children}</>;
  }

  // If no user and not loading (implies redirection is likely happening), render null
  return null;
}
