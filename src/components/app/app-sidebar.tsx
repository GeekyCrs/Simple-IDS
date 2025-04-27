"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UtensilsCrossed, 
  BookOpen, 
  History, 
  Settings, 
  LogOut, 
  Package, 
  ChefHat, 
  FileText, 
  UserCog, 
  LayoutDashboard, 
  DollarSign 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function AppSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { state } = useSidebar();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      window.location.href = '/login';
    } catch (error: any) {
      console.error("Logout Failed:", error);
      toast({ 
        variant: "destructive", 
        title: "Logout Failed", 
        description: error.message || "Could not log out." 
      });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // Define links relative to the root
  const commonLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/menu', label: 'Menu', icon: BookOpen },
    { href: '/orders', label: 'Place Order', icon: UtensilsCrossed },
    { href: '/order-history', label: 'Order History', icon: History },
    { href: '/my-bill', label: 'My Bill', icon: FileText },
  ];

  const chefLinks = [
    { href: '/chef/dashboard', label: 'Chef Dashboard', icon: ChefHat },
    { href: '/chef/manage-menu', label: 'Manage Menu', icon: BookOpen },
    { href: '/chef/manage-stock', label: 'Manage Stock', icon: Package },
    { href: '/chef/orders-queue', label: 'Orders Queue', icon: UtensilsCrossed },
  ];

  // Updated manager links to include Initial Capital
  const managerLinks = [
    { href: '/manager/dashboard', label: 'Manager Dash', icon: Settings },
    { href: '/manager/initial-capital', label: 'Initial Capital', icon: DollarSign },
    { href: '/manager/manage-menu', label: 'Manage Menu', icon: BookOpen },
    { href: '/manager/manage-stock', label: 'Manage Stock', icon: Package },
    { href: '/manager/all-bills', label: 'All Bills', icon: FileText },
    { href: '/manager/manage-users', label: 'Manage Users', icon: UserCog },
    { href: '/chef/orders-queue', label: 'Orders Queue', icon: UtensilsCrossed },
    { href: '/manager/settings', label: 'Settings', icon: Settings },
  ];

  // Determine links based on fetched role
  const role = user?.role || 'client';
  const navLinks = role === 'chef' ? chefLinks : role === 'manager' ? managerLinks : commonLinks;
  const baseHref = role === 'chef' ? '/chef' : role === 'manager' ? '/manager' : '';

  // While loading auth state, show skeleton
  if (loading) {
    return (
      <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-2 items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </SidebarHeader>
        <Separator className="my-1" />
        <SidebarContent className="p-2 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </SidebarContent>
        <Separator className="my-1" />
        <SidebarFooter className="p-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // If not authenticated, don't render the sidebar
  if (!user) {
    return null;
  }

  const userData = {
    name: user.name,
    email: user.email,
    imageUrl: user.imageUrl
  };

  // Determine if a link is active
  const isActiveLink = (href: string) => {
    // Exact match required for dashboards
    if (href === '/dashboard' || href === '/chef/dashboard' || href === '/manager/dashboard') {
      return pathname === href;
    }
    // For other links, check if the current path starts with the link's href
    // Ensure it's not just the base path matching itself if baseHref exists
    return pathname.startsWith(href) && (baseHref ? href.length > baseHref.length : true);
  }

  return (
    <TooltipProvider>
      <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-2 flex items-center gap-2">
          <div className={cn("flex items-center gap-2 transition-all", state === 'collapsed' && 'justify-center flex-grow')}>
            <UtensilsCrossed className={cn("size-6 text-primary shrink-0", state === 'collapsed' && 'size-8')} />
            <span className={cn("font-semibold text-lg transition-[opacity,margin] duration-200 ease-linear", state === 'collapsed' && 'opacity-0 ml-0 hidden')}>
              CanteenConnect
            </span>
          </div>
          <div className={cn("shrink-0", state === 'collapsed' ? 'ml-auto' : '')}>
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <Separator className="my-1" />

        <SidebarContent className="p-2 flex-1 overflow-y-auto">
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={link.href} passHref>
                      <SidebarMenuButton
                        isActive={isActiveLink(link.href)}
                        className={cn(
                          "justify-start",
                          !isActiveLink(link.href) && "hover:bg-accent hover:text-accent-foreground"
                        )}
                        aria-label={link.label}
                      >
                        <link.icon className={cn(
                          "shrink-0",
                          !isActiveLink(link.href) && "group-hover:text-accent-foreground"
                        )} />
                        <span className={cn("transition-opacity duration-200", state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>
                          {link.label}
                        </span>
                      </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  {state === 'collapsed' && (
                    <TooltipContent side="right" align="center">
                      {link.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <Separator className="my-1" />

        <SidebarFooter className="p-2">
          <div className={cn("flex items-center gap-3 transition-all duration-200", state === 'collapsed' && 'justify-center')}>
            <Avatar className="size-8">
              <AvatarImage src={userData.imageUrl} alt={userData.name || 'User'} />
              <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
            </Avatar>
            <div className={cn("flex flex-col text-xs transition-[opacity,margin] duration-200 ease-linear", state === 'collapsed' ? 'opacity-0 ml-0' : 'opacity-100 ml-0')}>
              <span className="font-semibold">{userData.name || 'User'}</span>
              <span className="text-muted-foreground">{userData.email || 'No Email'}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("ml-auto h-8 w-8", state === 'collapsed' && 'hidden')} 
                  onClick={handleLogout} 
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Logout
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Logout button when collapsed */}
          {state === 'collapsed' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-full mt-2 h-8 hover:bg-accent hover:text-accent-foreground" 
                  onClick={handleLogout} 
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Logout
              </TooltipContent>
            </Tooltip>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}