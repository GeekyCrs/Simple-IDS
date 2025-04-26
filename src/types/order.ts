
// src/types/order.ts
import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface OrderItemDetail {
  itemId: string; // Reference to the MenuItem id
  name: string;
  quantity: number;
  price: number; // Price per unit at the time of order
}

export interface Order {
  id: string; // Firestore document ID
  userId: string; // ID of the user who placed the order
  userName: string; // Name of the user (for display)
  items: OrderItemDetail[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  notes?: string;
  preferredTime?: string; // e.g., "12:30", "ASAP"
  orderTimestamp: Timestamp | FieldValue | string; // Firestore Timestamp, ServerTimestamp, or ISO string
}

