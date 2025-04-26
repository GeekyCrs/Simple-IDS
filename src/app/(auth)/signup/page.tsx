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
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Function to map Firebase error codes to user-friendly messages
  const getFirebaseAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please login or use a different email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password (at least 6 characters).';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      default:
        return 'An unexpected error occurred during signup. Please try again.';
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    // Basic password length check (Firebase enforces 6 characters minimum by default)
    if (password.length < 6) {
        toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters long." });
        return;
    }

    setIsLoading(true);

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

      // Store additional user data in Firestore
      // IMPORTANT: Ensure Firestore rules allow this write operation for the newly authenticated user.
      // Example rule: allow write: if request.auth.uid == userId;
      const userId = user.uid;
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        uid: userId,
        email: email,
        name: email.split('@')[0], // Placeholder name, consider adding a name field to the form
        role: 'client', // Default role for new signups
        createdAt: new Date().toISOString(),
        status: 'active' // Default status
      });
      console.log('User data saved to Firestore for UID:', userId);

      toast({ title: "Signup Successful", description: "Account created successfully. Please login." });
      router.push('/login'); // Redirect to login after successful signup

    } catch (error: any) {
      console.error('Signup error:', error);
      const authError = error as AuthError; // Type assertion
      const errorMessage = getFirebaseAuthErrorMessage(authError.code);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
        <CardDescription>Create your CanteenConnect account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Consider adding a Name input field here */}
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              aria-describedby="password-hint"
            />
             <p id="password-hint" className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm">
        <div className="text-center text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" passHref>
            <span className="font-medium text-accent hover:underline cursor-pointer">
              Login
            </span>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
