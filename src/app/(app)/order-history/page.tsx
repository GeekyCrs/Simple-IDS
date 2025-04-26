
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, PackageSearch } from "lucide-react";
import { format } from 'date-fns'; // For date formatting
import { useAuth } from '@/lib/auth-context'; // Import useAuth to get current user
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Removed placeholder data

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     if (!user) {
        setIsLoading(false); // Stop loading if no user
        return;
     }

    const fetchOrderHistory = async () => {
      setIsLoading(true);
      try {
        const ordersCollection = collection(db, 'orders');
        // Query orders for the current user, ordered by date descending
        const q = query(
          ordersCollection,
          where('userId', '==', user.id),
          orderBy('orderTimestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
             const data = doc.data();
              // Convert Firestore Timestamp to Date string or handle Timestamp directly
              const orderTimestamp = data.orderTimestamp instanceof Timestamp
                ? data.orderTimestamp.toDate().toISOString()
                : data.orderTimestamp || new Date().toISOString(); // Fallback

              fetchedOrders.push({
                 id: doc.id,
                 ...data,
                 orderTimestamp: orderTimestamp,
              } as Order);
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching order history:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [user]); // Dependency on user

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Completed': return 'default'; // Use primary color (green)
          case 'Preparing': return 'secondary'; // Use secondary color (greyish)
          case 'Pending': return 'outline'; // Use outline style
          case 'Ready': return 'default'; // Could use accent, but default is fine
          case 'Cancelled': return 'destructive'; // Use destructive color (red)
          default: return 'outline';
      }
  };

   const renderSkeletons = (rows: number) => (
      Array.from({ length: rows }).map((_, index) => (
          <TableRow key={`skeleton-${index}`}>
               <TableCell><Skeleton className="h-4 w-16" /></TableCell>
               <TableCell><Skeleton className="h-4 w-32" /></TableCell>
               <TableCell>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
               </TableCell>
               <TableCell><Skeleton className="h-5 w-20" /></TableCell>
               <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
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
                    <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderSkeletons(3)}
                </TableBody>
            </Table>
          ) : !user ? (
                <div className="text-center py-12 text-muted-foreground">Please log in to view your order history.</div>
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
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs">#{order.id.substring(order.id.length - 6)}</TableCell>
                     <TableCell>{format(new Date(order.orderTimestamp), 'PPp')}</TableCell> {/* Format date nicely */}
                    <TableCell>
                       <ul className="list-disc list-inside text-sm">
                          {order.items.map(item => (
                             <li key={item.itemId}>{item.quantity}x {item.name}</li> // Use itemId for key
                          ))}
                       </ul>
                       {order.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {order.notes}</p>}
                       {order.preferredTime && <p className="text-xs text-muted-foreground mt-1">Time: {order.preferredTime}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">${order.total.toFixed(2)}</TableCell>
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

      