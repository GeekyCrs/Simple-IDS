"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Package, BookOpen, UtensilsCrossed, Settings, DollarSign, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps } from "recharts";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, getCountFromServer } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format, subMonths, startOfYear } from 'date-fns';
import { displayCurrencyDual } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Define state for fetched stats
interface DashboardStats {
  totalUsers: number;
  pendingBills: number;
  lowStockItems: number;
  totalRevenueMonthUsd: number;
  initialCapitalUsd: number;
  netProfitUsd: number;
  monthlyRevenue: { month: string; sales: number }[];
}

// Type for recharts tooltip payload
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// Custom tooltip component with dual currency
function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const usdValue = payload[0].value as number;

    return (
      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
        <p className="font-bold mb-1">{label}</p>
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch Total Users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getCountFromServer(usersCollection);
        const totalUsers = usersSnapshot.data().count;

        // 2. Fetch Pending Bills (users who haven't settled their bills)
        // Query users with billPaid = false
        const pendingBillsQuery = query(usersCollection, where('billPaid', '==', false));
        const pendingBillsSnapshot = await getDocs(pendingBillsQuery);
        const pendingBillsCount = pendingBillsSnapshot.size;

        // 3. Fetch Low Stock Items (items with quantity < 10)
        const stockCollection = collection(db, 'stock');
        const lowStockQuery = query(stockCollection, where('quantity', '<', 10));
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockItemsCount = lowStockSnapshot.size;

        // 4. Calculate Initial Capital (sum of all purchased items)
        const capitalCollection = collection(db, 'initialCapital');
        const capitalSnapshot = await getDocs(capitalCollection);
        let initialCapitalUsd = 0;
        
        capitalSnapshot.forEach(doc => {
          const capitalData = doc.data();
          if (capitalData.totalCost && typeof capitalData.totalCost === 'number') {
            initialCapitalUsd += capitalData.totalCost;
          }
        });

        // 5. Calculate Total Revenue for Current Month
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        const ordersCollection = collection(db, 'orders');
        const revenueQuery = query(
          ordersCollection,
          where('orderTimestamp', '>=', Timestamp.fromDate(monthStart)),
          where('orderTimestamp', '<=', Timestamp.fromDate(monthEnd))
        );
        
        const ordersSnapshot = await getDocs(revenueQuery);
        let totalRevenueMonthUsd = 0;
        
        ordersSnapshot.forEach(doc => {
          const orderData = doc.data();
          if (orderData.total && typeof orderData.total === 'number') {
            totalRevenueMonthUsd += orderData.total;
          }
        });
        
        // Calculate net profit
        const netProfitUsd = totalRevenueMonthUsd - initialCapitalUsd;

        // 6. Generate Monthly Revenue Data for Chart (last 6 months)
        const monthlySalesData = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const targetMonth = subMonths(currentDate, i);
          const monthStartDate = startOfMonth(targetMonth);
          const monthEndDate = endOfMonth(targetMonth);
          
          const monthQuery = query(
            ordersCollection,
            where('orderTimestamp', '>=', Timestamp.fromDate(monthStartDate)),
            where('orderTimestamp', '<=', Timestamp.fromDate(monthEndDate))
          );
          
          const monthOrdersSnapshot = await getDocs(monthQuery);
          let monthRevenue = 0;
          
          monthOrdersSnapshot.forEach(doc => {
            const orderData = doc.data();
            if (orderData.total && typeof orderData.total === 'number') {
              monthRevenue += orderData.total;
            }
          });
          
          monthlySalesData.push({
            month: format(targetMonth, 'MMM'),
            sales: monthRevenue
          });
        }

        // Set all the stats
        setDashboardStats({
          totalUsers,
          pendingBills: pendingBillsCount,
          lowStockItems: lowStockItemsCount,
          totalRevenueMonthUsd,
          initialCapitalUsd,
          netProfitUsd,
          monthlyRevenue: monthlySalesData
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setDashboardStats(null);
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
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Settings /> Manager Dashboard</h1>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
        
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.pendingBills ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Users with unpaid bills</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.lowStockItems ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Items needing reorder</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue ({format(new Date(), 'MMMM')})</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{displayCurrencyDual(dashboardStats?.totalRevenueMonthUsd ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Total value of orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview & Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Overview */}
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Summary of current finances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Initial Capital:</span>
              <span className="font-medium">{displayCurrencyDual(dashboardStats?.initialCapitalUsd ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Revenue:</span>
              <span className="font-medium">{displayCurrencyDual(dashboardStats?.totalRevenueMonthUsd ?? 0)}</span>
            </div>
            <div className="h-px bg-muted my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Net Profit:</span>
              <span className={`font-bold ${(dashboardStats?.netProfitUsd ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {displayCurrencyDual(dashboardStats?.netProfitUsd ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Management Actions */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Management Actions</CardTitle>
            <CardDescription>Quick access to management tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <Link href="/manager/initial-capital" passHref>
              <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary hover:bg-accent hover:text-accent-foreground">
                <DollarSign /> Initial Capital
              </Button>
            </Link>
            <Link href="/chef/orders-queue" passHref>
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:bg-secondary">
                <UtensilsCrossed /> View Orders Queue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Sales Overview</CardTitle>
          <CardDescription>Total sales revenue per month (USD/LBP).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats?.monthlyRevenue || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}