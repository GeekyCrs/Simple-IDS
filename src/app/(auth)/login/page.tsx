"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual Firebase authentication logic here
    // Example:
    // try {
    //   const userCredential = await signInWithEmailAndPassword(auth, email, password);
    //   // Handle successful login, maybe redirect based on role
    //   toast({ title: "Login Successful", description: "Welcome back!" });
    //   router.push('/dashboard'); // Redirect to dashboard or role-specific page
    // } catch (error: any) {
    //   toast({ variant: "destructive", title: "Login Failed", description: error.message });
    // } finally {
    //   setIsLoading(false);
    // }

    // Placeholder logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    console.log("Login attempt with:", email, password);
    toast({ title: "Login Attempted", description: "Replace with actual Firebase login." });
    // Placeholder: Redirect based on a simulated role or just to dashboard
    if (email.includes('chef')) router.push('/chef');
    else if (email.includes('manager')) router.push('/manager');
    else router.push('/dashboard');

    setIsLoading(false);
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
