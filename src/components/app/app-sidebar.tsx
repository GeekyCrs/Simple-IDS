"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, UtensilsCrossed, BookOpen, History, Settings, LogOut, Users, Package, ChefHat } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Placeholder for getting user role and info - replace with actual auth context/hook
const useUser = () => {
  // Simulate user role - replace with actual logic
  // Possible roles: 'client', 'chef', 'manager'
  // Determine role based on current path for demo purposes
  const pathname = usePathname();
  let role = 'client';
  if (pathname.startsWith('/chef')) role = 'chef';
  if (pathname.startsWith('/manager')) role = 'manager';

  return {
    // In a real app, get this from auth state
    name: "User Name",
    email: "user@example.com",
    role: role, // 'client', 'chef', 'manager'
    imageUrl: undefined, // Optional: 'https://picsum.photos/40/40'
  };
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser(); // Fetch user info including role
  const { state } = useSidebar();

  const handleLogout = async () => {
    // TODO: Implement actual Firebase logout logic
    // Example:
    // try {
    //   await signOut(auth);
    //   toast({ title: "Logged Out", description: "You have been successfully logged out." });
    //   router.push('/login');
    // } catch (error: any) {
    //   toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    // }

    // Placeholder logic
    toast({ title: "Logged Out", description: "You have been successfully logged out (Simulated)." });
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const commonLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/menu', label: 'Menu', icon: BookOpen },
    { href: '/orders', label: 'My Orders', icon: UtensilsCrossed },
    { href: '/order-history', label: 'Order History', icon: History },
    { href: '/my-bill', label: 'My Bill', icon: History }, // Re-using History icon, consider a better one
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
    { href: '/manager/all-bills', label: 'All Bills', icon: Users },
    { href: '/manager/user-management', label: 'User Management', icon: Users },
  ];

  const navLinks = user.role === 'chef' ? chefLinks : user.role === 'manager' ? managerLinks : commonLinks;
  const baseHref = user.role === 'chef' ? '/chef' : user.role === 'manager' ? '/manager' : '';


  return (
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
                       isActive={pathname === link.href || (link.href !== baseHref && pathname.startsWith(link.href) && link.href.length > (baseHref.length || 1))}
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
            <AvatarImage src={user.imageUrl} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col text-xs transition-[opacity,margin] duration-200 ease-linear", state === 'collapsed' ? 'opacity-0 ml-0' : 'opacity-100 ml-0')}>
            <span className="font-semibold">{user.name}</span>
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          <Tooltip>
             <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("ml-auto h-8 w-8", state === 'collapsed' && 'hidden')} onClick={handleLogout} aria-label="Logout">
                 <LogOut size={16} />
               </Button>
             </TooltipTrigger>
             {state === 'collapsed' && (
               <TooltipContent side="right" align="center">
                 Logout
               </TooltipContent>
             )}
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
  );
}

