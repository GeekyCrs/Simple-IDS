'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, Check, Utensils, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

// Placeholder data - replace with data fetched from backend/database
const dailyMeal = {
  name: "Chef's Special Pasta",
  description: "Creamy tomato pasta with grilled chicken and fresh basil.",
  price: 12.50,
  imageUrl: "https://picsum.photos/seed/pasta/400/200", // Placeholder image
  available: true, // Chef posts this
};

export default function ClientDashboardPage() { // Renamed component
  const { toast } = useToast();

  const handleOrderDailyMeal = () => {
    if (!dailyMeal.available) {
       toast({ variant: "destructive", title: "Not Available", description: "Today's meal is not available yet." });
       return;
    }
    // TODO: Implement order logic -> send notification to chef, add to user's bill
    console.log("Ordering daily meal:", dailyMeal.name);
    toast({
      title: `Ordered ${dailyMeal.name}!`,
      description: `Added $${dailyMeal.price.toFixed(2)} to your bill.`,
      action: <Button variant="outline" size="sm">Undo</Button>, // Example action
    });
    // TODO: Send push notification to user confirming order (optional here, maybe on success)
    // TODO: Send push notification to Chef
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
          <CardContent className="space-y-4">
            {dailyMeal.available ? (
              <>
                {dailyMeal.imageUrl && (
                  <div className="relative h-40 w-full rounded-md overflow-hidden mb-4">
                     <Image src={dailyMeal.imageUrl} alt={dailyMeal.name} layout="fill" objectFit="cover" />
                  </div>
                 )}
                <h3 className="text-lg font-semibold">{dailyMeal.name}</h3>
                <p className="text-sm text-muted-foreground">{dailyMeal.description}</p>
                <p className="text-lg font-bold text-primary">${dailyMeal.price.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">Today's meal hasn't been posted yet. Check back later!</p>
            )}
          </CardContent>
          {dailyMeal.available && (
            <CardFooter>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOrderDailyMeal}>
                <Check className="mr-2 h-4 w-4" /> Count Me In!
              </Button>
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
          <CardContent className="flex items-center justify-center h-[190px]">
             {/* Reduced height */}
            <p className="text-muted-foreground text-center">Browse the menu to add items.</p>
          </CardContent>
          <CardFooter>
            <Link href="/app/orders" passHref className="w-full">
               <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
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
           <CardContent className="flex items-center justify-center h-[190px]">
              {/* Reduced height */}
             <p className="text-muted-foreground text-center">Explore all categories.</p>
           </CardContent>
           <CardFooter>
            <Link href="/app/menu" passHref className="w-full">
               <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                 Browse Menu
               </Button>
             </Link>
           </CardFooter>
         </Card>
      </div>
    </div>
  );
}
