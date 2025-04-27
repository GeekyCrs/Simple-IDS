
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, PackageSearch, DollarSign } from "lucide-react"; // Added DollarSign
import { format } from 'date-fns'; // For date formatting
import { useAuth } from '@/lib/auth-context'; // Import useAuth to get current user
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth(); // Use auth context
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     if (authLoading) {
        setIsLoading(true);
        return; // Wait for auth state
     }
     if (!user) {
        setIsLoading(false); // Stop loading if no user
        setError("Please log in to view your order history.");
        setOrders([]); // Clear any previous orders
        return;
     }

    const fetchOrderHistory = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      try {
        const ordersCollection = collection(db, 'orders');
        const q = query(
          ordersCollection,
          where('userId', '==', user.id),
          orderBy('orderTimestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
             const data = doc.data();
              const orderTimestamp = data.orderTimestamp instanceof Timestamp
                ? data.orderTimestamp.toDate().toISOString()
                : data.orderTimestamp || new Date().toISOString(); // Fallback

              fetchedOrders.push({
                 id: doc.id,
                 ...data,
                 orderTimestamp: orderTimestamp,
                 items: Array.isArray(data.items) ? data.items : [], // Ensure items array
                 total: data.total || 0, // Ensure total is a number
              } as Order);
        });
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching order history:", err);
        setError("Could not load your order history. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [user, authLoading]); // Dependency on user and authLoading

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Completed': return 'default';
          case 'Preparing': return 'secondary';
          case 'Pending': return 'outline';
          case 'Ready': return 'default';
          case 'Cancelled': return 'destructive';
          default: return 'outline';
      }
  };

   const renderSkeletons = (rows: number) => (
      Array.from({ length: rows }).map((_, index) => (
          <TableRow key={`skeleton-row-${index}`}>
               <TableCell><Skeleton className="h-4 w-16" /></TableCell>
               <TableCell><Skeleton className="h-4 w-32" /></TableCell>
               <TableCell>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
               </TableCell>
               <TableCell><Skeleton className="h-5 w-20" /></TableCell>
               <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
          </TableRow>
      ))
   );


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><History /> Order History</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Past Orders</CardTitle>
          <CardDescription>Review details of your previous canteen orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[150px]">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderSkeletons(5)}
                </TableBody>
            </Table>
          ) : error ? (
             <div className="text-center py-12 text-destructive">{error}</div>
          ) : orders.length === 0 ? (
             <div className="text-center py-12">
                <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">You haven't placed any orders yet.</p>
             </div>
          ) : (
            <Table>
               <TableCaption>A list of your recent orders.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[150px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs">#{order.id.substring(order.id.length - 6)}</TableCell>
                     <TableCell>{format(new Date(order.orderTimestamp), 'PPp')}</TableCell> {/* Format date nicely */}
                    <TableCell>
                       <ul className="list-disc list-inside text-sm space-y-1">
                          {order.items.map((item, index) => (
                             <li key={`${order.id}-${item.itemId}-${index}`}>
                                {item.quantity}x {item.name} ({displayCurrencyDual(item.price * item.quantity)})
                             </li>
                          ))}
                       </ul>
                       {order.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {order.notes}</p>}
                       {order.preferredTime && <p className="text-xs text-muted-foreground mt-1">Time: {order.preferredTime}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                        <div className="flex items-center justify-end gap-1">
                           <DollarSign className="h-3.5 w-3.5 text-muted-foreground"/>
                           {displayCurrencyDual(order.total)}
                        </div>
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
