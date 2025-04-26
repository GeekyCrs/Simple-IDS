
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, PackageSearch } from "lucide-react";
import { format, startOfMonth, endOfMonth } from 'date-fns'; // For date formatting
import { useAuth } from '@/lib/auth-context'; // Import useAuth to get current user
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Re-evaluate if Order type is needed here, maybe Bill type?
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define Bill Item structure (if needed, or just show total)
// interface BillItem {
//   id: string; // Use order ID or a unique ID
//   date: string; // ISO String or Timestamp
//   description: string; // e.g., "Order #...", "Item Name"
//   amount: number;
// }

// Updated Bill type to match Firestore 'bills' collection
interface Bill {
  id: string; // Firestore document ID for the bill
  month: string; // Display month e.g., "July 2024"
  yearMonth: string; // e.g., "2024-07" used as ID or key field
  total: number;
  status: 'Unpaid' | 'Paid' | 'Pending';
  dueDate?: Timestamp | null;
  // items?: BillItem[]; // Optional: If bill documents store item details
}

export default function MyBillPage() {
  const { user, loading: authLoading } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentDisplayMonth = format(new Date(), 'MMMM yyyy');
  const currentYearMonth = format(new Date(), 'yyyy-MM'); // Format for ID/Query

  useEffect(() => {
    if (authLoading) {
        setIsLoading(true); // Keep loading while auth state is resolving
        return;
    }
    if (!user) {
      setIsLoading(false); // If no user after auth check, stop loading
      setBill(null); // Clear any previous bill state
      return;
    }

    const fetchUserBill = async () => {
      setIsLoading(true);
      try {
        // Construct the potential bill document ID (e.g., userId_yyyy-MM)
        // Or query the 'bills' collection
        // Option 1: Query by userId and yearMonth
        const billsCollection = collection(db, 'bills');
        const q = query(
            billsCollection,
            where('userId', '==', user.id),
            where('yearMonth', '==', currentYearMonth),
            orderBy('createdAt', 'desc'), // Get the latest bill if multiple exist (shouldn't happen ideally)
            limit(1) // Expect only one bill per user per month
        );
        const querySnapshot = await getDocs(q);


        if (!querySnapshot.empty) {
            const billDoc = querySnapshot.docs[0];
            const billData = billDoc.data();
            setBill({
                id: billDoc.id,
                month: billData.month || currentDisplayMonth, // Use stored month or format current
                yearMonth: billData.yearMonth,
                total: billData.total || 0,
                status: (billData.status as Bill['status']) || 'Pending',
                dueDate: billData.dueDate || null,
                // items: billData.items || [], // If items are stored
            });
        } else {
            // No bill document found for this user and month
            console.log(`No bill found for user ${user.id} for month ${currentYearMonth}`);
            setBill(null); // Set bill to null if none found
        }

      } catch (error) {
        console.error("Error fetching user bill:", error);
        setBill(null); // Clear bill on error
        // Handle error, maybe show toast
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBill();
  }, [user, authLoading, currentYearMonth, currentDisplayMonth]); // Rerun if user or month changes

   const getStatusBadgeVariant = (status?: Bill['status']): "default" | "secondary" | "destructive" | "outline" => {
      if (!status) return 'secondary'; // Default if status is missing
      switch (status) {
          case 'Paid': return 'default'; // Green
          case 'Unpaid': return 'destructive'; // Red
          case 'Pending': return 'secondary'; // Greyish
          default: return 'outline';
      }
   };

   const renderSkeletons = (rows: number) => (
        Array.from({ length: rows }).map((_, index) => (
            <TableRow key={`skeleton-row-${index}`}>
                 <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                 <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
            </TableRow>
        ))
     );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText /> My Monthly Bill</h1>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
             <CardTitle>Bill for {currentDisplayMonth}</CardTitle>
             <CardDescription>Summary of your canteen expenses for this month.</CardDescription>
          </div>
           {isLoading ? (
                <Skeleton className="h-6 w-20 rounded-md" />
            ) : bill ? (
              <Badge variant={getStatusBadgeVariant(bill.status)} className="text-sm">{bill.status}</Badge>
            ) : (
              <Badge variant="secondary" className="text-sm">No Bill Yet</Badge>
            )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="py-12 text-center text-muted-foreground">Loading bill details...</div>
            // Optionally show table skeleton if you plan to show item details
            // <Table>...</Table>
          ) : !user ? (
              <div className="text-center py-12 text-muted-foreground">Please log in to view your bill.</div>
          ) : !bill ? (
             <div className="text-center py-12">
                 <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">No bill has been generated for you for {currentDisplayMonth} yet.</p>
                 <p className="text-xs text-muted-foreground mt-2">Bills are typically generated at the end of the month.</p>
             </div>
          ) : (
             // If bill exists, display the total.
             // You might fetch and display individual items if they are stored in the bill doc.
             <div className="text-center py-12">
                <p className="text-muted-foreground">Your total expense for {bill.month} is:</p>
                <p className="text-4xl font-bold text-primary mt-2">${bill.total.toFixed(2)}</p>
                {bill.dueDate && (
                   <p className="text-sm text-muted-foreground mt-4">
                      Due Date: {format(bill.dueDate.toDate(), 'PP')}
                   </p>
                )}
                 {/* Add button to pay? */}
             </div>
            // <Table>
            //   <TableCaption>Details of your expenses for {bill.month}.</TableCaption>
            //   <TableHeader>...</TableHeader>
            //   <TableBody>...</TableBody> // Render bill.items here if available
            // </Table>
          )}
        </CardContent>
         {bill && !isLoading && (
            <CardFooter className="flex justify-end items-center border-t pt-4">
                 <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">${bill.total.toFixed(2)}</p>
                </div>
            </CardFooter>
         )}
         {!bill && !isLoading && user && (
             <CardFooter className="justify-center border-t pt-4">
                 <p className="text-sm text-muted-foreground">Check back later for your bill.</p>
             </CardFooter>
         )}
      </Card>
    </div>
  );
}


    