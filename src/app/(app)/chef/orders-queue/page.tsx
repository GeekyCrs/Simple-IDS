
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed, Clock, CheckCircle, CookingPot, XCircle, Bell, PackageSearch } from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type

// Removed placeholder data

const possibleStatuses: Order['status'][] = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function OrdersQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store ID of order being updated
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const ordersCollection = collection(db, 'orders');
    // Query for active orders (not Completed or Cancelled) initially, sorted by status priority then date
    const q = query(
      ordersCollection,
      where('status', 'in', ['Pending', 'Preparing', 'Ready']),
      orderBy('status'), // Firestore doesn't perfectly sort by enum order, needs client-side sort too
      orderBy('orderTimestamp', 'desc') // Or 'asc' depending on desired queue order
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to Date string if needed, or handle Timestamp directly
          const orderTimestamp = data.orderTimestamp instanceof Timestamp
            ? data.orderTimestamp.toDate().toISOString()
            : data.orderTimestamp || new Date().toISOString(); // Fallback

          fetchedOrders.push({
             id: doc.id,
             ...data,
             orderTimestamp: orderTimestamp, // Ensure it's a usable format
          } as Order);
      });

       // Client-side sorting for precise status order
       const sortedOrders = fetchedOrders.sort((a, b) => {
          const statusOrder = { 'Pending': 1, 'Preparing': 2, 'Ready': 3 }; // Only sort active statuses here
          const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          if (statusDiff !== 0) return statusDiff;
           // Use Timestamp for accurate date comparison if available, else fallback to ISO string
           const dateA = a.orderTimestamp instanceof Timestamp ? a.orderTimestamp.toMillis() : new Date(a.orderTimestamp).getTime();
           const dateB = b.orderTimestamp instanceof Timestamp ? b.orderTimestamp.toMillis() : new Date(b.orderTimestamp).getTime();
           return dateB - dateA; // Newest first within same status
       });

      setOrders(sortedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching orders: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch orders." });
      setIsLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [toast]);


  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
     const orderToUpdate = orders.find(o => o.id === orderId);
     if (!orderToUpdate) return;

    setIsUpdating(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Local state update is handled by the onSnapshot listener, but you might
      // want an optimistic update here for better perceived performance.
      // setOrders(prevOrders => ... ); // Optimistic update removed as listener handles it

      toast({ title: "Order Status Updated", description: `Order #${orderId.substring(orderId.length - 6)} is now ${newStatus}.` });

       // TODO: Implement push notification logic if needed
       // This usually requires a backend function triggered by the Firestore update.
       // Example: Trigger a Cloud Function when status changes to 'Ready' or 'Cancelled'.
       // if (newStatus === 'Ready') {
       //   sendPushNotification(orderToUpdate.userId, `Your order #${orderId.substring(orderId.length - 6)} is ready for pickup!`);
       // } else if (newStatus === 'Cancelled') {
       //   sendPushNotification(orderToUpdate.userId, `Your order #${orderId.substring(orderId.length - 6)} has been cancelled.`);
       // }

    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update order status." });
    } finally {
      setIsUpdating(null);
    }
  };


 const getStatusIcon = (status: Order['status']) => {
    switch (status) {
        case 'Pending': return <Clock className="text-yellow-500" />;
        case 'Preparing': return <CookingPot className="text-blue-500" />;
        case 'Ready': return <Bell className="text-green-500" />;
        case 'Completed': return <CheckCircle className="text-gray-500" />; // Should not appear in active queue
        case 'Cancelled': return <XCircle className="text-red-500" />; // Should not appear in active queue
        default: return <Clock className="text-yellow-500" />; // Default to pending icon
    }
 };

  const renderSkeletons = (count: number) => (
      Array.from({ length: count }).map((_, index) => (
          <AccordionItem key={`skeleton-${index}`} value={`skeleton-${index}`} className="bg-card rounded-lg shadow-md border opacity-50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                 <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-5 w-16" />
                       <Skeleton className="h-5 w-24" />
                       <Skeleton className="h-5 w-5 rounded-full" />
                       <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                 </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                   <div className="flex items-center gap-2 pt-4 border-t">
                     <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-9 w-40" />
                   </div>
              </AccordionContent>
            </AccordionItem>
      ))
   );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><UtensilsCrossed /> Orders Queue</h1>
      <p className="text-muted-foreground mb-6">Manage incoming orders and update their status.</p>

       {isLoading ? (
          <div className="space-y-4">
            {renderSkeletons(3)}
          </div>
       ) : orders.length === 0 ? (
          <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                 <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardDescription>There are no pending, preparing, or ready orders right now.</CardDescription>
              </CardContent>
            </Card>
        ) : (
        <Accordion type="multiple" className="space-y-4">
            {orders.map((order) => (
              <AccordionItem key={order.id} value={order.id} className="bg-card rounded-lg shadow-md border">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                   <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3 flex-wrap"> {/* Added flex-wrap */}
                         <span className="text-sm font-medium text-primary">#{order.id.substring(order.id.length - 6)}</span>
                          <span className="font-semibold">{order.userName || 'Unknown User'}</span>
                          {getStatusIcon(order.status)}
                         <span className="text-xs text-muted-foreground">
                           ({formatDistanceToNow(new Date(order.orderTimestamp), { addSuffix: true })})
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                          <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Pending' ? 'outline' : order.status === 'Preparing' ? 'secondary' : 'default'} className="text-xs">
                                {order.status}
                          </Badge>
                      </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Items:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {order.items.map(item => (
                        <li key={item.itemId}>{item.quantity}x {item.name} (${(item.price * item.quantity).toFixed(2)})</li>
                      ))}
                    </ul>
                  </div>
                  {order.notes && (
                    <div>
                      <h4 className="font-semibold mb-1">Notes:</h4>
                      <p className="text-sm text-muted-foreground bg-secondary p-2 rounded">{order.notes}</p>
                    </div>
                  )}
                  {order.preferredTime && (
                    <div>
                      <h4 className="font-semibold mb-1">Preferred Time:</h4>
                      <p className="text-sm font-medium">{order.preferredTime}</p>
                    </div>
                  )}
                   <div className="flex items-center gap-2 pt-4 border-t">
                     <span className="text-sm font-medium">Update Status:</span>
                      <Select
                          value={order.status}
                          onValueChange={(value: Order['status']) => handleStatusUpdate(order.id, value)}
                          disabled={isUpdating === order.id}
                      >
                         <SelectTrigger className="w-[180px] h-9" disabled={isUpdating === order.id}>
                            <SelectValue placeholder="Change status" />
                         </SelectTrigger>
                         <SelectContent>
                           {possibleStatuses.map(status => (
                             <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                       {isUpdating === order.id && <span className="text-xs text-muted-foreground">Updating...</span>}
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
    </div>
  );
}

