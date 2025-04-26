
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BellRing, UtensilsCrossed, Package, BookOpen, ChefHat, Loader2, CheckCircle, XCircle } from "lucide-react"; // Added icons
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, query, where, getDocs, limit, Timestamp, serverTimestamp, doc, setDoc } from 'firebase/firestore'; // Firestore imports
import { format } from 'date-fns';

export default function ChefDashboardPage() {
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [dailyMealPosted, setDailyMealPosted] = useState<boolean | null>(null); // Use null for initial loading state
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0); // Fetch this later
  const { toast } = useToast();

  // Check if daily meal has been posted for today
  useEffect(() => {
    const checkDailyMealStatus = async () => {
      setDailyMealPosted(null); // Set to loading
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');
      try {
        const dailyMealsCollection = collection(db, 'dailyMeals');
        const q = query(dailyMealsCollection, where('date', '==', todayDateStr), limit(1));
        const querySnapshot = await getDocs(q);
        setDailyMealPosted(!querySnapshot.empty); // True if a document exists for today
      } catch (error) {
        console.error("Error checking daily meal status:", error);
        // Handle error - maybe assume not posted or show an error state?
        setDailyMealPosted(false); // Default to false on error
      }
    };
    checkDailyMealStatus();
  }, []); // Run once on mount

  // TODO: Fetch pending orders count
   useEffect(() => {
      const fetchPendingOrders = async () => {
         // Implement logic to count orders with 'Pending' or 'Preparing' status
         // const ordersCollection = collection(db, 'orders');
         // const q = query(ordersCollection, where('status', 'in', ['Pending', 'Preparing']));
         // const snapshot = await getCountFromServer(q); // Use getCountFromServer for efficiency
         // setPendingOrdersCount(snapshot.data().count);
         setPendingOrdersCount(5); // Placeholder
      };
      fetchPendingOrders();
   }, []);


  const handlePostDailyMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    const price = parseFloat(mealPrice);
    if (isNaN(price) || price <= 0) {
      toast({ variant: "destructive", title: "Invalid Price", description: "Please enter a valid positive price." });
      setIsPosting(false);
      return;
    }

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    const mealData = {
      name: mealName,
      description: mealDescription,
      price: price,
      date: todayDateStr, // Store date as YYYY-MM-DD string
      postedAt: serverTimestamp(), // Use Firestore server timestamp
    };

    try {
      // 1. Save the daily meal to Firestore. Use the date as the document ID for easy lookup.
      const dailyMealRef = doc(db, 'dailyMeals', todayDateStr);
      await setDoc(dailyMealRef, mealData); // Use setDoc to overwrite if already exists for today

      console.log("Daily meal posted successfully:", mealData);
      toast({
        title: "Daily Meal Posted!",
        description: `${mealName} is now available for ${todayDateStr}.`
      });

      // 2. Trigger push notifications (requires backend/cloud function setup)
      //    - A Cloud Function listening to writes on 'dailyMeals' could trigger FCM.
      //    - sendPushNotification('all_clients', `Today's meal: ${mealName} for $${price.toFixed(2)}! Tap to order.`);
      console.log("Push notification trigger simulated for all clients.");


      setDailyMealPosted(true); // Update UI state
      setMealName('');
      setMealDescription('');
      setMealPrice('');

    } catch (error) {
        console.error("Error posting daily meal:", error);
        toast({
          variant: "destructive",
          title: "Posting Failed",
          description: "Could not post the daily meal. Please try again.",
        });
    } finally {
        setIsPosting(false);
    }
  };

  const renderPostForm = () => (
     <form onSubmit={handlePostDailyMeal}>
         <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mealName">Meal Name</Label>
              <Input
                id="mealName"
                placeholder="e.g., Roasted Chicken with Vegetables"
                required
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                disabled={isPosting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealDescription">Description</Label>
              <Textarea
                id="mealDescription"
                placeholder="Brief description of the meal..."
                required
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                disabled={isPosting}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealPrice">Price ($)</Label>
              <Input
                id="mealPrice"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g., 15.00"
                required
                value={mealPrice}
                onChange={(e) => setMealPrice(e.target.value)}
                disabled={isPosting}
              />
            </div>
         </CardContent>
         <CardFooter>
           <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPosting}>
             {isPosting ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting... </>
             ) : (
                'Post Meal & Notify Users'
             )}
           </Button>
         </CardFooter>
      </form>
  );

  const renderPostedMessage = () => (
     <CardContent className="text-center py-10">
         <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
         <p className="font-medium text-lg">Today's meal has been posted.</p>
         <p className="text-muted-foreground">You can manage the menu or stock using the links below.</p>
         {/* Optionally add an "Edit Today's Meal" button here */}
     </CardContent>
  );

  const renderNotPostedMessage = () => (
     <CardContent className="text-center py-10">
         <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
         <p className="font-medium text-lg">Error loading meal status.</p>
         <p className="text-muted-foreground">Could not verify if today's meal was posted. Please try refreshing.</p>
     </CardContent>
  );

   const renderLoadingMessage = () => (
     <CardContent className="text-center py-10">
         <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
         <p className="text-muted-foreground">Checking today's meal status...</p>
     </CardContent>
   );


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><ChefHat /> Chef Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Post Daily Meal Card */}
        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="text-primary" /> Post Today's Daily Meal
            </CardTitle>
             {dailyMealPosted === true ? (
                 <CardDescription className="text-green-600 font-medium">Meal already posted for today ({format(new Date(), 'yyyy-MM-dd')}).</CardDescription>
              ) : dailyMealPosted === false ? (
                 <CardDescription>Enter details for today's special ({format(new Date(), 'yyyy-MM-dd')}) and notify users.</CardDescription>
              ) : (
                 <CardDescription>Checking meal status...</CardDescription>
              )}
          </CardHeader>
          {dailyMealPosted === null ? renderLoadingMessage() :
           dailyMealPosted === true ? renderPostedMessage() :
           dailyMealPosted === false ? renderPostForm() :
           renderNotPostedMessage() // Fallback for error case
          }
        </Card>

        {/* Quick Links / Stats Card */}
        <Card className="shadow-lg">
           <CardHeader>
             <CardTitle>Quick Actions & Stats</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <Link href="/chef/orders-queue" passHref>
                 <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground relative">
                    <UtensilsCrossed /> View Orders Queue
                    {pendingOrdersCount > 0 && (
                        <Badge variant="destructive" className="absolute right-2 top-1/2 -translate-y-1/2">{pendingOrdersCount}</Badge>
                    )}
                 </Button>
              </Link>
             <Link href="/chef/manage-menu" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <BookOpen /> Manage Menu
                </Button>
             </Link>
             <Link href="/chef/manage-stock" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <Package /> Manage Stock
                </Button>
             </Link>
             <div className="pt-4 border-t">
                 <p className="text-sm text-muted-foreground">Today's Status:</p>
                 <p className="font-medium">
                   {dailyMealPosted === null ? "Checking..." : dailyMealPosted ? 'Daily Meal Posted' : 'Daily Meal Not Posted Yet'}
                 </p>
                 <p className="font-medium">{pendingOrdersCount} Pending Order(s)</p>
             </div>
           </CardContent>
         </Card>

      </div>
    </div>
  );
}
