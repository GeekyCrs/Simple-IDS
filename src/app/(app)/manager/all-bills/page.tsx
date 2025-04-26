"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, PackageSearch, User } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast"; // Added import for useToast

// Placeholder Type - Define based on your bill structure, including user info
interface UserBill {
  id: string; // Bill ID
  userId: string;
  userName: string;
  userEmail: string;
  month: string; // e.g., "July 2024"
  total: number;
  status: 'Unpaid' | 'Paid' | 'Pending';
  dueDate?: string; // Optional due date
}

// Placeholder Data - Replace with API call to fetch all user bills
const currentMonth = format(new Date(), 'MMMM yyyy');
const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'MMMM yyyy');

const initialAllBills: UserBill[] = [
  { id: 'bill-a1', userId: 'user001', userName: 'Alice Smith', userEmail: 'alice@example.com', month: currentMonth, total: 30.00, status: 'Unpaid', dueDate: format(new Date(Date.now() + 86400000 * 7), 'PP') },
  { id: 'bill-b2', userId: 'user002', userName: 'Bob Johnson', userEmail: 'bob@example.com', month: currentMonth, total: 55.50, status: 'Unpaid', dueDate: format(new Date(Date.now() + 86400000 * 7), 'PP') },
  { id: 'bill-c3', userId: 'user003', userName: 'Charlie Brown', userEmail: 'charlie@example.com', month: currentMonth, total: 12.00, status: 'Paid' },
   { id: 'bill-d4', userId: 'user001', userName: 'Alice Smith', userEmail: 'alice@example.com', month: lastMonth, total: 45.00, status: 'Paid' },
   { id: 'bill-e5', userId: 'user002', userName: 'Bob Johnson', userEmail: 'bob@example.com', month: lastMonth, total: 62.30, status: 'Paid' },
    { id: 'bill-f6', userId: 'user004', userName: 'David Williams', userEmail: 'david@example.com', month: currentMonth, total: 0.00, status: 'Paid' }, // User with no expenses
];

const billStatuses: UserBill['status'][] = ['Unpaid', 'Paid', 'Pending'];

export default function AllBillsPage() {
  const [allBills, setAllBills] = useState<UserBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<UserBill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'Unpaid', 'Paid', 'Pending'
  const [monthFilter, setMonthFilter] = useState<string>('all'); // 'all', or specific month like "July 2024"
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast(); // Import useToast if needed for actions

   // Get unique months from the bills for filter dropdown
    const availableMonths = ['all', ...Array.from(new Set(initialAllBills.map(bill => bill.month)))];


  useEffect(() => {
    // TODO: Fetch all user bills from backend
    setIsLoading(true);
    setTimeout(() => {
      setAllBills(initialAllBills);
      setFilteredBills(initialAllBills); // Initially show all
      setIsLoading(false);
    }, 1000);
  }, []);

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

    // Filter by month
     if (monthFilter !== 'all') {
        filtered = filtered.filter(bill => bill.month === monthFilter);
     }


    setFilteredBills(filtered);
 }, [searchTerm, statusFilter, monthFilter, allBills]);


   const getStatusBadgeVariant = (status: UserBill['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Paid': return 'default'; // Green
          case 'Unpaid': return 'destructive'; // Red
          case 'Pending': return 'secondary'; // Greyish
          default: return 'outline';
      }
   };

   // Placeholder function for actions like marking as paid
   const handleMarkAsPaid = (billId: string) => {
      // TODO: Implement backend logic to mark bill as paid
       console.log(`Marking bill ${billId} as paid.`);
       // Optimistically update UI or refetch data
        setAllBills(prev => prev.map(b => b.id === billId ? {...b, status: 'Paid'} : b));
       toast({ title: "Bill Status Updated", description: `Bill #${billId.substring(billId.length - 4)} marked as Paid.`});
   }

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
             <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-2">Filter by:</span>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full md:w-[180px] h-9">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>{month === 'all' ? 'All Months' : month}</SelectItem>
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
             <div className="text-center py-12"><p className="text-muted-foreground">Loading bills...</p></div>
           ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No bills found matching your filters.</p>
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
                     <TableCell>{bill.month}</TableCell>
                     <TableCell>
                       <Badge variant={getStatusBadgeVariant(bill.status)}>{bill.status}</Badge>
                     </TableCell>
                     <TableCell>{bill.dueDate || 'N/A'}</TableCell>
                     <TableCell className="text-right font-semibold">${bill.total.toFixed(2)}</TableCell>
                     <TableCell className="text-right">
                        {/* Add actions like View Details, Mark as Paid, Send Reminder */}
                        {bill.status === 'Unpaid' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(bill.id)}>
                                Mark Paid
                            </Button>
                        )}
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
