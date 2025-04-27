
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Search, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar

// User Type Definition matching Firestore 'users' collection
interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'chef' | 'manager';
  status: 'active' | 'inactive';
  imageUrl?: string;
}

export default function AllBillsPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        // Fetch only clients and chefs (or maybe all users except managers?)
        // For simplicity, fetch all for now, can filter later if needed
        const q = query(usersCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
           // Only include active clients/chefs if needed for billing
           // if (data.role !== 'manager' && data.status === 'active') {
              fetchedUsers.push({
                id: doc.id,
                name: data.name || 'Unknown User',
                email: data.email || '',
                role: data.role || 'client',
                status: data.status || 'active',
                imageUrl: data.imageUrl || undefined,
              } as User);
           // }
        });
        setAllUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers); // Initialize with all users
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Users",
          description: "Could not fetch user list for billing. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

 useEffect(() => {
    let filtered = allUsers;

    // Filter by search term (user name or email)
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(lowerCaseSearch) ||
            user.email.toLowerCase().includes(lowerCaseSearch)
        );
    }

    // Optional: Filter out managers if they shouldn't have bills shown
    filtered = filtered.filter(user => user.role !== 'manager');

    setFilteredUsers(filtered);
 }, [searchTerm, allUsers]);

 const getInitials = (name: string) => {
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
             {/* Removed month/status filters as we show users now */}
           </CardContent>
       </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List for Billing</CardTitle>
          <CardDescription>Select a user to view their detailed bill.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                   <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Email</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {renderSkeletons(5)}
                </TableBody>
             </Table>
           ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {allUsers.filter(u => u.role !== 'manager').length === 0 ? "No billable users found." : "No users found matching your search."}
                    </p>
                </div>
            ) : (
             <Table>
               <TableCaption>List of users with potential bills.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead>User</TableHead>
                   <TableHead>Email</TableHead>
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
                          <span className="font-medium">{user.name}</span>
                        </div>
                     </TableCell>
                     <TableCell>{user.email}</TableCell>
                     <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleViewBill(user.id)}>
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

    
