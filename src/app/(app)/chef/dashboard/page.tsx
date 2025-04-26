"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BellRing, UtensilsCrossed, Package, BookOpen, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"; // Import Badge component

export default function ChefDashboardPage() {
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  // Placeholder: Get current day's meal status
  const [dailyMealPosted, setDailyMealPosted] = useState(false); // Fetch this from backend
  const [pendingOrdersCount, setPendingOrdersCount] = useState(5); // Fetch this

  const handlePostDailyMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    const price = parseFloat(mealPrice);
    if (isNaN(price) || price <= 0) {
      toast({ variant: "destructive", title: "Invalid Price", description: "Please enter a valid positive price." });
      setIsPosting(false);
      return;
    }

    const mealData = {
      name: mealName,
      description: mealDescription,
      price: price,
      date: new Date().toISOString().split('T')[0], // Post for today
    };

    // TODO: Implement backend logic
    // 1. Save the daily meal to the database for the current date.
    // 2. Trigger push notifications to all 'client' users.
    //    - Use a service like Firebase Cloud Messaging (FCM) via a backend function.
    //    - Target all registered device tokens for clients.

    // Placeholder logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Posting daily meal:", mealData);
    toast({
      title: "Daily Meal Posted!",
      description: `${mealName} is now available. Notifications sent to users (Simulated).`
    });

    setDailyMealPosted(true); // Update UI state
    setMealName('');
    setMealDescription('');
    setMealPrice('');
    setIsPosting(false);

     // Simulate sending push notifications
     // sendPushNotification('all_clients', `Today's meal: ${mealName} for $${price.toFixed(2)}! Tap to order.`);
  };

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
             {dailyMealPosted ? (
                <CardDescription className="text-green-600 font-medium">Today's meal has already been posted.</CardDescription>
              ) : (
                <CardDescription>Enter the details for today's special and notify users.</CardDescription>
              )}
          </CardHeader>
          {!dailyMealPosted ? (
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
                 <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPosting}>
                   {isPosting ? 'Posting...' : 'Post Meal & Notify Users'}
                 </Button>
               </CardFooter>
            </form>
           ) : (
              <CardContent className="text-center py-10">
                 <p className="text-muted-foreground">You can manage the menu or stock using the links below.</p>
                 {/* Optionally add an "Edit Today's Meal" button */}
              </CardContent>
           )}
        </Card>

        {/* Quick Links / Stats Card */}
        <Card className="shadow-lg">
           <CardHeader>
             <CardTitle>Quick Actions & Stats</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <Link href="/chef/orders-queue" passHref>
                 <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10 relative">
                    <UtensilsCrossed /> View Orders Queue
                    {pendingOrdersCount > 0 && (
                        <Badge variant="destructive" className="absolute right-2 top-1/2 -translate-y-1/2">{pendingOrdersCount}</Badge>
                    )}
                 </Button>
              </Link>
             <Link href="/chef/manage-menu" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <BookOpen /> Manage Menu
                </Button>
             </Link>
             <Link href="/chef/manage-stock" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <Package /> Manage Stock
                </Button>
             </Link>
             {/* Add more stats if needed, e.g., popular items */}
             <div className="pt-4 border-t">
                 <p className="text-sm text-muted-foreground">Today's Status:</p>
                 <p className="font-medium">{dailyMealPosted ? 'Daily Meal Posted' : 'Daily Meal Not Posted Yet'}</p>
                 <p className="font-medium">{pendingOrdersCount} Pending Order(s)</p>
             </div>
           </CardContent>
         </Card>

      </div>
    </div>
  );
}
