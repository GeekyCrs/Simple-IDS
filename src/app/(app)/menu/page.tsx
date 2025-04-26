'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Search, PlusCircle, MinusCircle, ShoppingCart } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

// Placeholder Types - Define actual types based on your data structure
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // e.g., 'Breakfast', 'Lunch', 'Dinner', 'Beverage', 'Dessert'
  imageUrl?: string;
  quantityInStock: number; // Needed for stock display
}

interface CartItem extends MenuItem {
  orderQuantity: number;
}

// Placeholder Data - Replace with API call
const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese, bun', price: 9.50, category: 'Lunch', imageUrl: 'https://picsum.photos/seed/burger/200/150', quantityInStock: 50 },
  { id: '2', name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan, Caesar dressing', price: 7.00, category: 'Lunch', imageUrl: 'https://picsum.photos/seed/salad/200/150', quantityInStock: 30 },
  { id: '3', name: 'Espresso', description: 'Strong black coffee', price: 2.50, category: 'Beverage', imageUrl: 'https://picsum.photos/seed/coffee/200/150', quantityInStock: 100 },
  { id: '4', name: 'Croissant', description: 'Flaky butter croissant', price: 3.00, category: 'Breakfast', imageUrl: 'https://picsum.photos/seed/croissant/200/150', quantityInStock: 40 },
  { id: '5', name: 'Cheesecake', description: 'Creamy New York style cheesecake', price: 5.50, category: 'Dessert', imageUrl: 'https://picsum.photos/seed/cheesecake/200/150', quantityInStock: 20 },
   { id: '6', name: 'Orange Juice', description: 'Freshly squeezed orange juice', price: 3.50, category: 'Beverage', imageUrl: 'https://picsum.photos/seed/juice/200/150', quantityInStock: 60 },
];

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]); // Simple cart state for demonstration
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch menu items from backend/database
    setMenuItems(initialMenuItems);
    setFilteredItems(initialMenuItems);
  }, []);

  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.description.toLowerCase().includes(lowerCaseSearch) ||
      item.category.toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  const handleAddToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        // Increase quantity if item already in cart
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, orderQuantity: cartItem.orderQuantity + 1 }
            : cartItem
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...item, orderQuantity: 1 }];
      }
    });
    toast({ title: `${item.name} added to order` });
  };

  const getCategories = () => {
     const categories = new Set(menuItems.map(item => item.category));
     return Array.from(categories);
  }

  const categories = getCategories();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen /> Menu</h1>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search menu..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {/* Simple Cart Button Demo */}
         <Link href="/orders" passHref>
           <Button variant="outline" className="relative">
             <ShoppingCart className="mr-2 h-4 w-4" />
             View Order
             {cart.length > 0 && (
               <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                 {cart.reduce((sum, item) => sum + item.orderQuantity, 0)}
               </span>
             )}
           </Button>
         </Link>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.filter(item => item.category === category).map((item) => (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <CardHeader className="p-0">
                  {item.imageUrl && (
                    <div className="relative h-40 w-full">
                      <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" className="rounded-t-lg" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                  <CardDescription className="text-sm mb-2 flex-grow">{item.description}</CardDescription>
                   <p className="text-xs text-muted-foreground">Stock: {item.quantityInStock > 0 ? item.quantityInStock : 'Out of Stock'}</p>
                </CardContent>
                <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
                  <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
                  <Button
                     size="sm"
                     className="bg-accent hover:bg-accent/90 text-accent-foreground"
                     onClick={() => handleAddToCart(item)}
                     disabled={item.quantityInStock <= 0}
                   >
                    <PlusCircle className="mr-1 h-4 w-4" /> Add
                  </Button>
                </CardFooter>
              </Card>
            ))}
             {filteredItems.filter(item => item.category === category).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-4">No items found in this category{searchTerm && ' for your search'}.</p>
              )}
          </div>
        </div>
      ))}
       {filteredItems.length === 0 && searchTerm && (
            <p className="text-muted-foreground text-center py-8">No menu items match your search criteria.</p>
        )}

    </div>
  );
}
