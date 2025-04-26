
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, UtensilsCrossed, BookOpen, History, Settings, LogOut, Users, Package, ChefHat, FileText, UserCog } from 'lucide-react'; // Added missing icons
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
import { cn } from '@/lib/utils';
import { auth } from '@/firebase/firebase-config'; // Import Firebase auth
import { signOut } from 'firebase/auth'; // Import signOut
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';


// Custom hook to manage user state and role
const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('client'); // Default role
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{ name?: string; email?: string; imageUrl?: string }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch role and other data from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setRole(data?.role || 'client');
          setUserData({
              name: data?.name || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || 'No Email',
              imageUrl: data?.imageUrl // Assuming imageUrl is stored in Firestore
          });
        } else {
           console.warn(`No user document found for UID: ${firebaseUser.uid}. Using default role and info.`);
           setRole('client');
           setUserData({
              name: firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || 'No Email',
              imageUrl: undefined
           });
        }
      } else {
        setUser(null);
        setRole('client'); // Reset role on logout
        setUserData({});
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, role, userData, loading };
};


export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { role, userData, loading, user: firebaseUser } = useAuthUser(); // Use the custom hook
  const { state } = useSidebar();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Use Firebase signOut
      // Clear the simulated cookie
      document.cookie = 'auth-session=; path=/; max-age=0';
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login after successful logout
      router.refresh(); // Force refresh to clear state
    } catch (error: any) {
       console.error("Logout Failed:", error);
       toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const commonLinks = [
    { href: '/app/dashboard', label: 'Dashboard', icon: Home },
    { href: '/app/menu', label: 'Menu', icon: BookOpen },
    { href: '/app/orders', label: 'Place Order', icon: UtensilsCrossed }, // Renamed for clarity
    { href: '/app/order-history', label: 'Order History', icon: History },
    { href: '/app/my-bill', label: 'My Bill', icon: FileText }, // Changed icon
  ];

  const chefLinks = [
    { href: '/app/chef/dashboard', label: 'Chef Dashboard', icon: ChefHat },
    { href: '/app/chef/manage-menu', label: 'Manage Menu', icon: BookOpen },
    { href: '/app/chef/manage-stock', label: 'Manage Stock', icon: Package },
    { href: '/app/chef/orders-queue', label: 'Orders Queue', icon: UtensilsCrossed },
  ];

  const managerLinks = [
    { href: '/app/manager/dashboard', label: 'Manager Dash', icon: Settings },
    { href: '/app/manager/manage-menu', label: 'Manage Menu', icon: BookOpen },
    { href: '/app/manager/manage-stock', label: 'Manage Stock', icon: Package },
    { href: '/app/manager/all-bills', label: 'All Bills', icon: FileText }, // Changed icon
    { href: '/app/manager/manage-users', label: 'Manage Users', icon: UserCog }, // Changed icon
  ];

  // Determine links based on fetched role
   const navLinks = role === 'chef' ? chefLinks : role === 'manager' ? managerLinks : commonLinks;
   const baseHref = role === 'chef' ? '/app/chef' : role === 'manager' ? '/app/manager' : '/app';

  // While loading auth state, show skeleton or nothing
   if (loading) {
       return (
         <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
            <SidebarHeader className="p-2 items-center gap-2">
                 <Skeleton className="h-6 w-6" />
                 <Skeleton className="h-6 w-32" />
            </SidebarHeader>
            <Separator className="my-1" />
            <SidebarContent className="p-2 space-y-2">
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

  // If not logged in (no firebaseUser), don't render the sidebar (or render a minimal version)
  // This depends on whether the layout itself should be shown for non-app routes.
  // Assuming this layout is ONLY for /app routes, we proceed. If not, add conditional rendering.
  // if (!firebaseUser) {
  //   return null; // Don't render sidebar if not logged in and inside /app layout
  // }


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
                         isActive={pathname === link.href || (pathname.startsWith(link.href) && link.href !== baseHref)}
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
               <AvatarImage src={userData.imageUrl} alt={userData.name || 'User'} />
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
