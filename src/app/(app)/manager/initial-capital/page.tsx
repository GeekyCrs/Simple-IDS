
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, addDoc, getDocs, doc, deleteDoc, Timestamp, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { displayCurrencyDual } from '@/lib/utils';

// Form schema for adding new capital item
const formSchema = z.object({
  itemName: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }).int(),
  pricePerUnit: z.number().min(0.01, { message: "Price must be greater than 0." }),
});

// Define capital item type matching Firestore structure
interface CapitalItem {
  id: string; // Firestore document ID
  itemName: string;
  quantity: number;
  pricePerUnit: number; // USD
  totalCost: number; // USD
  dateAdded: Timestamp; // Firestore Timestamp
}

export default function InitialCapitalPage() {
  const [capitalItems, setCapitalItems] = useState<CapitalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      quantity: 1,
      pricePerUnit: 0,
    },
  });

  // Fetch capital items from Firestore
  const fetchCapitalItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const capitalCollection = collection(db, 'initialCapital');
      const q = query(capitalCollection, orderBy('dateAdded', 'desc')); // Sort by date added
      const capitalSnapshot = await getDocs(q);
      
      const items: CapitalItem[] = [];
      capitalSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as CapitalItem);
      });
      
      setCapitalItems(items);
    } catch (err) {
      console.error("Error fetching capital items:", err);
      setError("Failed to load capital items. Please try again.");
      toast({
         variant: "destructive",
         title: "Error Loading Data",
         description: "Could not fetch initial capital records.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCapitalItems();
  }, []); // Runs once on mount

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Calculate total cost
      const totalCost = values.quantity * values.pricePerUnit;
      
      // Prepare data for Firestore
      const dataToSave = {
        itemName: values.itemName,
        quantity: values.quantity,
        pricePerUnit: values.pricePerUnit,
        totalCost: totalCost,
        dateAdded: serverTimestamp(), // Use server timestamp
      };
      
      // Add to initialCapital collection in Firestore
      const docRef = await addDoc(collection(db, 'initialCapital'), dataToSave);
      
      // *** NOTE: Logic to add to a separate 'stock' collection is removed.
      // Stock is managed via the 'menuItems' collection in other parts of the app.
      // This avoids potential data duplication/sync issues.
      // If you need to track raw materials separately, reconsider the 'stock' collection logic.

      toast({
        title: "Item added successfully",
        description: `${values.itemName} has been added to initial capital.`,
      });
      
      // Reset form, close dialog, and refresh data
      form.reset();
      setDialogOpen(false);
      fetchCapitalItems(); // Refetch to show the new item
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

  // Delete capital item from Firestore
  const deleteCapitalItem = async (itemId: string, itemName: string) => {
    // Add confirmation dialog for safety
    const confirmDelete = window.confirm(`Are you sure you want to delete "${itemName}" from the initial capital records? This action cannot be undone.`);
    if (!confirmDelete) return;

    setIsLoading(true); // Use isLoading to disable buttons during delete
    try {
      const itemRef = doc(db, 'initialCapital', itemId);
      await deleteDoc(itemRef);
      
      toast({
        title: "Item deleted",
        description: `${itemName} has been removed from initial capital records.`,
      });
      
      // Update local state immediately
      setCapitalItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // No need to call fetchCapitalItems() here as we updated local state
      
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total capital from fetched items
  const totalCapital = capitalItems.reduce((sum, item) => sum + item.totalCost, 0);

  // --- Render Logic ---

  // Loading state
  if (isLoading && capitalItems.length === 0) { // Show loader only on initial load
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

  // Main content render
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
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
                    Record items purchased as initial capital investment.
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
                            <Input placeholder="e.g., Rice Bag, Cooking Oil" {...field} />
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
                              placeholder="e.g., 10" 
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
                              placeholder="e.g., 5.50" 
                              step="0.01"
                              min="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total Cost: {displayCurrencyDual((form.watch('quantity') || 0) * (form.watch('pricePerUnit') || 0))}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Adding...' : 'Add Item'}
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
          <CardTitle>Capital Items List</CardTitle>
          <CardDescription>
            Detailed list of all items recorded as initial capital.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && capitalItems.length > 0 ? ( // Show loading indicator over table if refetching
            <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          
          {capitalItems.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No capital items added yet.</p>
              <p className="text-sm">Click "Add New Item" to record your investments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price Per Unit (USD)</TableHead>
                    <TableHead>Total Cost (USD/LBP)</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capitalItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{displayCurrencyDual(item.pricePerUnit).split(' / ')[0]}</TableCell> {/* Show only USD price per unit */}
                      <TableCell>{displayCurrencyDual(item.totalCost)}</TableCell>
                      <TableCell>
                        {item.dateAdded ? item.dateAdded.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteCapitalItem(item.id, item.itemName)}
                          disabled={isLoading} // Disable delete while another operation is in progress
                          aria-label={`Delete ${item.itemName}`}
                          className="h-8 w-8"
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
        