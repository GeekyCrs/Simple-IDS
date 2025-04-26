"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, PlusCircle, Edit, Trash2, Search, PackageSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

// Re-use type from menu page, add quantityInStock
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  quantityInStock: number; // Essential for management
}

// Placeholder Data - Replace with API call
const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese, bun', price: 9.50, category: 'Lunch', imageUrl: 'https://picsum.photos/seed/burger/200/150', quantityInStock: 50 },
  { id: '2', name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan, Caesar dressing', price: 7.00, category: 'Lunch', imageUrl: 'https://picsum.photos/seed/salad/200/150', quantityInStock: 30 },
  { id: '3', name: 'Espresso', description: 'Strong black coffee', price: 2.50, category: 'Beverage', imageUrl: 'https://picsum.photos/seed/coffee/200/150', quantityInStock: 100 },
  { id: '4', name: 'Croissant', description: 'Flaky butter croissant', price: 3.00, category: 'Breakfast', imageUrl: 'https://picsum.photos/seed/croissant/200/150', quantityInStock: 0 }, // Example out of stock
  { id: '5', name: 'Cheesecake', description: 'Creamy New York style cheesecake', price: 5.50, category: 'Dessert', imageUrl: 'https://picsum.photos/seed/cheesecake/200/150', quantityInStock: 20 },
];

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Beverage', 'Dessert', 'Snack']; // Available categories

export default function ManageMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems); // Replace with fetched data
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(initialMenuItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch menu items from backend
  }, []);

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
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'quantityInStock' ? Number(value) : value }));
  };

  const handleSelectChange = (value: string) => {
     setFormData(prev => ({ ...prev, category: value }));
  };

  const openDialog = (item: MenuItem | null = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : { name: '', description: '', price: 0, category: categories[0], quantityInStock: 0, imageUrl: '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormSubmit = async () => {
    setIsLoading(true);
    const dataToSave = { ...formData };

    if (!dataToSave.name || !dataToSave.category || dataToSave.price == null || dataToSave.price <= 0 || dataToSave.quantityInStock == null || dataToSave.quantityInStock < 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill in Name, Category, valid Price, and non-negative Stock Quantity." });
        setIsLoading(false);
        return;
    }

    try {
      if (editingItem) {
        // TODO: Update item in backend
        console.log("Updating item:", editingItem.id, dataToSave);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setMenuItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...dataToSave } as MenuItem : item));
        toast({ title: "Item Updated", description: `${dataToSave.name} has been updated.` });
      } else {
        // TODO: Add new item to backend
        const newItemId = `new-${Date.now()}`; // Generate temporary ID, backend should generate real one
        const newItem = { ...dataToSave, id: newItemId } as MenuItem;
        console.log("Adding new item:", newItem);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setMenuItems(prev => [...prev, newItem]);
        toast({ title: "Item Added", description: `${newItem.name} has been added to the menu.` });
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save menu item." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Delete item from backend
      console.log("Deleting item:", itemId);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Item Deleted", description: `${itemName} has been removed from the menu.` });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete menu item." });
    } finally {
      setIsLoading(false);
    }
  };

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
           {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No menu items found{searchTerm ? ' matching your search' : ''}.</p>
                    {!searchTerm && <Button onClick={() => openDialog()} className="mt-4">Add Your First Item</Button>}
                </div>
            ) : (
             <Table>
               <TableCaption>List of all menu items.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[80px]">Image</TableHead>
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
                    <TableCell>
                        <div className="relative h-12 w-16 rounded overflow-hidden">
                            <Image src={item.imageUrl || 'https://picsum.photos/seed/placeholder/200/150'} alt={item.name} layout="fill" objectFit="cover" />
                        </div>
                    </TableCell>
                     <TableCell className="font-medium">{item.name}</TableCell>
                     <TableCell>{item.category}</TableCell>
                     <TableCell>${item.price.toFixed(2)}</TableCell>
                     <TableCell>{item.quantityInStock}</TableCell>
                     <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={() => openDialog(item)} disabled={isLoading}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteItem(item.id, item.name)} disabled={isLoading}>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} className="col-span-3" rows={3} />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
                <Select name="category" value={formData.category} onValueChange={handleSelectChange}>
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
              <Input id="price" name="price" type="number" step="0.01" min="0.01" value={formData.price || ''} onChange={handleInputChange} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantityInStock" className="text-right">Stock Qty</Label>
              <Input id="quantityInStock" name="quantityInStock" type="number" step="1" min="0" value={formData.quantityInStock ?? ''} onChange={handleInputChange} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} className="col-span-3" placeholder="(Optional) https://..." />
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
             </DialogClose>
             <Button type="button" onClick={handleFormSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? 'Saving...' : 'Save Item'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
