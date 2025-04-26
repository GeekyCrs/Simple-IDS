
// src/types/menu.ts

export interface MenuItem {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  category: string; // e.g., 'Breakfast', 'Lunch', 'Dinner', 'Beverage', 'Dessert'
  quantityInStock: number;
  // Removed imageUrl
}
