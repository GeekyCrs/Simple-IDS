
import type { ReactNode } from 'react';
import AppSidebar from '@/components/app/app-sidebar';
import ProtectedRoute from '@/components/protected-route'; // Import ProtectedRoute

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute> {/* Wrap the entire app layout */}
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex flex-col bg-background">
          {/* Header could go here if needed */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
