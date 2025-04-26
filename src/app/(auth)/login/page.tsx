
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase/firebase-config';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Function to map Firebase error codes to user-friendly messages
  const getFirebaseAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': // General invalid credential error
        return 'Incorrect email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User logged in successfully:', user.uid);

      // Fetch user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'client'; // Default role
      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role || 'client';
      } else {
        console.warn(`No user document found for UID: ${user.uid}. Defaulting to 'client' role.`);
        // Optionally create the user doc here if it should always exist
      }

      // --- Simulation for Middleware ---
      // In a real app, the server would set a secure HTTP-only cookie after verifying the ID token.
      // This simulation sets a client-side cookie that the current middleware expects.
      // ** THIS IS INSECURE FOR PRODUCTION **
      let simulatedToken = 'client-token';
      if (userRole === 'chef') simulatedToken = 'chef-token';
      if (userRole === 'manager') simulatedToken = 'manager-token';
      document.cookie = `auth-session=${simulatedToken}; path=/; max-age=3600`; // Expires in 1 hour
      console.log(`[Login Page] Simulated setting auth-session cookie with token: ${simulatedToken}`);
      // --- End Simulation ---

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      });

      // Redirect based on fetched role
      let redirectPath = '/app/dashboard'; // Default client dashboard
      if (userRole === 'chef') {
        redirectPath = '/app/chef/dashboard';
      } else if (userRole === 'manager') {
        redirectPath = '/app/manager/dashboard';
      }

      console.log(`Redirecting to: ${redirectPath}`);
      // Refresh the page to ensure middleware picks up the cookie and re-evaluates
      router.refresh();
      // Push the new route after refresh
      router.push(redirectPath);


    } catch (error: any) {
      console.error('Login error:', error);
      const authError = error as AuthError; // Type assertion
      const errorMessage = getFirebaseAuthErrorMessage(authError.code);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage
      });
      // Clear simulated cookie on failure
      document.cookie = 'auth-session=; path=/; max-age=0';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>Enter your email and password to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" passHref>
                <span className="text-sm text-accent hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm">
        <div className="text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" passHref>
            <span className="font-medium text-accent hover:underline cursor-pointer">
              Sign up
            </span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
