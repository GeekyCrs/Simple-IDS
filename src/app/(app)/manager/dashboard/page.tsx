"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Package, BookOpen, UtensilsCrossed, Settings, AreaChart, DollarSign } from "lucide-react";
import Link from "next/link";
// Assuming a charting library like Recharts is available via shadcn/ui/chart
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


// Placeholder data - replace with actual data fetched from backend
const stats = {
  totalUsers: 125,
  pendingBills: 15,
  lowStockItems: 3,
  totalRevenueMonth: 1850.75,
  ordersToday: 42,
};

const monthlySalesData = [
  { month: "Jan", sales: 1200 },
  { month: "Feb", sales: 1500 },
  { month: "Mar", sales: 1350 },
  { month: "Apr", sales: 1600 },
  { month: "May", sales: 1450 },
  { month: "Jun", sales: 1850 },
];

const chartConfig = {
  sales: {
    label: "Sales ($)",
    color: "hsl(var(--primary))", // Use primary color (green)
  },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function ManagerDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [salesData, setSalesData] = useState(monthlySalesData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual dashboard data from backend
    setIsLoading(true);
    setTimeout(() => {
      // Simulate fetching data
      setDashboardStats(stats);
      setSalesData(monthlySalesData);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
     return <div className="container mx-auto py-8 text-center"><p className="text-muted-foreground">Loading dashboard data...</p></div>;
  }

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
            <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered canteen users</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
             <FileText className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{dashboardStats.pendingBills}</div>
             <p className="text-xs text-muted-foreground">Users with unpaid bills</p>
           </CardContent>
         </Card>
         <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-orange-600">{dashboardStats.lowStockItems}</div>
             <p className="text-xs text-muted-foreground">Items needing reorder</p>
           </CardContent>
         </Card>
         <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (This Month)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.totalRevenueMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total value of orders</p>
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
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <Users /> Manage Users
                </Button>
             </Link>
             <Link href="/manager/all-bills" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <FileText /> View All Bills
                </Button>
             </Link>
             <Link href="/manager/manage-menu" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <BookOpen /> Manage Menu
                </Button>
             </Link>
             <Link href="/manager/manage-stock" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10">
                   <Package /> Manage Stock
                </Button>
             </Link>
             {/* Maybe add link to Chef's order queue view? */}
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
             <CardTitle>Monthly Sales Overview</CardTitle>
             <CardDescription>Total sales revenue per month.</CardDescription>
           </CardHeader>
           <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                         <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                         <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} tickFormatter={(value) => `$${value}`} />
                         <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                         <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                     </BarChart>
                 </ResponsiveContainer>
             </ChartContainer>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
