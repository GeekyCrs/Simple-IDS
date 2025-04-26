"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, PackageSearch } from "lucide-react";
import { format } from 'date-fns'; // For date formatting

// Placeholder Type - Define based on your actual order structure
interface OrderItemDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderDate: string; // ISO String or Timestamp
  items: OrderItemDetail[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'; // Example statuses
  notes?: string;
  preferredTime?: string;
}

// Placeholder Data - Replace with API call to fetch user's order history
const initialOrderHistory: Order[] = [
  {
    id: 'order123',
    orderDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    items: [
      { id: '1', name: 'Classic Burger', quantity: 1, price: 9.50 },
      { id: '3', name: 'Espresso', quantity: 1, price: 2.50 },
    ],
    total: 12.00,
    status: 'Completed',
    notes: 'No pickles',
    preferredTime: '19:00',
  },
  {
    id: 'order456',
    orderDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    items: [{ id: '2', name: 'Caesar Salad', quantity: 2, price: 7.00 }],
    total: 14.00,
    status: 'Completed',
  },
   {
    id: 'order789',
    orderDate: new Date().toISOString(), // Today
    items: [{ id: '5', name: 'Cheesecake', quantity: 1, price: 5.50 }],
    total: 5.50,
    status: 'Preparing',
     preferredTime: 'ASAP',
  },
];

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch order history for the current user from backend/database
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      setOrders(initialOrderHistory);
      setIsLoading(false);
    }, 1000);
  }, []);

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
            <div className="flex justify-center items-center h-40">
               <p className="text-muted-foreground">Loading order history...</p>
               {/* Add Skeleton loaders here for better UX */}
            </div>
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
                    <TableCell>{format(new Date(order.orderDate), 'PPp')}</TableCell> {/* Format date nicely */}
                    <TableCell>
                       <ul className="list-disc list-inside text-sm">
                          {order.items.map(item => (
                             <li key={item.id}>{item.quantity}x {item.name}</li>
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
