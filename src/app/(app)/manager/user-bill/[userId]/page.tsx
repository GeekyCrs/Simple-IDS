
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { FileText, PackageSearch, User, ArrowLeft } from "lucide-react";
import { format, startOfMonth, endOfMonth } from 'date-fns'; // For date formatting
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore'; // Firestore imports
import type { Order } from '@/types/order'; // Import Order type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // To get userId from route

interface UserInfo {
  name: string;
  email: string;
}

export default function UserBillDetailPage() {
  const params = useParams();
  const userId = params.userId as string; // Get userId from URL
  const [orders, setOrders] = useState<Order[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const currentDisplayMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return; // No user ID, can't fetch data
    }

    const fetchData = async () => {
      setIsLoading(true);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      try {
        // Fetch User Info
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserInfo({ name: data.name || 'Unknown User', email: data.email || 'N/A' });
        } else {
          setUserInfo(null); // User not found
          console.error(`User with ID ${userId} not found.`);
        }

        // Fetch User Orders for the Current Month
        const ordersCollection = collection(db, 'orders');
        const q = query(
            ordersCollection,
            where('userId', '==', userId),
            where('orderTimestamp', '>=', Timestamp.fromDate(monthStart)),
            where('orderTimestamp', '<=', Timestamp.fromDate(monthEnd)),
            orderBy('orderTimestamp', 'desc') // Show most recent first
        );
        const querySnapshot = await getDocs(q);

        const fetchedOrders: Order[] = [];
        let total = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const orderTimestamp = data.orderTimestamp instanceof Timestamp
              ? data.orderTimestamp.toDate().toISOString()
              : data.orderTimestamp || new Date().toISOString();

            const order = {
                id: doc.id,
                ...data,
                orderTimestamp: orderTimestamp,
                items: Array.isArray(data.items) ? data.items : [], // Ensure items is an array
            } as Order;

            fetchedOrders.push(order);
            total += order.total || 0; // Sum up the total
        });

        setOrders(fetchedOrders);
        setCurrentMonthTotal(total);

      } catch (error) {
        console.error("Error fetching user bill details:", error);
        setOrders([]);
        setCurrentMonthTotal(0);
        setUserInfo(null);
        // Handle error, maybe show toast
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]); // Rerun if userId changes

   const renderSkeletons = (rows: number) => (
        Array.from({ length: rows }).map((_, index) => (
            <TableRow key={`skeleton-row-${index}`}>
                 <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                 <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
            </TableRow>
        ))
     );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-2"><FileText /> User Bill Details</h1>
          <Link href="/manager/all-bills" passHref>
              <Button variant="outline">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Bills
              </Button>
          </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
             {isLoading ? (
                <>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </>
             ) : userInfo ? (
                <>
                 <CardTitle>Bill for {userInfo.name} ({currentDisplayMonth})</CardTitle>
                 <CardDescription>Email: {userInfo.email}</CardDescription>
                </>
             ) : (
                 <CardTitle>User Not Found</CardTitle>
             )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                 <TableHeader>
                     <TableRow>
                         <TableHead className="w-[150px]">Date</TableHead>
                         <TableHead>Items</TableHead>
                         <TableHead className="text-right w-[100px]">Amount</TableHead>
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {renderSkeletons(3)}
                 </TableBody>
             </Table>
          ) : !userInfo ? (
             <div className="text-center py-12 text-muted-foreground">Could not load details for this user.</div>
          ) : orders.length === 0 ? (
             <div className="text-center py-12">
                 <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">{userInfo.name} has no orders recorded for {currentDisplayMonth} yet.</p>
             </div>
          ) : (
             <Table>
               <TableCaption>Expenses for {userInfo.name} during {currentDisplayMonth}.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[150px]">Date</TableHead>
                   <TableHead>Items</TableHead>
                   <TableHead className="text-right w-[100px]">Amount</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {orders.map((order) => (
                   <TableRow key={order.id}>
                      <TableCell>{format(new Date(order.orderTimestamp), 'MMM d, HH:mm')}</TableCell>
                      <TableCell>
                         <ul className="list-disc list-inside text-sm">
                            {order.items.map((item, index) => (
                               <li key={`${order.id}-${item.itemId}-${index}`}> {/* More unique key */}
                                  {item.quantity}x {item.name}
                               </li>
                            ))}
                         </ul>
                         {order.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {order.notes}</p>}
                       </TableCell>
                       <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-end items-center border-t pt-4">
             <div className="text-right">
                <p className="text-muted-foreground text-sm">Total for {currentDisplayMonth}</p>
                <p className="text-2xl font-bold text-primary">${currentMonthTotal.toFixed(2)}</p>
                 {/* Add payment status controls if needed */}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
