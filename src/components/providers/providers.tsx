"use client";

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}