"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, PackageSearch } from "lucide-react";
import { format } from 'date-fns'; // For date formatting

// Placeholder Type - Define based on your actual bill/order structure
interface BillItem {
  id: string; // Can be the original order ID or a specific bill item ID
  date: string; // ISO String or Timestamp
  description: string; // e.g., "Daily Meal", "Classic Burger", "Espresso"
  amount: number;
}

interface Bill {
  month: string; // e.g., "July 2024"
  items: BillItem[];
  total: number;
  status: 'Unpaid' | 'Paid' | 'Pending'; // Example statuses
}

// Placeholder Data - Replace with API call to fetch user's current bill
const currentMonth = format(new Date(), 'MMMM yyyy');
const initialBill: Bill = {
  month: currentMonth,
  items: [
    { id: 'bill1', date: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Classic Burger', amount: 9.50 },
    { id: 'bill2', date: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Espresso', amount: 2.50 },
    { id: 'bill3', date: new Date(Date.now() - 86400000).toISOString(), description: 'Daily Meal: Chef\'s Pasta', amount: 12.50 },
    { id: 'bill4', date: new Date().toISOString(), description: 'Cheesecake Slice', amount: 5.50 },
  ],
  total: 30.00,
  status: 'Unpaid',
};

export default function MyBillPage() {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch current bill for the logged-in user from backend/database
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      setBill(initialBill); // Assume we get the current month's bill
      setIsLoading(false);
    }, 1200);
  }, []);

   const getStatusBadgeVariant = (status: Bill['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Paid': return 'default'; // Green
          case 'Unpaid': return 'destructive'; // Red
          case 'Pending': return 'secondary'; // Greyish
          default: return 'outline';
      }
  };


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><FileText /> My Monthly Bill</h1>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
             <CardTitle>Bill for {bill?.month || currentMonth}</CardTitle>
             <CardDescription>Summary of your canteen expenses for the current month.</CardDescription>
          </div>
          {bill && <Badge variant={getStatusBadgeVariant(bill.status)} className="text-sm">{bill.status}</Badge>}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <p className="text-muted-foreground">Loading your bill...</p>
              {/* Add Skeleton loaders here */}
            </div>
          ) : !bill || bill.items.length === 0 ? (
             <div className="text-center py-12">
                 <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">No bill items found for this month yet.</p>
             </div>
          ) : (
            <Table>
              <TableCaption>Details of your expenses for {bill.month}.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), 'PP')}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
         {bill && bill.items.length > 0 && (
            <CardFooter className="flex justify-end items-center border-t pt-4">
                 <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total Amount Due</p>
                    <p className="text-2xl font-bold text-primary">${bill.total.toFixed(2)}</p>
                </div>
            </CardFooter>
         )}
      </Card>

       {/* Add section for previous bills if needed */}
       {/* <div className="mt-8">
         <h2 className="text-2xl font-semibold mb-4">Previous Bills</h2>
         <p className="text-muted-foreground">Access your past monthly bills here.</p>
          // Implement logic to fetch and display past bills
       </div> */}
    </div>
  );
}
