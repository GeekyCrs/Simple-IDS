
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle, Trash2, ShoppingCart, PackageSearch, DollarSign } from "lucide-react"; // Added DollarSign
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MenuItem } from '@/types/menu';
import { useAuth } from '@/lib/auth-context'; // Import useAuth
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, doc, runTransaction, Timestamp, getDoc, serverTimestamp } from 'firebase/firestore'; // Firestore imports
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { Order, OrderItemDetail } from '@/types/order'; // Import Order types
import { formatUsd, formatLbp, convertUsdToLbp, displayCurrencyDual } from '@/lib/utils'; // Import currency utils

interface CartItem extends MenuItem {
  orderQuantity: number;
}

export default function OrderPage() {
  const { user, loading: authLoading } = useAuth(); // Get user from context
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Start with empty cart
  const [notes, setNotes] = useState('');
  const [dinnerTime, setDinnerTime] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For place order button
  const { toast } = useToast();
  const router = useRouter();

    useEffect(() => {
      if (cartItems.length === 0 && !authLoading && user) {
        // Example fetch from localStorage:
        // const savedCart = localStorage.getItem(`cart_${user.id}`);
        // if (savedCart) {
        //   try {
        //      setCartItems(JSON.parse(savedCart));
        //   } catch (e) { console.error("Failed to parse cart from localStorage", e); localStorage.removeItem(`cart_${user.id}`); }
        // }
      }
    }, [authLoading, user]); // Effect runs when auth state is known

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
       if (user && !authLoading) {
          localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
       }
    }, [cartItems, user, authLoading]);


  const updateQuantity = (itemId: string, change: number) => {
    setCartItems(prevCart => {
       const updatedCart = prevCart.map(item => {
            if (item.id === itemId) {
                const newQuantity = Math.max(0, item.orderQuantity + change);
                if (change > 0 && newQuantity > item.quantityInStock) {
                    toast({
                        variant: "destructive",
                        title: "Stock Limit Reached",
                        description: `Only ${item.quantityInStock} of ${item.name} available.`
                    });
                    return item; // Return original item without change
                }
                return { ...item, orderQuantity: newQuantity };
            }
            return item;
        }).filter(item => item.orderQuantity > 0); // Remove item if quantity becomes 0

       return updatedCart;
     });
  };


   const removeItem = (itemId: string) => {
      setCartItems(prevCart => {
        const updatedCart = prevCart.filter(item => item.id !== itemId);
        return updatedCart;
      });
     toast({ title: "Item removed from order." });
   };

  const calculateTotalUsd = () => {
    return cartItems.reduce((total, item) => total + item.price * item.orderQuantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to place an order." });
        router.push('/login');
        return;
    }
    if (cartItems.length === 0) {
        toast({ variant: "destructive", title: "Empty Order", description: "Please add items to your order first." });
        return;
    }
    setIsLoading(true);

    const totalUsd = calculateTotalUsd();

    const orderData: Omit<Order, 'id'> = {
      userId: user.id,
      userName: user.name || 'Unknown User', // Include user name for display in queue
      items: cartItems.map(item => ({
          itemId: item.id, // Keep reference to the menu item ID
          name: item.name,
          price: item.price, // Price per item in USD
          quantity: item.orderQuantity,
        })),
      total: totalUsd, // Total in USD
      notes: notes || '', // Ensure notes is not undefined
      preferredTime: dinnerTime || '', // Ensure preferredTime is not undefined
      orderTimestamp: serverTimestamp(), // Use Firestore server timestamp
      status: 'Pending', // Initial status
    };

    try {
        await runTransaction(db, async (transaction) => {
            const newOrderRef = doc(collection(db, "orders")); // Auto-generate ID
            transaction.set(newOrderRef, orderData);

            for (const item of cartItems) {
                const menuItemRef = doc(db, "menuItems", item.id);
                const menuItemSnap = await transaction.get(menuItemRef);

                if (!menuItemSnap.exists()) {
                    throw new Error(`Menu item "${item.name}" not found.`);
                }

                const currentStock = menuItemSnap.data().quantityInStock || 0;
                const newStock = currentStock - item.orderQuantity;

                if (newStock < 0) {
                    throw new Error(`Not enough stock for "${item.name}". Available: ${currentStock}`);
                }

                transaction.update(menuItemRef, { quantityInStock: newStock });
            }
        });

        console.log("Order placed successfully with transaction.");
        const formattedTotal = displayCurrencyDual(totalUsd);
        toast({ title: "Order Placed Successfully!", description: `Total: ${formattedTotal}. The chef has been notified.` });

        // Clear local cart state and persisted state
        setCartItems([]);
        setNotes('');
        setDinnerTime('');
        if (user) {
          localStorage.removeItem(`cart_${user.id}`); // Clear persisted cart for the user
        }

        router.push('/order-history');

    } catch (error: any) {
        console.error("Error placing order:", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: error.message || "Could not place the order. Please check item availability or try again later."
        });
    } finally {
        setIsLoading(false);
    }
  };

  const totalUsd = calculateTotalUsd();

  if (authLoading) {
      return (
          <div className="container mx-auto py-8 space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="lg:col-span-1">
                      <Skeleton className="h-96 w-full" />
                  </div>
              </div>
          </div>
      );
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><ShoppingCart /> Place Your Order</h1>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <CardTitle>Your Order is Empty</CardTitle>
          </CardHeader>
          <CardContent>
             <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardDescription className="mb-4">Add some items from the menu to get started.</CardDescription>
            <Link href="/menu" passHref>
              <Button className="bg-primary hover:bg-primary/90">Browse Menu</Button>
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
                <div className="flex-grow">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{displayCurrencyDual(item.price)} each</p>
                   {/* <p className="text-xs text-muted-foreground">Stock: {item.quantityInStock}</p> */}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)} disabled={isLoading}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-6 text-center">{item.orderQuantity}</span>
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)} disabled={isLoading || item.orderQuantity >= item.quantityInStock}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                 <p className="font-semibold w-28 text-right text-sm">{displayCurrencyDual(item.price * item.orderQuantity)}</p>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)} disabled={isLoading}>
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
                     rows={3}
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
                  <p className="text-xs text-muted-foreground">Specify a time if you don't want your order ASAP.</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {displayCurrencyDual(totalUsd)}
                   </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handlePlaceOrder} disabled={isLoading || cartItems.length === 0 || !user}>
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
