
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, PackageSearch, User } from "lucide-react";
import { format, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Updated Type to match Firestore structure
type BillStatus = 'Unpaid' | 'Paid' | 'Pending';
interface UserBill {
  id: string; // Firestore document ID
  userId: string;
  userName: string;
  userEmail: string;
  month: string; // Display month e.g., "July 2024"
  yearMonth: string; // For filtering/sorting e.g., "2024-07"
  total: number;
  status: BillStatus;
  dueDate?: Timestamp | null; // Firestore Timestamp
  createdAt?: Timestamp;
}

// Removed Placeholder Data

const billStatuses: BillStatus[] = ['Unpaid', 'Paid', 'Pending'];

// Generate month options dynamically
const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) { // Go back 12 months
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const displayMonth = format(date, 'MMMM yyyy');
        const valueMonth = format(date, 'yyyy-MM');
        options.push({ value: valueMonth, label: displayMonth });
    }
    return options;
};

const availableMonths = [{ value: 'all', label: 'All Months' }, ...generateMonthOptions()];

export default function AllBillsPage() {
  const [allBills, setAllBills] = useState<UserBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<UserBill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all'); // Will store 'yyyy-MM' or 'all'
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBills = async () => {
      setIsLoading(true);
      try {
        const billsCollection = collection(db, 'bills');
        // Order by creation date or month, then user name for consistency
        const q = query(billsCollection, orderBy('yearMonth', 'desc'), orderBy('userName'));
        const querySnapshot = await getDocs(q);

        const fetchedBills: UserBill[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBills.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName || 'Unknown User',
            userEmail: data.userEmail || '',
            month: data.month || format(data.yearMonth ? new Date(data.yearMonth + '-02') : new Date(), 'MMMM yyyy'), // Fallback display month
            yearMonth: data.yearMonth, // e.g., "2024-07"
            total: data.total || 0,
            status: (data.status as BillStatus) || 'Pending',
            dueDate: data.dueDate || null, // Keep as Timestamp or null
            createdAt: data.createdAt,
          });
        });
        setAllBills(fetchedBills);
        setFilteredBills(fetchedBills); // Initialize with all bills
      } catch (error) {
        console.error("Error fetching bills:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Bills",
          description: "Could not fetch user bills. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [toast]);

 useEffect(() => {
    let filtered = allBills;

    // Filter by search term (user name or email)
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(bill =>
            bill.userName.toLowerCase().includes(lowerCaseSearch) ||
            bill.userEmail.toLowerCase().includes(lowerCaseSearch)
        );
    }

    // Filter by status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    // Filter by month (using yearMonth 'yyyy-MM' format)
     if (monthFilter !== 'all') {
        filtered = filtered.filter(bill => bill.yearMonth === monthFilter);
     }

    setFilteredBills(filtered);
 }, [searchTerm, statusFilter, monthFilter, allBills]);


   const getStatusBadgeVariant = (status: UserBill['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Paid': return 'default'; // Greenish / Success
          case 'Unpaid': return 'destructive'; // Red
          case 'Pending': return 'secondary'; // Greyish
          default: return 'outline';
      }
   };

   // Placeholder function for actions like marking as paid
   const handleMarkAsPaid = async (billId: string, currentStatus: BillStatus) => {
       if (currentStatus === 'Paid') return; // Already paid

       // Use a confirmation dialog? (Optional)
       const confirmMark = window.confirm(`Are you sure you want to mark bill #${billId.substring(billId.length - 6)} as Paid?`);
       if (!confirmMark) return;

       // Indicate loading state for this specific action if needed
       // setIsUpdating(billId); // Example state

        try {
            const billRef = doc(db, 'bills', billId);
            await updateDoc(billRef, {
                status: 'Paid',
                updatedAt: Timestamp.now() // Update timestamp
            });

           // Update local state optimistically
           setAllBills(prev => prev.map(b => b.id === billId ? {...b, status: 'Paid'} : b));
           toast({ title: "Bill Status Updated", description: `Bill #${billId.substring(billId.length - 6)} marked as Paid.`});
        } catch (error) {
           console.error("Error marking bill as paid:", error);
           toast({ variant: "destructive", title: "Update Failed", description: "Could not update bill status." });
        } finally {
           // setIsUpdating(null);
        }
   }

    const renderSkeletons = (rows: number) => (
       Array.from({ length: rows }).map((_, index) => (
           <TableRow key={`skeleton-row-${index}`}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
           </TableRow>
       ))
    );


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText /> All User Bills</h1>

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
             <div className="flex items-center gap-2 w-full md:w-auto flex-wrap"> {/* Added flex-wrap */}
                <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
                <span className="text-sm text-muted-foreground mr-2 hidden md:block">Filter by:</span>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full md:w-[180px] h-9">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px] h-9">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {billStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
           </CardContent>
       </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Bill Overview</CardTitle>
          <CardDescription>List of all generated bills for canteen users.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                   <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Month</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Due Date</TableHead>
                       <TableHead className="text-right">Total</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {renderSkeletons(5)}
                </TableBody>
             </Table>
           ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {allBills.length === 0 ? "No bills found in the system." : "No bills found matching your filters."}
                    </p>
                    {/* Maybe add a button to trigger bill generation if that's a feature */}
                </div>
            ) : (
             <Table>
               <TableCaption>List of user bills.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead>User</TableHead>
                   <TableHead>Month</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Due Date</TableHead>
                   <TableHead className="text-right">Total</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredBills.map((bill) => (
                   <TableRow key={bill.id}>
                     <TableCell>
                        <div className="font-medium">{bill.userName}</div>
                        <div className="text-xs text-muted-foreground">{bill.userEmail}</div>
                     </TableCell>
                     <TableCell>{bill.month}</TableCell> {/* Display month */}
                     <TableCell>
                       <Badge variant={getStatusBadgeVariant(bill.status)}>{bill.status}</Badge>
                     </TableCell>
                     <TableCell>
                         {/* Format Timestamp to readable date */}
                         {bill.dueDate ? format(bill.dueDate.toDate(), 'PP') : 'N/A'}
                     </TableCell>
                     <TableCell className="text-right font-semibold">${bill.total.toFixed(2)}</TableCell>
                     <TableCell className="text-right">
                        {/* Add actions like View Details, Mark as Paid, Send Reminder */}
                        {bill.status === 'Unpaid' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(bill.id, bill.status)}>
                                Mark Paid
                            </Button>
                        )}
                        {/* Add more actions as needed */}
                         {/* <Button size="sm" variant="ghost" className="ml-2">Details</Button> */}
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


    