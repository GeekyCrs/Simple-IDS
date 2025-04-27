
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, Check, Utensils, BookOpen, Loader2, XCircle, DollarSign } from "lucide-react"; // Added DollarSign
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, getDocs, limit, Timestamp, addDoc, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore'; // Firestore imports
import type { MenuItem } from '@/types/menu'; // Use MenuItem for structure consistency if needed
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility
import { useAuth } from '@/lib/auth-context'; // Import useAuth
import type { Order } from '@/types/order'; // Import Order type
import { useRouter } from 'next/navigation';

// Define a type for the daily meal post structure (price is USD)
interface DailyMealPost {
  id: string; // Firestore document ID (usually the date YYYY-MM-DD)
  name: string;
  description: string;
  price: number; // Price in USD
  date: string; // YYYY-MM-DD format
  postedAt: Timestamp; // Firestore Timestamp when posted
}

export default function ClientDashboardPage() {
  const { user, loading: authLoading } = useAuth(); // Get user context
  const [dailyMeal, setDailyMeal] = useState<DailyMealPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false); // Loading state for ordering button
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchDailyMeal = async () => {
      setIsLoading(true);
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');
      try {
        const dailyMealRef = doc(db, 'dailyMeals', todayDateStr); // Direct lookup by ID
        const docSnap = await getDoc(dailyMealRef);

        if (docSnap.exists()) {
          setDailyMeal({ id: docSnap.id, ...docSnap.data() } as DailyMealPost);
        } else {
          setDailyMeal(null); // No meal posted for today
        }
      } catch (error) {
        console.error("Error fetching daily meal:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load today's meal.",
        });
        setDailyMeal(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyMeal();
  }, [toast]);

  const handleOrderDailyMeal = async () => {
     if (!user) {
        toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to place an order." });
        router.push('/login');
        return;
     }
    if (!dailyMeal) {
       toast({ variant: "destructive", title: "Not Available", description: "Today's meal is not available or hasn't been posted." });
       return;
    }

    setIsOrdering(true);

    const orderData: Omit<Order, 'id'> = {
        userId: user.id,
        userName: user.name || 'Unknown User',
        items: [{
            itemId: dailyMeal.id, // Use daily meal ID (date string) as reference
            name: dailyMeal.name,
            price: dailyMeal.price, // USD price
            quantity: 1,
        }],
        total: dailyMeal.price, // Total in USD
        status: 'Pending',
        orderTimestamp: serverTimestamp(),
        // No notes or preferred time for quick daily meal order
    };

    try {
        // Add order to Firestore
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        console.log("Daily meal order placed successfully:", orderRef.id);

        // Note: Stock management for daily meals is tricky. If it's made in batches,
        // you might not decrement stock from 'menuItems'. If it uses ingredients,
        // that's more complex inventory management. For simplicity, we omit stock update here.

        toast({
          title: `Ordered ${dailyMeal.name}!`,
          description: `Added ${displayCurrencyDual(dailyMeal.price)} to your bill.`,
        });
        // Optional: Redirect to order history or show confirmation inline
        router.push('/order-history');

    } catch (error: any) {
        console.error("Error ordering daily meal:", error);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: error.message || "Could not place the order. Please try again.",
        });
    } finally {
        setIsOrdering(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Meal Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="text-primary" /> Today's Daily Meal
            </CardTitle>
            <CardDescription>Check out what the chef prepared for today!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 min-h-[150px]">
             {isLoading ? (
                 <div className="space-y-3 pt-4">
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-1/2" />
                   <Skeleton className="h-8 w-1/3" />
                 </div>
            ) : dailyMeal ? (
              <>
                <h3 className="text-lg font-semibold">{dailyMeal.name}</h3>
                <p className="text-sm text-muted-foreground">{dailyMeal.description}</p>
                 <p className="text-lg font-bold text-primary flex items-center gap-1">
                     <DollarSign className="h-5 w-5" />
                     {displayCurrencyDual(dailyMeal.price)}
                 </p>
              </>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                   <XCircle className="w-10 h-10 mb-2 opacity-50" />
                  <p>Today's meal hasn't been posted yet.</p>
                  <p className="text-xs">Check back later!</p>
               </div>
            )}
          </CardContent>
          {dailyMeal && !isLoading && (
            <CardFooter>
              <Button
                 className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                 onClick={handleOrderDailyMeal}
                 disabled={isOrdering || authLoading || !user}
                 title={!user ? "Please log in to order" : ""}
               >
                {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {isOrdering ? 'Ordering...' : 'Count Me In!'}
              </Button>
            </CardFooter>
          )}
           {!dailyMeal && !isLoading && (
             <CardFooter className="justify-center">
                 <p className="text-sm text-muted-foreground">No meal available to order.</p>
             </CardFooter>
           )}
        </Card>

        {/* Quick Order Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Utensils className="text-primary" /> Quick Order
            </CardTitle>
            <CardDescription>Need something specific? Place a custom order.</CardDescription>
          </CardHeader>
           <CardContent className="flex items-center justify-center h-[160px]">
            <p className="text-muted-foreground text-center">Browse the menu to add items.</p>
          </CardContent>
          <CardFooter>
            <Link href="/orders" passHref className="w-full">
               <Button variant="outline" className="w-full border-primary text-primary hover:bg-accent hover:text-accent-foreground hover:border-accent">
                 Place Custom Order
               </Button>
             </Link>
          </CardFooter>
        </Card>

        {/* View Menu Card */}
         <Card className="shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BookOpen className="text-primary" /> View Full Menu
             </CardTitle>
             <CardDescription>See all available items, including drinks and desserts.</CardDescription>
           </CardHeader>
           <CardContent className="flex items-center justify-center h-[160px]">
             <p className="text-muted-foreground text-center">Explore all categories.</p>
           </CardContent>
           <CardFooter>
            <Link href="/menu" passHref className="w-full">
               <Button variant="outline" className="w-full border-primary text-primary hover:bg-accent hover:text-accent-foreground hover:border-accent">
                 Browse Menu
               </Button>
             </Link>
           </CardFooter>
         </Card>
      </div>
    </div>
  );
}
