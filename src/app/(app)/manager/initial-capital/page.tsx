"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Trash2, Package, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { displayCurrencyDual } from '@/lib/utils';

// Form validation schema
const formSchema = z.object({
  itemName: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }),
  pricePerUnit: z.number().min(0.01, { message: "Price must be greater than 0." }),
});

// Type definition for capital items
interface CapitalItem {
  id: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  dateAdded: Timestamp;
}

export default function InitialCapitalPage() {
  // State management
  const [capitalItems, setCapitalItems] = useState<CapitalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      quantity: 1,
      pricePerUnit: 0,
    },
  });

  // Fetch all capital items from Firestore
  const fetchCapitalItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const capitalCollection = collection(db, 'initialCapital');
      const capitalSnapshot = await getDocs(capitalCollection);
      
      const items: CapitalItem[] = [];
      capitalSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as CapitalItem);
      });
      
      // Sort by most recent first
      items.sort((a, b) => {
        // Handle cases where dateAdded might be undefined
        if (!a.dateAdded) return 1;
        if (!b.dateAdded) return -1;
        return b.dateAdded.toMillis() - a.dateAdded.toMillis();
      });
      
      setCapitalItems(items);
    } catch (err) {
      console.error("Error fetching capital items:", err);
      setError("Failed to load capital items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchCapitalItems();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Calculate total cost
      const totalCost = values.quantity * values.pricePerUnit;
      
      // Add to initialCapital collection
      await addDoc(collection(db, 'initialCapital'), {
        itemName: values.itemName,
        quantity: values.quantity,
        pricePerUnit: values.pricePerUnit,
        totalCost: totalCost,
        dateAdded: serverTimestamp(),
      });
      
      // Add to stock collection
      await addDoc(collection(db, 'stock'), {
        itemName: values.itemName,
        quantity: values.quantity,
        lastUpdated: serverTimestamp(),
      });
      
      // Show success notification
      toast({
        title: "Item added successfully",
        description: `${values.itemName} has been added to capital and stock.`,
      });
      
      // Reset form and refresh data
      form.reset();
      setDialogOpen(false);
      fetchCapitalItems();
    } catch (err) {
      console.error("Error adding item:", err);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a capital item
  const deleteCapitalItem = async (id: string, itemName: string) => {
    // Get user confirmation
    const confirmDelete = window.confirm(`Are you sure you want to delete ${itemName}? This won't remove the item from stock.`);

    if (confirmDelete) {
      try {
        // Delete the item from the initialCapital collection
        const itemDocRef = doc(db, 'initialCapital', id);
        await deleteDoc(itemDocRef);

        // Delete the corresponding item from the stock collection
        const stockItemRef = doc(db, 'stock', itemName);
        await deleteDoc(stockItemRef);

        
        // Show success notification
        toast({
          title: "Item deleted",
          description: `${itemName} has been removed from initial capital.`,
        });
        
        // Refresh the list
        fetchCapitalItems();
      } catch (err) {
        console.error("Error deleting item:", err);
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate total capital
  const totalCapital = capitalItems.reduce((sum, item) => sum + item.totalCost, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> Initial Capital
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> Initial Capital
          </h1>
        </div>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchCapitalItems()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" /> Initial Capital
        </h1>
      </div>

      {/* Summary Card */}
      <Card className="shadow-md mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-muted-foreground">Total Capital Invested</p>
              <p className="text-3xl font-bold">{displayCurrencyDual(totalCapital)}</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0" variant="default">
                  <Plus className="mr-2 h-4 w-4" /> Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Capital Item</DialogTitle>
                  <DialogDescription>
                    Add items purchased as initial capital. These will be added to stock.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Rice, Flour, Meat" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Quantity" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Per Unit (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              step="0.01"
                              min="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total: {displayCurrencyDual((form.watch('quantity') || 0) * (form.watch('pricePerUnit') || 0))}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Item
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Capital Items</CardTitle>
          <CardDescription>
            List of all items purchased as initial capital.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capitalItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No capital items added yet.</p>
              <p className="text-sm">Add items to track your initial investment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price Per Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capitalItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{displayCurrencyDual(item.pricePerUnit)}</TableCell>
                      <TableCell>{displayCurrencyDual(item.totalCost)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteCapitalItem(item.id, item.itemName)}
                          aria-label={`Delete ${item.itemName}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}