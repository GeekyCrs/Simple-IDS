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


// Re-use types from order history, add user info if needed
interface OrderItemDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderDate: string; // ISO String or Timestamp
  userName: string; // Need user info for display
  items: OrderItemDetail[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  notes?: string;
  preferredTime?: string;
}

// Placeholder Data - Replace with real-time data subscription (e.g., Firestore listener)
const initialOrders: Order[] = [
   {
    id: 'order789',
    orderDate: new Date(Date.now() - 60000 * 5).toISOString(), // 5 mins ago
    userName: "Alice Smith",
    items: [{ id: '5', name: 'Cheesecake', quantity: 1, price: 5.50 }],
    total: 5.50,
    status: 'Pending',
    preferredTime: 'ASAP',
  },
  {
    id: 'orderABC',
    orderDate: new Date(Date.now() - 60000 * 15).toISOString(), // 15 mins ago
    userName: "Bob Johnson",
    items: [
      { id: '1', name: 'Classic Burger', quantity: 1, price: 9.50 },
      { id: 'item-coke', name: 'Coca-Cola Can', quantity: 1, price: 1.50 }, // Assuming price
    ],
    total: 11.00,
    status: 'Pending',
    notes: 'Well done patty',
  },
   {
    id: 'orderDEF',
    orderDate: new Date(Date.now() - 60000 * 30).toISOString(), // 30 mins ago
    userName: "Charlie Brown",
    items: [{ id: '2', name: 'Caesar Salad', quantity: 1, price: 7.00 }],
    total: 7.00,
    status: 'Preparing',
     preferredTime: '12:30',
  },
   {
    id: 'orderGHI',
    orderDate: new Date(Date.now() - 60000 * 45).toISOString(), // 45 mins ago
    userName: "Diana Prince",
    items: [{ id: '3', name: 'Espresso', quantity: 2, price: 2.50 }],
    total: 5.00,
    status: 'Ready',
  },
];

const possibleStatuses: Order['status'][] = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function OrdersQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store ID of order being updated
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Set up real-time listener for new/updated orders (e.g., Firebase onSnapshot)
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      // Sort orders: Pending -> Preparing -> Ready -> Others (by date desc)
       const sortedOrders = initialOrders.sort((a, b) => {
          const statusOrder = { 'Pending': 1, 'Preparing': 2, 'Ready': 3, 'Completed': 4, 'Cancelled': 5 };
          const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          if (statusDiff !== 0) return statusDiff;
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(); // Newest first within same status
       });
       setOrders(sortedOrders);
      setIsLoading(false);
    }, 1000);

    // Cleanup listener on component unmount
     return () => {
       // unsubscribe(); // Firebase example
     };
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(orderId);
    try {
      // TODO: Update order status in the backend
      console.log(`Updating order ${orderId} to ${newStatus}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      // Update local state optimistically or after confirmation
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ).sort((a, b) => { // Re-sort after update
           const statusOrder = { 'Pending': 1, 'Preparing': 2, 'Ready': 3, 'Completed': 4, 'Cancelled': 5 };
           const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
           if (statusDiff !== 0) return statusDiff;
           return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        })
      );

      toast({ title: "Order Status Updated", description: `Order #${orderId.substring(orderId.length - 6)} is now ${newStatus}.` });

       // TODO: Optionally send push notification to user when 'Ready' or 'Cancelled'
       // if (newStatus === 'Ready') {
       //   sendPushNotification(order.userId, `Your order #${orderId.substring(orderId.length - 6)} is ready for pickup!`);
       // } else if (newStatus === 'Cancelled') {
       //   sendPushNotification(order.userId, `Your order #${orderId.substring(orderId.length - 6)} has been cancelled.`);
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
        case 'Completed': return <CheckCircle className="text-gray-500" />;
        case 'Cancelled': return <XCircle className="text-red-500" />;
        default: return null;
    }
 };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><UtensilsCrossed /> Orders Queue</h1>
      <p className="text-muted-foreground mb-6">Manage incoming orders and update their status.</p>

       {isLoading ? (
         <div className="text-center py-12"><p className="text-muted-foreground">Loading orders...</p></div>
       ) : orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length === 0 ? (
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
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-medium text-primary">#{order.id.substring(order.id.length - 6)}</span>
                         <span className="font-semibold">{order.userName}</span>
                          {getStatusIcon(order.status)}
                         <span className="text-xs text-muted-foreground">
                            ({formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })})
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                          <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Pending' ? 'outline' : 'secondary'} className="text-xs">
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
                        <li key={item.id}>{item.quantity}x {item.name} (${(item.price * item.quantity).toFixed(2)})</li>
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

