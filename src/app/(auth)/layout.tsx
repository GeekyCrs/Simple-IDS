
"use client";

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
// AuthProvider is removed from here as it's now in the root layout
import "@/app/globals.css"; // Keep globals if needed for auth page styling

export default function AuthLayout({ // Renamed to AuthLayout for clarity
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // No need for HTML and Body tags here if they are in the root layout
    <div className="flex items-center justify-center min-h-screen bg-background"> {/* Added basic centering styling */}
        {children}
      <Toaster />
    </div>
  );
}
