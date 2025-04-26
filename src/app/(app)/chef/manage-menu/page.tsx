
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, PlusCircle, Edit, Trash2, Search, PackageSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'; // Firestore imports
import type { MenuItem } from '@/types/menu'; // Import updated type
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Removed initial placeholder data

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Beverage', 'Dessert', 'Snack']; // Available categories

export default function ManageMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Start with empty array
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  // Ensure formData aligns with MenuItem type, excluding 'id' for new items
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>({
      name: '', description: '', price: 0, category: categories[0], quantityInStock: 0
  });
  const [isLoading, setIsLoading] = useState(true); // Changed initial state to true
  const [isSaving, setIsSaving] = useState(false); // For save/delete operations
  const { toast } = useToast();

  // Fetch menu items from Firestore
  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      try {
        const menuCollection = collection(db, 'menuItems');
        const q = query(menuCollection, orderBy('category'), orderBy('name')); // Order by category then name
        const querySnapshot = await getDocs(q);
        const items: MenuItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        setMenuItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Menu",
          description: "Could not fetch menu items. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenuItems();
  }, [toast]);

  // Filter logic
  useEffect(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = menuItems.filter(item =>
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          item.category.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Use parseFloat for price, parseInt for quantity
    let processedValue: string | number = value;
    if (name === 'price') {
        processedValue = value === '' ? '' : parseFloat(value) || 0; // Allow empty string or parse float
    } else if (name === 'quantityInStock') {
        processedValue = value === '' ? '' : parseInt(value, 10) || 0; // Allow empty string or parse int
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
};

  const handleSelectChange = (value: string) => {
     setFormData(prev => ({ ...prev, category: value }));
  };

  const openDialog = (item: MenuItem | null = null) => {
    setEditingItem(item);
    // If editing, populate form with item data (excluding id). If adding, reset form.
    setFormData(item ? {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        quantityInStock: item.quantityInStock,
    } : { name: '', description: '', price: 0, category: categories[0], quantityInStock: 0 });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: 0, category: categories[0], quantityInStock: 0 }); // Reset form
  };

  const handleFormSubmit = async () => {
    setIsSaving(true); // Use isSaving state

     // Validate required fields and numeric values
    if (!formData.name || !formData.category || formData.price == null || formData.price <= 0 || formData.quantityInStock == null || formData.quantityInStock < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Name, Category, a valid positive Price, and a non-negative Stock Quantity." });
        setIsSaving(false);
        return;
    }

    // Ensure numeric fields are numbers before saving
    const dataToSave = {
      ...formData,
      price: Number(formData.price),
      quantityInStock: Number(formData.quantityInStock),
    };

    try {
      if (editingItem) {
        // Update item in Firestore
        const itemRef = doc(db, 'menuItems', editingItem.id);
        await updateDoc(itemRef, dataToSave);
        // Update local state
        setMenuItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...dataToSave } : item));
        toast({ title: "Item Updated", description: `${dataToSave.name} has been updated.` });
      } else {
        // Add new item to Firestore
        const docRef = await addDoc(collection(db, 'menuItems'), dataToSave);
        // Update local state with the new item including the Firestore-generated ID
        const newItem = { ...dataToSave, id: docRef.id };
        setMenuItems(prev => [...prev, newItem]);
        toast({ title: "Item Added", description: `${newItem.name} has been added to the menu.` });
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save menu item." });
    } finally {
      setIsSaving(false); // End saving operation
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    // Use confirm dialog (browser native)
    const confirmDelete = window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    setIsSaving(true); // Indicate processing
    try {
      // Delete item from Firestore
      await deleteDoc(doc(db, 'menuItems', itemId));
      // Update local state
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: `${itemName} has been removed from the menu.` });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete menu item." });
    } finally {
      setIsSaving(false); // End processing
    }
  };

   const renderSkeletons = (rows: number) => (
      Array.from({ length: rows }).map((_, index) => (
          <TableRow key={`skeleton-row-${index}`}>
               <TableCell><Skeleton className="h-5 w-20" /></TableCell>
               <TableCell><Skeleton className="h-5 w-16" /></TableCell>
               <TableCell><Skeleton className="h-5 w-12" /></TableCell>
               <TableCell><Skeleton className="h-5 w-10" /></TableCell>
               <TableCell className="text-right space-x-2">
                  <Skeleton className="h-8 w-8 inline-block" />
                  <Skeleton className="h-8 w-8 inline-block" />
               </TableCell>
          </TableRow>
      ))
   );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen /> Manage Menu</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <div className="relative flex-grow md:flex-grow-0 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Search menu items..."
               className="pl-10"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
          <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>Add, edit, or remove items available in the canteen.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
              <Table>
                  <TableHeader>
                       <TableRow>
                           <TableHead>Name</TableHead>
                           <TableHead>Category</TableHead>
                           <TableHead>Price</TableHead>
                           <TableHead>Stock Qty</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
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
                        {menuItems.length === 0 ? 'The menu is currently empty.' : 'No menu items found matching your search.'}
                    </p>
                    {menuItems.length === 0 && !searchTerm && (
                         <Button onClick={() => openDialog()} className="mt-4 bg-primary hover:bg-primary/90">Add Your First Item</Button>
                    )}
                </div>
            ) : (
             <Table>
               <TableCaption>List of all menu items.</TableCaption>
               <TableHeader>
                 <TableRow>
                   {/* Removed Image Column */}
                   <TableHead>Name</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead>Price</TableHead>
                   <TableHead>Stock Qty</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredItems.map((item) => (
                   <TableRow key={item.id}>
                    {/* Removed Image Cell */}
                     <TableCell className="font-medium">{item.name}</TableCell>
                     <TableCell>{item.category}</TableCell>
                     <TableCell>${item.price.toFixed(2)}</TableCell>
                     <TableCell>{item.quantityInStock}</TableCell>
                     <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={() => openDialog(item)} disabled={isSaving}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteItem(item.id, item.name)} disabled={isSaving}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
            )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isSaving && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details for this menu item.' : 'Enter the details for the new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} className="col-span-3" required disabled={isSaving} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} className="col-span-3" rows={3} disabled={isSaving}/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
                <Select name="category" value={formData.category} onValueChange={handleSelectChange} disabled={isSaving}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price ($)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0.01" value={formData.price || ''} onChange={handleInputChange} className="col-span-3" required disabled={isSaving} />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantityInStock" className="text-right">Stock Qty</Label>
              <Input id="quantityInStock" name="quantityInStock" type="number" step="1" min="0" value={formData.quantityInStock ?? ''} onChange={handleInputChange} className="col-span-3" required disabled={isSaving} />
            </div>
            {/* Removed Image URL input */}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>Cancel</Button>
             </DialogClose>
             <Button type="button" onClick={handleFormSubmit} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                {isSaving ? 'Saving...' : 'Save Item'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
