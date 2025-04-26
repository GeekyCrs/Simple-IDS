
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, Check, Utensils, BookOpen, Loader2, XCircle } from "lucide-react"; // Added Loader2, XCircle
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore'; // Firestore imports
import type { MenuItem } from '@/types/menu'; // Use MenuItem for structure consistency if needed
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Define a type for the daily meal post structure
interface DailyMealPost {
  id: string; // Firestore document ID (usually the date YYYY-MM-DD)
  name: string;
  description: string;
  price: number;
  date: string; // YYYY-MM-DD format
  postedAt: Timestamp; // Firestore Timestamp when posted
}

export default function ClientDashboardPage() {
  const [dailyMeal, setDailyMeal] = useState<DailyMealPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDailyMeal = async () => {
      setIsLoading(true);
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');
      try {
        const dailyMealsCollection = collection(db, 'dailyMeals'); // Assume 'dailyMeals' collection
        // Query for the meal posted today, identified by the date string
        const q = query(
          dailyMealsCollection,
          where('date', '==', todayDateStr), // Match today's date
          limit(1) // Should only be one meal per day
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setDailyMeal({ id: doc.id, ...doc.data() } as DailyMealPost);
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


  const handleOrderDailyMeal = () => {
    if (!dailyMeal) {
       toast({ variant: "destructive", title: "Not Available", description: "Today's meal is not available or hasn't been posted." });
       return;
    }
    // TODO: Implement order logic
    // 1. Create an order document in Firestore 'orders' collection.
    //    - Include meal details (name, price), user ID, timestamp, status ('Pending').
    //    - This will likely involve a transaction to also update the user's bill or add to a monthly aggregate.
    // 2. Optionally, trigger a push notification to the chef about the new order.
    // 3. Update stock if daily meal has limited quantity (less common).

    console.log("Ordering daily meal:", dailyMeal.name);
    toast({
      title: `Ordered ${dailyMeal.name}!`,
      description: `Added $${dailyMeal.price.toFixed(2)} to your bill (simulated).`,
      // action: <Button variant="outline" size="sm">Undo</Button>, // Example action
    });
    // Placeholder - redirect or update UI state after ordering
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
                <p className="text-lg font-bold text-primary">${dailyMeal.price.toFixed(2)}</p>
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
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOrderDailyMeal}>
                <Check className="mr-2 h-4 w-4" /> Count Me In!
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
           {/* Adjusted height and content for consistency */}
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
           {/* Adjusted height and content for consistency */}
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

