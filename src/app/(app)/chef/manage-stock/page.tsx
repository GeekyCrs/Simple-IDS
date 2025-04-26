
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Search, Package, PackageSearch, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import service functions if you have them, otherwise implement Firestore calls directly
// import { updateStockLevel, getStockLevel } from '@/services/stock-management';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import type { MenuItem } from '@/types/menu'; // Use MenuItem which includes quantityInStock
import { Skeleton } from "@/components/ui/skeleton";

// Combine StockItem and MenuItem concept for simplicity here
interface StockManagedItem extends Omit<MenuItem, 'description' | 'price'> {
    // Inherits id, name, category, quantityInStock from MenuItem
}

const LOW_STOCK_THRESHOLD = 10; // Example threshold

export default function ManageStockPage() {
  const [stockItems, setStockItems] = useState<StockManagedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockManagedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatedQuantities, setUpdatedQuantities] = useState<{ [key: string]: number | '' }>({}); // Allow empty string for input clearing
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({}); // Track saving state per item
  const { toast } = useToast();

  // Fetch items from Firestore 'menuItems' collection
  useEffect(() => {
    const fetchStockItems = async () => {
      setIsLoading(true);
      try {
        const menuCollection = collection(db, 'menuItems');
        const q = query(menuCollection); // Fetch all items to manage stock
        const querySnapshot = await getDocs(q);
        const items: StockManagedItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            name: data.name,
            category: data.category,
            quantityInStock: data.quantityInStock ?? 0, // Default to 0 if undefined
          } as StockManagedItem);
        });
        setStockItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error("Error fetching stock items:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Stock",
          description: "Could not fetch stock items. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockItems();
  }, [toast]);

 useEffect(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = stockItems.filter(item =>
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          item.category.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredItems(filtered);
  }, [searchTerm, stockItems]);


  const handleQuantityChange = (itemId: string, value: string) => {
    // Allow empty string or parse to number
    const quantity = value === '' ? '' : parseInt(value, 10);
    setUpdatedQuantities(prev => ({
      ...prev,
      [itemId]: isNaN(quantity as number) && value !== '' ? prev[itemId] : quantity, // Keep previous if parse fails but not empty
    }));
  };

 const handleSaveQuantity = async (itemId: string, itemName: string) => {
    const newQuantityInput = updatedQuantities[itemId];

    // Validate: Must not be empty string and must be a non-negative number
    if (newQuantityInput === '' || typeof newQuantityInput !== 'number' || isNaN(newQuantityInput) || newQuantityInput < 0) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a valid non-negative quantity for ${itemName}.` });
        return;
    }

     const newQuantity = newQuantityInput as number; // We know it's a valid number now

    setIsSaving(prev => ({ ...prev, [itemId]: true }));
    try {
        // Update stock level in Firestore
        const itemRef = doc(db, "menuItems", itemId);
        await updateDoc(itemRef, {
            quantityInStock: newQuantity
        });

        // Update local state on success
        setStockItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, quantityInStock: newQuantity } : item
            )
        );
        // Clear the updated quantity state for this item
        setUpdatedQuantities(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
        });
        toast({ title: "Stock Updated", description: `Quantity for ${itemName} set to ${newQuantity}.` });
    } catch (error) {
        console.error("Error updating stock:", error);
        toast({ variant: "destructive", title: "Update Failed", description: `Could not update stock for ${itemName}.` });
    } finally {
        setIsSaving(prev => ({ ...prev, [itemId]: false }));
    }
 };

   const renderSkeletons = (rows: number) => (
      Array.from({ length: rows }).map((_, index) => (
          <TableRow key={`skeleton-row-${index}`}>
               <TableCell><Skeleton className="h-5 w-32" /></TableCell>
               <TableCell><Skeleton className="h-5 w-24" /></TableCell>
               <TableCell><Skeleton className="h-5 w-16" /></TableCell>
               <TableCell>
                    <div className="flex items-center gap-2">
                       <Skeleton className="h-9 w-24" />
                       <Skeleton className="h-9 w-16" />
                    </div>
               </TableCell>
          </TableRow>
      ))
   );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Package /> Manage Stock</h1>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stock items..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {/* Add Button for adding new stock items if needed (would require adding to menuItems collection) */}
         {/* <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Item to Track</Button> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>View and update the quantity of menu items.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
              <Table>
                  <TableHeader>
                       <TableRow>
                           <TableHead>Item Name</TableHead>
                           <TableHead>Category</TableHead>
                           <TableHead>Current Qty</TableHead>
                           <TableHead>Update Qty</TableHead>
                       </TableRow>
                  </TableHeader>
                  <TableBody>
                      {renderSkeletons(5)}
                  </TableBody>
              </Table>
           ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {stockItems.length === 0 ? 'No items found in the menu to track stock for.' : 'No stock items found matching your search.'}
                    </p>
                     {/* Optional: Add button to navigate to menu management if stock is empty */}
                     {stockItems.length === 0 && <Link href="/chef/manage-menu"><Button className="mt-4">Manage Menu Items</Button></Link>}
                </div>
            ) : (
             <Table>
               <TableCaption>Current inventory levels. Update quantities as needed.</TableCaption>
               <TableHeader>
                 <TableRow>
                   {/* Removed Image Column */}
                   <TableHead>Item Name</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead className="w-[150px]">Current Qty</TableHead>
                   <TableHead className="w-[200px]">Update Qty</TableHead> {/* Increased width */}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredItems.map((item) => {
                    const isLowStock = item.quantityInStock <= LOW_STOCK_THRESHOLD && item.quantityInStock > 0;
                    const isOutOfStock = item.quantityInStock <= 0;
                    const currentInputValue = updatedQuantities[item.id];
                     // Input is considered dirty if it's not undefined (i.e., user has interacted with it)
                    const isDirty = currentInputValue !== undefined;
                     // Input is valid if it's dirty AND (it's an empty string OR (it's a number AND not NaN AND non-negative))
                     const isValidInput = isDirty && (currentInputValue === '' || (typeof currentInputValue === 'number' && !isNaN(currentInputValue) && currentInputValue >= 0));
                     // Save button enabled if input is valid AND not empty string
                     const canSave = isValidInput && currentInputValue !== '';
                     const savingThisItem = isSaving[item.id] || false;

                    return (
                      <TableRow key={item.id} className={isOutOfStock ? 'opacity-60' : ''}>
                         {/* Removed Image Cell */}
                         <TableCell className="font-medium">{item.name}</TableCell>
                         <TableCell>{item.category}</TableCell>
                         <TableCell>
                            <div className="flex items-center gap-1">
                             <span className={isLowStock || isOutOfStock ? 'font-bold' : ''}>
                                {item.quantityInStock}
                              </span>
                               {isLowStock && <AlertCircle className="h-4 w-4 text-orange-500" title="Low Stock" />}
                               {isOutOfStock && <AlertCircle className="h-4 w-4 text-destructive" title="Out of Stock" />}
                             </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <Input
                               type="number"
                               step="1" // Stock quantity is usually whole numbers
                               min="0"
                               className="h-9 w-24"
                               placeholder={String(item.quantityInStock)} // Show current as placeholder
                               value={currentInputValue ?? ''} // Handle undefined/null by showing empty string
                               onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                               disabled={savingThisItem}
                               // Indicate error state visually if needed
                               // className={cn("h-9 w-24", isDirty && !isValidInput ? "border-red-500 ring-red-500" : "")}
                             />
                             <Button
                               size="sm"
                               className="h-9"
                               onClick={() => handleSaveQuantity(item.id, item.name)}
                               disabled={!canSave || savingThisItem} // Disable if input invalid or saving
                               >
                               {savingThisItem ? 'Saving...' : 'Save'}
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                    );
                 })}
               </TableBody>
             </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

