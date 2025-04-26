"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);

    // TODO: Implement actual Firebase signup logic here
    // Example:
    // try {
    //   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //   // Handle successful signup, maybe send verification email, etc.
    //   // Assign default 'client' role here in Firestore/Realtime Database
    //   toast({ title: "Signup Successful", description: "Please check your email for verification." });
    //   router.push('/login'); // Redirect to login page after signup
    // } catch (error: any) {
    //   toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    // } finally {
    //   setIsLoading(false);
    // }

    // Placeholder logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    console.log("Signup attempt with:", email);
    toast({ title: "Signup Attempted", description: "Replace with actual Firebase signup." });
    router.push('/login'); // Redirect to login after signup

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
        <CardDescription>Create your CanteenConnect account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
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
