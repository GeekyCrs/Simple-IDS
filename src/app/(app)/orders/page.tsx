"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Assume cart state is managed globally (e.g., Zustand, Context) or passed via props/local storage
// For this example, we'll simulate fetching/passing cart data.
// Re-use types from menu page
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  quantityInStock: number;
}

interface CartItem extends MenuItem {
  orderQuantity: number;
}

// Placeholder cart data - in a real app, this would come from state management
const initialCart: CartItem[] = [
   { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese, bun', price: 9.50, category: 'Lunch', imageUrl: 'https://picsum.photos/seed/burger/200/150', quantityInStock: 50, orderQuantity: 1 },
   { id: '3', name: 'Espresso', description: 'Strong black coffee', price: 2.50, category: 'Beverage', imageUrl: 'https://picsum.photos/seed/coffee/200/150', quantityInStock: 100, orderQuantity: 2 },
];

export default function OrderPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart); // Replace with actual cart state
  const [notes, setNotes] = useState('');
  const [dinnerTime, setDinnerTime] = useState(''); // Store as string HH:mm
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const updateQuantity = (itemId: string, change: number) => {
    setCartItems(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, orderQuantity: Math.max(0, item.orderQuantity + change) } // Ensure quantity doesn't go below 0
          : item
      ).filter(item => item.orderQuantity > 0) // Remove item if quantity is 0
    );
  };

   const removeItem = (itemId: string) => {
    setCartItems(prevCart => prevCart.filter(item => item.id !== itemId));
     toast({ title: "Item removed from order." });
   };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.orderQuantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
        toast({ variant: "destructive", title: "Empty Order", description: "Please add items to your order first." });
        return;
    }
    setIsLoading(true);

    const orderData = {
      items: cartItems.map(item => ({ id: item.id, quantity: item.orderQuantity })),
      total: calculateTotal(),
      notes: notes,
      preferredTime: dinnerTime,
      orderTimestamp: new Date().toISOString(),
      // userId: 'current_user_id' // Get from auth context
    };

    // TODO: Implement actual order placement logic
    // 1. Send order data to backend/Firebase function
    // 2. Update user's bill in the database
    // 3. Update stock levels (potentially needs transactional logic)
    // 4. Send push notification to Chef
    // 5. Clear the cart state

    // Placeholder logic
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    console.log("Placing order:", orderData);
    toast({ title: "Order Placed Successfully!", description: `Total: $${calculateTotal().toFixed(2)}. The chef has been notified.` });

    // Simulate clearing cart and redirecting
    setCartItems([]);
    setNotes('');
    setDinnerTime('');
    setIsLoading(false);
    router.push('/order-history'); // Redirect to order history or dashboard
  };

  const total = calculateTotal();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><ShoppingCart /> Place Your Order</h1>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Your Order is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Add some items from the menu to get started.</CardDescription>
            <Link href="/menu" passHref>
              <Button>Browse Menu</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Order Items</h2>
            {cartItems.map(item => (
              <Card key={item.id} className="flex items-center p-4 gap-4 shadow-sm">
                 {item.imageUrl && (
                   <div className="relative h-16 w-16 rounded overflow-hidden shrink-0">
                     <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" />
                   </div>
                 )}
                <div className="flex-grow">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-6 text-center">{item.orderQuantity}</span>
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                 <p className="font-semibold w-16 text-right">${(item.price * item.orderQuantity).toFixed(2)}</p>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </Card>
            ))}
          </div>

          {/* Order Options & Total */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Extra spicy, no onions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dinnerTime">Preferred Time (optional)</Label>
                  <Input
                    id="dinnerTime"
                    type="time"
                    value={dinnerTime}
                    onChange={(e) => setDinnerTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handlePlaceOrder} disabled={isLoading}>
                  {isLoading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
