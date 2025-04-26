
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, PackageSearch } from "lucide-react";
import { format, startOfMonth, endOfMonth } from 'date-fns'; // For date formatting
import { useAuth } from '@/lib/auth-context'; // Import useAuth to get current user
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define Bill Item structure derived from orders
interface BillItem {
  id: string; // Use order ID or a unique ID
  date: string; // ISO String or Timestamp
  description: string; // e.g., "Order #...", "Item Name"
  amount: number;
}

interface Bill {
  month: string; // e.g., "July 2024"
  items: BillItem[];
  total: number;
  // Bill status might be fetched from a separate 'bills' collection or determined dynamically
  status: 'Unpaid' | 'Paid' | 'Pending'; // Placeholder status
}

export default function MyBillPage() {
  const { user } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = format(new Date(), 'MMMM yyyy');
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  useEffect(() => {
    if (!user) {
      setIsLoading(false); // If no user, stop loading
      return;
    }

    const fetchUserBill = async () => {
      setIsLoading(true);
      try {
        const ordersCollection = collection(db, 'orders');
        const q = query(
          ordersCollection,
          where('userId', '==', user.id),
          // Use Firestore Timestamp for filtering
          where('orderTimestamp', '>=', Timestamp.fromDate(currentMonthStart)),
          where('orderTimestamp', '<=', Timestamp.fromDate(currentMonthEnd)),
          // Fetch only completed or relevant orders for billing? Adjust as needed.
          where('status', 'in', ['Preparing', 'Ready', 'Completed']), // Example: Include orders being prepared or ready
          orderBy('orderTimestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const billItems: BillItem[] = [];
        let totalAmount = 0;

        querySnapshot.forEach((doc) => {
            const orderData = doc.data() as Order;
            const orderDate = orderData.orderTimestamp instanceof Timestamp
                ? orderData.orderTimestamp.toDate().toISOString()
                : orderData.orderTimestamp;

            // Add each item from the order as a bill item (or the whole order total)
            // Option 1: Add each item individually
            orderData.items.forEach((item, index) => {
                billItems.push({
                    id: `${doc.id}-${index}`, // Create unique ID for bill item
                    date: orderDate,
                    description: `${item.quantity}x ${item.name}`,
                    amount: item.price * item.quantity,
                });
            });
            // Option 2: Add order total as one item (Simpler)
            // billItems.push({
            //     id: doc.id,
            //     date: orderDate,
            //     description: `Order #${doc.id.substring(doc.id.length - 6)}`,
            //     amount: orderData.total,
            // });

            totalAmount += orderData.total;
        });

        // Sort bill items by date if needed (already sorted by query usually)
        billItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setBill({
          month: currentMonth,
          items: billItems,
          total: totalAmount,
          // Fetch actual status from a 'bills' collection if you have one
          status: totalAmount > 0 ? 'Unpaid' : 'Paid', // Simple logic, replace with actual status check
        });

      } catch (error) {
        console.error("Error fetching user bill:", error);
        // Handle error, maybe show toast
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBill();
  }, [user, currentMonth, currentMonthStart, currentMonthEnd]); // Rerun if user or month changes

   const getStatusBadgeVariant = (status: Bill['status']): "default" | "secondary" | "destructive" | "outline" => {
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
             <CardTitle>Bill for {currentMonth}</CardTitle>
             <CardDescription>Summary of your canteen expenses for this month.</CardDescription>
          </div>
           {isLoading ? (
                <Skeleton className="h-6 w-20" />
            ) : bill ? (
              <Badge variant={getStatusBadgeVariant(bill.status)} className="text-sm">{bill.status}</Badge>
            ) : (
              <Badge variant="secondary" className="text-sm">No Bill</Badge>
            )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderSkeletons(3)}
                </TableBody>
            </Table>
          ) : !user ? (
              <div className="text-center py-12 text-muted-foreground">Please log in to view your bill.</div>
          ) : !bill || bill.items.length === 0 ? (
             <div className="text-center py-12">
                 <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">No bill items found for this month yet.</p>
             </div>
          ) : (
            <Table>
              <TableCaption>Details of your expenses for {bill.month}.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), 'PP')}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
         {bill && bill.items.length > 0 && (
            <CardFooter className="flex justify-end items-center border-t pt-4">
                 <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total Amount Due</p>
                    <p className="text-2xl font-bold text-primary">${bill.total.toFixed(2)}</p>
                </div>
            </CardFooter>
         )}
      </Card>
    </div>
  );
}

