
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed, Clock, CheckCircle, CookingPot, XCircle, Bell, PackageSearch, DollarSign, Loader2 } from "lucide-react"; // Added DollarSign, Loader2
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order type
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility

const possibleStatuses: Order['status'][] = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function OrdersQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store ID of order being updated
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const ordersCollection = collection(db, 'orders');
    // Query for active orders initially
    const q = query(
      ordersCollection,
      where('status', 'in', ['Pending', 'Preparing', 'Ready']),
      orderBy('orderTimestamp', 'asc') // Oldest pending first
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
          const data = doc.data();
          const orderTimestamp = data.orderTimestamp instanceof Timestamp
            ? data.orderTimestamp.toDate().toISOString()
            : data.orderTimestamp || new Date().toISOString();

          fetchedOrders.push({
             id: doc.id,
             ...data,
             orderTimestamp: orderTimestamp,
             items: Array.isArray(data.items) ? data.items : [],
             total: data.total || 0, // Ensure total is a number
          } as Order);
      });

       // Client-side sorting for status priority if needed (Firestore sorts timestamp well)
       // const sortedOrders = fetchedOrders.sort((a, b) => {...}); // Keep if needed

      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching orders: ", error);
      setError("Could not fetch orders. Please try refreshing.");
      toast({ variant: "destructive", title: "Error", description: "Could not fetch orders." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
     const orderToUpdate = orders.find(o => o.id === orderId);
     if (!orderToUpdate) return;

    setIsUpdating(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Local state update is handled by the listener

      toast({ title: "Order Status Updated", description: `Order #${orderId.substring(orderId.length - 6)} is now ${newStatus}.` });

       // TODO: Implement push notification logic via Cloud Functions

    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update order status." });
    } finally {
      setIsUpdating(null);
    }
  };


 const getStatusIcon = (status: Order['status']) => {
    switch (status) {
        case 'Pending': return <Clock className="text-yellow-500 h-4 w-4" />;
        case 'Preparing': return <CookingPot className="text-blue-500 h-4 w-4" />;
        case 'Ready': return <Bell className="text-green-500 h-4 w-4" />;
        case 'Completed': return <CheckCircle className="text-gray-500 h-4 w-4" />;
        case 'Cancelled': return <XCircle className="text-red-500 h-4 w-4" />;
        default: return <Clock className="text-yellow-500 h-4 w-4" />;
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
                       <Skeleton className="h-4 w-4 rounded-full" />
                       <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-5 w-16" />
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
      <p className="text-muted-foreground mb-6">Manage incoming active orders (Pending, Preparing, Ready).</p>

       {isLoading ? (
          <Accordion type="multiple" className="space-y-4">
            {renderSkeletons(3)}
          </Accordion>
       ) : error ? (
           <Card className="text-center py-12 text-destructive">
                <CardHeader><CardTitle>Error Loading Orders</CardTitle></CardHeader>
                <CardContent>{error}</CardContent>
           </Card>
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
                      <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-xs font-medium text-primary">#{order.id.substring(order.id.length - 6)}</span>
                          <span className="font-semibold text-sm">{order.userName || 'Unknown User'}</span>
                          {getStatusIcon(order.status)}
                         <span className="text-xs text-muted-foreground">
                           ({formatDistanceToNow(new Date(order.orderTimestamp), { addSuffix: true })})
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-base font-bold flex items-center gap-1">
                             <DollarSign className="h-4 w-4 text-muted-foreground"/>
                             {displayCurrencyDual(order.total)}
                         </span>
                          <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Pending' ? 'outline' : order.status === 'Preparing' ? 'secondary' : 'default'} className="text-xs">
                                {order.status}
                          </Badge>
                      </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Items:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {order.items.map(item => (
                        <li key={item.itemId}>{item.quantity}x {item.name} ({displayCurrencyDual(item.price * item.quantity)})</li>
                      ))}
                    </ul>
                  </div>
                  {order.notes && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Notes:</h4>
                      <p className="text-sm text-muted-foreground bg-secondary p-2 rounded">{order.notes}</p>
                    </div>
                  )}
                  {order.preferredTime && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Preferred Time:</h4>
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
                       {isUpdating === order.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
    </div>
  );
}
