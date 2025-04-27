
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { FileText, PackageSearch, DollarSign } from "lucide-react"; // Added DollarSign
import { format, startOfMonth, endOfMonth } from 'date-fns'; // For date formatting
import { useAuth } from '@/lib/auth-context'; // Import useAuth to get current user
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility

export default function MyBillPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthTotalUsd, setCurrentMonthTotalUsd] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const currentDisplayMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    // Don't fetch until auth state is determined
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // If no user is logged in, stop loading and show appropriate message
    if (!user) {
      setIsLoading(false);
      setOrders([]);
      setCurrentMonthTotalUsd(0);
      setError("Please log in to view your bill details.");
      return;
    }

    // Fetch orders if user is logged in
    const fetchUserOrdersForMonth = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      try {
        const ordersCollection = collection(db, 'orders');
        const q = query(
          ordersCollection,
          where('userId', '==', user.id),
          where('orderTimestamp', '>=', Timestamp.fromDate(monthStart)),
          where('orderTimestamp', '<=', Timestamp.fromDate(monthEnd)),
          orderBy('orderTimestamp', 'desc') // Show most recent first
        );
        const querySnapshot = await getDocs(q);

        const fetchedOrders: Order[] = [];
        let total = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const orderTimestamp = data.orderTimestamp instanceof Timestamp
            ? data.orderTimestamp.toDate().toISOString()
            : data.orderTimestamp || new Date().toISOString();

          const order = {
            id: doc.id,
            ...data,
            orderTimestamp: orderTimestamp,
            items: Array.isArray(data.items) ? data.items : [], // Ensure items is an array
          } as Order;

          fetchedOrders.push(order);
          total += order.total || 0; // Sum up the total (ensure total is a number)
        });

        setOrders(fetchedOrders);
        setCurrentMonthTotalUsd(total);

      } catch (err) {
        console.error("Error fetching user orders:", err);
        setError("Could not load your bill details. Please try again later.");
        setOrders([]);
        setCurrentMonthTotalUsd(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserOrdersForMonth();
  }, [user, authLoading]); // Rerun when user or authLoading changes

  const renderSkeletons = (rows: number) => (
    Array.from({ length: rows }).map((_, index) => (
      <TableRow key={`skeleton-row-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText /> My Bill Details</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Details for {currentDisplayMonth}</CardTitle>
          <CardDescription>Detailed view of your canteen expenses for this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderSkeletons(3)}
              </TableBody>
            </Table>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You have no orders recorded for {currentDisplayMonth} yet.</p>
            </div>
          ) : (
            <Table>
              <TableCaption>Your expenses for {currentDisplayMonth}.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.orderTimestamp), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-sm">
                        {order.items.map((item, index) => (
                          <li key={`${order.id}-${item.itemId}-${index}`}>
                            {item.quantity}x {item.name} ({displayCurrencyDual(item.price * item.quantity)})
                          </li>
                        ))}
                      </ul>
                      {order.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {order.notes}</p>}
                      {order.preferredTime && <p className="text-xs text-muted-foreground mt-1">Time: {order.preferredTime}</p>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        {displayCurrencyDual(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-end items-center border-t pt-4">
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Total for {currentDisplayMonth}</p>
            <p className="text-2xl font-bold text-primary flex items-center justify-end gap-1">
                <DollarSign className="h-5 w-5" />
                {displayCurrencyDual(currentMonthTotalUsd)}
            </p>
            {/* Maybe add payment status info here later if needed */}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
