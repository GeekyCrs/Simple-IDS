"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "@/lib/auth-utils";
import ProtectedRoute from "@/components/protected-route";
import { useToast } from "@/hooks/use-toast";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { name: "Dashboard", href: "/manager", icon: BarChart3 },
    { name: "Manage Users", href: "/manager/manage-users", icon: Users },
    { name: "Settings", href: "/manager/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again."
      });
    }
  };

  return (
    <ProtectedRoute requiredRoles={["manager"]}>
      <div>
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center p-4 bg-background border-b">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {sidebarOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <div className="ml-4 font-semibold">Manager Dashboard</div>
        </div>

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-30 bg-black/30 lg:hidden ${
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          } transition-opacity`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar for all screen sizes */}
        <div
          className={`fixed top-0 bottom-0 left-0 z-30 w-64 flex-none bg-background border-r transform transition-transform lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="flex h-16 flex-shrink-0 items-center px-6">
              <h2 className="text-lg font-semibold">Manager Dashboard</h2>
            </div>
            
            {/* User info */}
            <div className="border-t border-b py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Sidebar footer with sign out button */}
            <div className="flex-shrink-0 border-t p-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          <div className="py-6 lg:py-8">
            <div className="pt-10 lg:pt-0">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}