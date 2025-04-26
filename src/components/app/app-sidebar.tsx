
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, UtensilsCrossed, BookOpen, History, Settings, LogOut, Users, Package, ChefHat, FileText, UserCog } from 'lucide-react';
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
import { auth } from '@/lib/firebase'; // Correct import path
import { signOut } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context'; // Import useAuth hook

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth(); // Use the context hook
  const { state } = useSidebar(); // Sidebar state hook

  const handleLogout = async () => {
    try {
      await signOut(auth); // Use Firebase signOut
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // Use window.location for a more reliable redirect after logout to clear context
      window.location.href = '/login';
    } catch (error: any) {
       console.error("Logout Failed:", error);
       toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const commonLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
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

  const managerLinks = [
    { href: '/manager/dashboard', label: 'Manager Dash', icon: Settings },
    { href: '/manager/manage-menu', label: 'Manage Menu', icon: BookOpen },
    { href: '/manager/manage-stock', label: 'Manage Stock', icon: Package },
    { href: '/manager/all-bills', label: 'All Bills', icon: FileText },
    { href: '/manager/manage-users', label: 'Manage Users', icon: UserCog },
    { href: '/chef/orders-queue', label: 'Orders Queue', icon: UtensilsCrossed }, // Manager can also view queue
  ];

   // Prepend '/app' to all hrefs
   const prefixLinks = (links: typeof commonLinks) => links.map(link => ({ ...link, href: `/app${link.href}` }));

   const clientNavLinks = prefixLinks(commonLinks);
   const chefNavLinks = prefixLinks(chefLinks);
   const managerNavLinks = prefixLinks(managerLinks);

  // Determine links based on fetched role
   const role = user?.role || 'client'; // Get role from context
   const navLinks = role === 'chef' ? chefNavLinks : role === 'manager' ? managerNavLinks : clientNavLinks;
   const baseHref = role === 'chef' ? '/app/chef' : role === 'manager' ? '/app/manager' : '/app';

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

   // If not authenticated (no user from context), don't render the sidebar.
   // The layout and middleware should handle redirection.
   if (!user) {
     return null;
   }

   const userData = {
     name: user.name,
     email: user.email,
     // imageUrl: user.imageUrl // Assuming imageUrl is added to UserData in AuthContext
   };

  return (
     <TooltipProvider> {/* Ensure TooltipProvider wraps the sidebar */}
       <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
         <SidebarHeader className="p-2 items-center gap-2">
           <div className={cn("flex items-center gap-2 transition-all", state === 'collapsed' && 'justify-center')}>
             <UtensilsCrossed className={cn("size-6 text-primary shrink-0", state === 'collapsed' && 'size-8')} />
             <span className={cn("font-semibold text-lg transition-[opacity,margin] duration-200 ease-linear", state === 'collapsed' && 'opacity-0 ml-0')}>
               CanteenConnect
             </span>
           </div>
           <div className={cn("ml-auto", state === 'collapsed' && 'hidden')}>
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
                         isActive={pathname === link.href || (pathname.startsWith(link.href) && link.href !== baseHref && link.href.length > (baseHref || '').length + 1)}
                         className="justify-start"
                         aria-label={link.label}
                       >
                         <link.icon className="shrink-0" />
                         <span className={cn("transition-opacity duration-200", state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>{link.label}</span>
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
               {/* <AvatarImage src={userData.imageUrl} alt={userData.name || 'User'} /> */}
               <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
             </Avatar>
             <div className={cn("flex flex-col text-xs transition-[opacity,margin] duration-200 ease-linear", state === 'collapsed' ? 'opacity-0 ml-0' : 'opacity-100 ml-0')}>
               <span className="font-semibold">{userData.name || 'User'}</span>
               <span className="text-muted-foreground">{userData.email || 'No Email'}</span>
             </div>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" className={cn("ml-auto h-8 w-8", state === 'collapsed' && 'hidden')} onClick={handleLogout} aria-label="Logout">
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
                 <Button variant="ghost" size="icon" className="w-full mt-2 h-8" onClick={handleLogout} aria-label="Logout">
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
