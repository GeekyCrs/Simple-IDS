"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>You don't have permission to access this page.</p>
            <p className="mt-2">
              {user
                ? `Your current role (${user.role}) doesn't have the required permissions.`
                : "Please log in to access this resource."}
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            {user ? (
              <>
                <Button asChild>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            )}
            
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}