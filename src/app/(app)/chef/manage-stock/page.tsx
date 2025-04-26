"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Search, Package, PackageSearch, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { updateStockLevel, getStockLevel } from '@/services/stock-management'; // Import service functions

// Re-use type from menu page
interface StockItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  quantityInStock: number;
}

// Placeholder Data - Replace with API call to fetch *all* items relevant for stock (not just menu items)
const initialStockItems: StockItem[] = [
  { id: '1', name: 'Classic Burger Patty', category: 'Ingredient', quantityInStock: 150 },
  { id: 'item-lettuce', name: 'Lettuce Heads', category: 'Ingredient', quantityInStock: 25 },
  { id: 'item-tomato', name: 'Tomatoes (kg)', category: 'Ingredient', quantityInStock: 15.5 },
  { id: '3', name: 'Espresso Beans (kg)', category: 'Ingredient', quantityInStock: 8 },
  { id: '4', name: 'Croissant (Frozen)', category: 'Prepared Item', quantityInStock: 0 },
  { id: 'item-cheesecake-base', name: 'Cheesecake Base', category: 'Ingredient', quantityInStock: 10 },
  { id: 'item-coke', name: 'Coca-Cola Can', category: 'Beverage', quantityInStock: 80 },
  { id: 'item-water', name: 'Water Bottle', category: 'Beverage', quantityInStock: 120 },
];

const LOW_STOCK_THRESHOLD = 10; // Example threshold

export default function ManageStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatedQuantities, setUpdatedQuantities] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSaving, setIsSaving] = useState(false); // For save operations
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch stock items from backend/database
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
       // Fetch initial quantities using the service (simulated)
       const fetchPromises = initialStockItems.map(async (item) => {
            // In reality, you might fetch all at once or individually
            const currentQty = await getStockLevel(item.name); // Simulate fetching
            return { ...item, quantityInStock: currentQty !== undefined ? currentQty : item.quantityInStock }; // Fallback to initial if fetch fails
       });
       Promise.all(fetchPromises).then(fetchedItems => {
            setStockItems(fetchedItems);
            setFilteredItems(fetchedItems);
            setIsLoading(false);
       });
    }, 1000);
  }, []);

 useEffect(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = stockItems.filter(item =>
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          item.category.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredItems(filtered);
  }, [searchTerm, stockItems]);


  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value, 10);
     // Allow empty input for clearing, but store as NaN or handle validation on save
    setUpdatedQuantities(prev => ({
      ...prev,
      [itemId]: isNaN(quantity) ? NaN : quantity, // Store NaN if input is not a valid number
    }));
  };

 const handleSaveQuantity = async (itemId: string, itemName: string) => {
    const newQuantity = updatedQuantities[itemId];

    if (newQuantity === undefined || isNaN(newQuantity) || newQuantity < 0) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a valid non-negative quantity for ${itemName}.` });
        return;
    }

    setIsSaving(true);
    try {
        // Call the service function to update stock level
        await updateStockLevel(itemName, newQuantity);

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
        setIsSaving(false);
    }
 };


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
         {/* Add Button for adding new stock items if needed */}
         {/* <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Stock Item</Button> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>View and update the quantity of ingredients and items.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-12"><p className="text-muted-foreground">Loading stock items...</p></div>
           ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No stock items found{searchTerm ? ' matching your search' : ''}.</p>
                </div>
            ) : (
             <Table>
               <TableCaption>Current inventory levels. Update quantities as needed.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[80px]">Image</TableHead>
                   <TableHead>Item Name</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead className="w-[150px]">Current Qty</TableHead>
                   <TableHead className="w-[180px]">Update Qty</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredItems.map((item) => {
                    const isLowStock = item.quantityInStock <= LOW_STOCK_THRESHOLD && item.quantityInStock > 0;
                    const isOutOfStock = item.quantityInStock <= 0;
                    const currentInputValue = updatedQuantities[item.id];
                    const isDirty = currentInputValue !== undefined; // Check if input has been touched

                    return (
                      <TableRow key={item.id} className={isOutOfStock ? 'opacity-60' : ''}>
                         <TableCell>
                           <div className="relative h-12 w-16 rounded overflow-hidden">
                             <Image src={item.imageUrl || 'https://picsum.photos/seed/stockplaceholder/200/150'} alt={item.name} layout="fill" objectFit="cover" />
                           </div>
                         </TableCell>
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
                               step="any" // Allow decimals for things like kg
                               min="0"
                               className="h-9 w-24"
                               placeholder={String(item.quantityInStock)} // Show current as placeholder
                               value={isNaN(currentInputValue) ? '' : currentInputValue ?? ''} // Handle NaN for empty input
                               onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                               disabled={isSaving}
                             />
                             <Button
                               size="sm"
                               className="h-9"
                               onClick={() => handleSaveQuantity(item.id, item.name)}
                               disabled={!isDirty || isNaN(updatedQuantities[item.id]) || updatedQuantities[item.id] < 0 || isSaving} // Disable if no change, invalid, or saving
                               >
                               {isSaving ? 'Saving...' : 'Save'}
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
