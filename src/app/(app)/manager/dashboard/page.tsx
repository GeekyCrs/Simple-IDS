
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Package, BookOpen, UtensilsCrossed, Settings, DollarSign, Loader2 } from "lucide-react"; // Added Loader2
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps } from "recharts"; // Added TooltipProps
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getCountFromServer, query, where, Timestamp, sum, aggregate } from 'firebase/firestore'; // Firestore imports
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Removed placeholder data

// Define state for fetched stats
interface DashboardStats {
  totalUsers: number;
  // pendingBills: number; // Removed as per previous request logic change
  // lowStockItems: number; // Requires fetching stock data, omitting for now
  totalRevenueMonthUsd: number;
  // ordersToday: number; // Requires fetching order data, omitting for now
}

// Type for recharts tooltip payload
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';


// Custom tooltip component with dual currency
function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the data object for the hovered bar
    const usdValue = payload[0].value as number; // Assuming value is USD

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
        <p className="font-bold mb-1">{label}</p> {/* Month */}
         <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium">
                Sales: {displayCurrencyDual(usdValue)}
            </span>
         </div>
      </div>
    );
  }
  return null;
}


// Simple chart container component
function ChartContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`} style={{ '--color-sales': 'hsl(var(--primary))' } as React.CSSProperties}>
      {children}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  // const [salesData, setSalesData] = useState(monthlySalesData); // TODO: Fetch real sales data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   // TODO: Placeholder sales data - replace with fetched data
   const placeholderSalesData = [
     { month: "Jan", sales: 1200 }, { month: "Feb", sales: 1500 }, { month: "Mar", sales: 1350 },
     { month: "Apr", sales: 1600 }, { month: "May", sales: 1450 }, { month: "Jun", sales: 1850 },
   ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Total Users
        const usersCollection = collection(db, 'users');
        // Optionally filter roles: const qUsers = query(usersCollection, where('role', '==', 'client'));
        const usersSnapshot = await getCountFromServer(usersCollection);
        const totalUsers = usersSnapshot.data().count;

        // Fetch Total Revenue for Current Month
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const ordersCollection = collection(db, 'orders');
        // Query orders within the current month (consider adding status filter e.g., 'Completed')
        const revenueQuery = query(
          ordersCollection,
          where('orderTimestamp', '>=', Timestamp.fromDate(monthStart)),
          where('orderTimestamp', '<=', Timestamp.fromDate(monthEnd))
          // where('status', '==', 'Completed') // Uncomment if only completed orders count
        );

        // Use Firestore aggregation to sum the 'total' field
        const revenueSnapshot = await aggregate(revenueQuery, {
            totalRevenue: sum('total')
        });
        const totalRevenueMonthUsd = revenueSnapshot.data().totalRevenue || 0;


        // TODO: Fetch Low Stock Items Count (requires iterating through menuItems)
        // TODO: Fetch Orders Today Count

        setDashboardStats({
          totalUsers: totalUsers,
          totalRevenueMonthUsd: totalRevenueMonthUsd,
        });

        // TODO: Fetch real monthly sales data for the chart

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setDashboardStats(null); // Clear stats on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Display loading state
  if (isLoading) {
     return (
         <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Settings /> Manager Dashboard</h1>
             {/* Skeleton for Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
             {/* Skeleton for Quick Links & Chart */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Skeleton className="h-96 lg:col-span-1" />
                 <Skeleton className="h-96 lg:col-span-2" />
             </div>
         </div>
     );
   }

  // Display error message
  if (error) {
     return <div className="container mx-auto py-8 text-center text-destructive"><p>{error}</p></div>;
  }

  // Display dashboard when data is loaded
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Settings /> Manager Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalUsers ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Registered canteen users</p>
          </CardContent>
        </Card>
         {/* Removed Pending Bills card */}
         {/* Removed Low Stock Items card (requires more logic) */}
          <Card className="shadow-md col-span-1 sm:col-span-2 lg:col-span-1"> {/* Adjust span */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue ({format(new Date(), 'MMMM')})</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{displayCurrencyDual(dashboardStats?.totalRevenueMonthUsd ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Total value of orders this month</p>
            </CardContent>
         </Card>
         {/* Placeholder for other potential cards */}
         <Card className="shadow-md hidden lg:block"> {/* Hide on smaller screens if needed */}
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Placeholder Stat</CardTitle>
                {/* Icon */}
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">...</div>
                <p className="text-xs text-muted-foreground">...</p>
             </CardContent>
         </Card>
      </div>

       {/* Quick Links & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Quick Links */}
        <Card className="shadow-lg lg:col-span-1">
           <CardHeader>
             <CardTitle>Management Actions</CardTitle>
             <CardDescription>Quick access to management tasks.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-3">
             <Link href="/manager/manage-users" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <Users /> Manage Users
                </Button>
             </Link>
             <Link href="/manager/all-bills" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <FileText /> View All Bills
                </Button>
             </Link>
             <Link href="/manager/manage-menu" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <BookOpen /> Manage Menu
                </Button>
             </Link>
             <Link href="/manager/manage-stock" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                   <Package /> Manage Stock
                </Button>
             </Link>
              <Link href="/manager/settings" passHref>
                 <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                    <Settings /> Settings
                 </Button>
              </Link>
             <Link href="/chef/orders-queue" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:bg-secondary">
                   <UtensilsCrossed /> View Orders Queue
                </Button>
             </Link>
           </CardContent>
         </Card>

        {/* Sales Chart */}
        <Card className="shadow-lg lg:col-span-2">
           <CardHeader>
             <CardTitle>Monthly Sales Overview (Demo)</CardTitle>
             <CardDescription>Total sales revenue per month (USD/LBP).</CardDescription>
           </CardHeader>
           <CardContent>
             <ChartContainer className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={placeholderSalesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                   <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                   <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} tickFormatter={(value) => `$${value}`} />
                    {/* Use custom tooltip for dual currency */}
                   <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                   <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </ChartContainer>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
