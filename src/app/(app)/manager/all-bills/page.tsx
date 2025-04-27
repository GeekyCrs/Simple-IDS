
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Search, User, Eye, DollarSign, Loader2 } from "lucide-react"; // Added icons
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
// Removed aggregate and sum, will calculate manually
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility

// User Type Definition matching Firestore 'users' collection
interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'chef' | 'manager';
  status: 'active' | 'inactive';
  imageUrl?: string;
  currentMonthTotalUsd?: number; // Add field to store calculated total
}

export default function AllBillsPage() {
  const [allUsersWithBills, setAllUsersWithBills] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const fetchUsersAndBills = async () => {
      setIsLoading(true);
      setError(null);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      try {
        // 1. Fetch all billable users (e.g., clients and chefs, or filter as needed)
        const usersCollection = collection(db, 'users');
        const usersQuery = query(usersCollection, where('role', 'in', ['client', 'chef']), orderBy('name')); // Example: only clients/chefs
        const usersSnapshot = await getDocs(usersQuery);

        const fetchedUsers: User[] = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedUsers.push({
            id: doc.id,
            name: data.name || 'Unknown User',
            email: data.email || '',
            role: data.role || 'client',
            status: data.status || 'active',
            imageUrl: data.imageUrl || undefined,
            currentMonthTotalUsd: 0, // Initialize total
          } as User);
        });

        // 2. Fetch orders for each user for the current month and sum manually
        const ordersCollection = collection(db, 'orders');
        for (const user of fetchedUsers) {
          const userOrdersQuery = query(
            ordersCollection,
            where('userId', '==', user.id),
            where('orderTimestamp', '>=', Timestamp.fromDate(monthStart)),
            where('orderTimestamp', '<=', Timestamp.fromDate(monthEnd))
            // where('status', '==', 'Completed') // Optional: filter by status
          );

          // Fetch all orders for the user in the current month
          const userOrdersSnapshot = await getDocs(userOrdersQuery);
          let userTotalUsd = 0;
          userOrdersSnapshot.forEach(doc => {
              const orderData = doc.data();
              // Ensure total is a valid number before adding
              if (orderData.total && typeof orderData.total === 'number') {
                  userTotalUsd += orderData.total;
              }
          });
          user.currentMonthTotalUsd = userTotalUsd;
        }

        setAllUsersWithBills(fetchedUsers);
        setFilteredUsers(fetchedUsers); // Initialize with all users

      } catch (err) {
        console.error("Error fetching users and bills:", err);
        setError("Failed to load user bills. Please try again.");
        setAllUsersWithBills([]);
        setFilteredUsers([]);
        toast({
          variant: "destructive",
          title: "Error Loading Data",
          description: "Could not fetch user list and bills.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersAndBills();
  }, [toast]);

 useEffect(() => {
    let filtered = allUsersWithBills;

    // Filter by search term (user name or email)
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(lowerCaseSearch) ||
            user.email.toLowerCase().includes(lowerCaseSearch)
        );
    }

    // No need to filter managers here as the initial query excludes them
    setFilteredUsers(filtered);
 }, [searchTerm, allUsersWithBills]);

 const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
 }

  const handleViewBill = (userId: string) => {
     router.push(`/manager/user-bill/${userId}`); // Navigate to detailed bill page
  };

    const renderSkeletons = (rows: number) => (
       Array.from({ length: rows }).map((_, index) => (
           <TableRow key={`skeleton-row-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
           </TableRow>
       ))
    );


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText /> User Bills Overview</h1>

      {/* Filters */}
       <Card className="mb-6 shadow-sm">
           <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
             <div className="relative flex-grow w-full md:w-auto">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                 type="search"
                 placeholder="Search by user name or email..."
                 className="pl-10 w-full"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             {/* Display Current Month */}
             <div className="ml-auto text-sm text-muted-foreground">
                Showing Bills for: <span className="font-medium text-foreground">{format(new Date(), 'MMMM yyyy')}</span>
             </div>
           </CardContent>
       </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Bills ({format(new Date(), 'MMMM')})</CardTitle>
          <CardDescription>Select a user to view their detailed bill for the current month.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                   <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Role</TableHead>
                       <TableHead>Current Month Total</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {renderSkeletons(5)}
                </TableBody>
             </Table>
           ) : error ? (
               <div className="text-center py-12 text-destructive">{error}</div>
           ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {allUsersWithBills.length === 0 ? "No billable users found." : "No users found matching your search."}
                    </p>
                </div>
            ) : (
             <Table>
               <TableCaption>List of users and their current month's bill total.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                   <TableHead>Current Month Total</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredUsers.map((user) => (
                   <TableRow key={user.id}>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar className="h-9 w-9">
                             <AvatarImage src={user.imageUrl} alt={user.name} />
                             <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                           </Avatar>
                          <div className="flex flex-col">
                             <span className="font-medium">{user.name}</span>
                             <span className="text-xs text-muted-foreground">{user.email}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="capitalize">{user.role}</TableCell>
                     <TableCell>
                         <div className="flex items-center gap-1 text-sm font-medium">
                            <DollarSign className="h-4 w-4 text-primary" />
                            {displayCurrencyDual(user.currentMonthTotalUsd ?? 0)}
                         </div>
                     </TableCell>
                     <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleViewBill(user.id)} disabled={(user.currentMonthTotalUsd ?? 0) === 0}>
                            <Eye className="mr-2 h-4 w-4" /> View Bill
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
