"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';
import { auth, db } from '@/firebase/firebase-config';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
      
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions." });
      setIsSent(true);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to send reset email" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        <CardDescription>
          {isSent
            ? "Check your email for a link to reset your password."
            : "Enter your email address and we'll send you a link to reset your password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSent ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
           <div className="text-center text-muted-foreground">
            If you don't see the email, please check your spam folder.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/login" passHref>
          <Button variant="ghost" className="text-sm text-accent hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}