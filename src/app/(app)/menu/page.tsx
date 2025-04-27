
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, PlusCircle, ShoppingCart, PackageSearch, Loader2 } from "lucide-react"; // Updated imports
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { MenuItem } from '@/types/menu'; // Import updated type
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { displayCurrencyDual } from '@/lib/utils'; // Import currency utility
import { useAuth } from '@/lib/auth-context'; // Import useAuth

interface CartItem extends MenuItem {
  orderQuantity: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Cart state managed here
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); // Get user context

  // Load cart from localStorage on initial mount
  useEffect(() => {
      if (!authLoading && user) {
          const savedCart = localStorage.getItem(`cart_${user.id}`);
          if (savedCart) {
              try {
                 setCartItems(JSON.parse(savedCart));
              } catch (e) {
                 console.error("Failed to parse cart from localStorage", e);
                 localStorage.removeItem(`cart_${user.id}`); // Clear invalid data
              }
          }
      }
  }, [user, authLoading]);


  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      try {
        const menuCollection = collection(db, 'menuItems');
        // Fetch all items, filter client-side based on stock if needed or show out-of-stock status
        const q = query(
          menuCollection,
          // where('quantityInStock', '>', 0), // Optional: Only fetch items in stock
          orderBy('category'),
          orderBy('name')
        );
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
          description: "Could not fetch menu items. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, [toast]);

  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseSearch)) || // Check if description exists
      item.category.toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
     if (user && !authLoading) { // Only save if user is loaded
        localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
     }
  }, [cartItems, user, authLoading]);


  const handleAddToCart = (item: MenuItem) => {
     if (!user) {
       toast({ variant: "destructive", title: "Please Log In", description: "You need to be logged in to add items." });
       return;
     }
     if (item.quantityInStock <= 0) {
       toast({ variant: "destructive", title: "Out of Stock", description: `${item.name} is currently unavailable.` });
       return;
     }

     setCartItems(prevCart => {
       const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
       let newCart = [...prevCart];

       if (existingItemIndex > -1) {
         // Item exists, increase quantity if stock allows
         const existingItem = newCart[existingItemIndex];
         if (existingItem.orderQuantity < item.quantityInStock) {
           newCart[existingItemIndex] = { ...existingItem, orderQuantity: existingItem.orderQuantity + 1 };
            toast({ title: `${item.name} added to order`, description: `Quantity: ${existingItem.orderQuantity + 1}` });
         } else {
           toast({ variant: "destructive", title: "Stock Limit Reached", description: `Cannot add more ${item.name}.` });
         }
       } else {
         // Add new item to cart
         newCart.push({ ...item, orderQuantity: 1 });
          toast({ title: `${item.name} added to order`, description: `Quantity: 1` });
       }
       return newCart;
     });
  };

  const getCategories = () => {
     const categories = new Set(menuItems.map(item => item.category));
     return Array.from(categories).sort();
  }

  const categories = getCategories();

  const renderSkeletons = (count: number) => (
    Array.from({ length: count }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="shadow-md flex flex-col">
          <CardContent className="p-4 flex-grow">
             <Skeleton className="h-5 w-3/4 mb-2" />
             <Skeleton className="h-4 w-full mb-3" />
             <Skeleton className="h-3 w-1/4" />
          </CardContent>
           <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-1/4" />
           </CardFooter>
        </Card>
    ))
  );

  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.orderQuantity, 0);

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
         {/* Cart Button */}
         <Link href="/orders" passHref>
           <Button variant="outline" className="relative border-primary text-primary hover:bg-accent hover:text-accent-foreground">
             <ShoppingCart className="mr-2 h-4 w-4" />
             View Order
             {cartTotalItems > 0 && (
               <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                 {cartTotalItems}
               </span>
             )}
           </Button>
         </Link>
      </div>

      {isLoading ? (
         <div className="space-y-8">
             {['Loading Category...', 'Another Category...'].map(cat => (
                 <div key={cat} className="mb-8">
                     <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                        <Skeleton className="h-6 w-1/4" />
                     </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {renderSkeletons(4)}
                     </div>
                 </div>
             ))}
         </div>
      ) : menuItems.length === 0 ? (
         <Card className="text-center py-12 shadow-md">
           <CardHeader>
             <CardTitle>Menu Unavailable</CardTitle>
           </CardHeader>
           <CardContent>
             <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
             <CardDescription>The menu is currently empty or unavailable. Please check back later.</CardDescription>
           </CardContent>
         </Card>
      ) : (
        categories.map(category => {
          const itemsInCategory = filteredItems.filter(item => item.category === category);
          if (itemsInCategory.length === 0 && searchTerm) return null;

          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {itemsInCategory.length === 0 && !searchTerm ? (
                   <p className="text-muted-foreground col-span-full text-center py-4 italic">No items currently available in this category.</p>
                ) : itemsInCategory.length === 0 && searchTerm ? (
                   <p className="text-muted-foreground col-span-full text-center py-4 italic">No '{category}' items match your search.</p>
                ) : (
                  itemsInCategory.map((item) => (
                    <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
                      <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                        <CardDescription className="text-sm mb-2 flex-grow">{item.description || 'No description available.'}</CardDescription>
                        <p className={`text-xs ${item.quantityInStock > 0 ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                             Stock: {item.quantityInStock > 0 ? item.quantityInStock : 'Out of Stock'}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
                        <p className="text-base font-semibold text-primary">{displayCurrencyDual(item.price)}</p>
                        <Button
                           size="sm"
                           className="bg-accent hover:bg-accent/90 text-accent-foreground"
                           onClick={() => handleAddToCart(item)}
                           disabled={item.quantityInStock <= 0 || !user} // Disable if out of stock or not logged in
                           title={!user ? "Log in to add items" : item.quantityInStock <= 0 ? "Out of stock" : "Add to order"}
                         >
                          <PlusCircle className="mr-1 h-4 w-4" /> Add
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
       {filteredItems.length === 0 && searchTerm && !isLoading && menuItems.length > 0 && (
            <p className="text-muted-foreground text-center py-8">No menu items match your search criteria across all categories.</p>
        )}

    </div>
  );
}
