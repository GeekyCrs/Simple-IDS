
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase'; // Correct import path
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context'; // Import useAuth to potentially update context

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  // const { setUser } = useAuth(); // Potentially use if you need to manually trigger context update

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
      const firebaseUser = userCredential.user;
      console.log('User logged in successfully:', firebaseUser.uid);

      // Fetch user role and data from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'client'; // Default role
      let userData = null; // Placeholder for user data

      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        userRole = firestoreData?.role || 'client';
        // Construct the UserData object matching AuthContext
        userData = {
          id: firebaseUser.uid,
          name: firestoreData.name || firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          role: userRole as 'client' | 'chef' | 'manager',
          status: firestoreData.status || 'active',
          imageUrl: firestoreData.imageUrl || undefined,
        };
        console.log("Fetched user data:", userData);

        // Check if user is active
        if (userData.status !== 'active') {
          toast({
            variant: "destructive",
            title: "Account Disabled",
            description: "Your account is inactive. Please contact support.",
          });
          await auth.signOut(); // Sign out inactive user
          setIsLoading(false);
          return;
        }

      } else {
        console.warn(`No user document found for UID: ${firebaseUser.uid}. Defaulting to 'client' role.`);
        // Optionally create the user doc here if it should always exist
        // For now, assume default client role if doc missing, but show warning
         userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          role: 'client',
          status: 'active', // Assume active if doc missing, might need adjustment
        };
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      });

      // --- Redirection Logic ---
      // Redirect based on fetched role. Use correct paths based on route groups.
      let redirectPath = '/dashboard'; // Default for client
      if (userRole === 'chef') {
        redirectPath = '/chef/dashboard'; // Matches src/app/(app)/chef/dashboard
      } else if (userRole === 'manager') {
        redirectPath = '/manager/dashboard'; // Matches src/app/(app)/manager/dashboard
      }

      console.log(`Redirecting to: ${redirectPath}`);
      // Use router.replace for better history management on login/logout flows
      router.replace(redirectPath);


    } catch (error: any) {
      console.error('Login error:', error);
      const authError = error as AuthError; // Type assertion
      const errorMessage = getFirebaseAuthErrorMessage(authError.code);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage
      });
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // Don't set isLoading to false here if redirecting, let the navigation handle it.
    // setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background"> {/* Updated background */}
        <Card className="w-full max-w-md shadow-lg border rounded-lg"> {/* Added border and rounded */}
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
                  className="text-base md:text-sm" // Consistent input text size
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" passHref>
                    <Button variant="link" className="text-sm h-auto p-0 text-accent hover:underline"> {/* Use Button for link styling */}
                      Forgot password?
                    </Button>
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
                   className="text-base md:text-sm" // Consistent input text size
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
                 <Button variant="link" className="text-sm h-auto p-0 font-medium text-accent hover:underline"> {/* Use Button for link styling */}
                   Sign up
                 </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
    </div>
  );
}
