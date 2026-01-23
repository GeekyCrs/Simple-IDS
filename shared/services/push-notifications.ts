import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Sends a push notification to all users.
 * Since we don't have a real service implemented,
 * we will simulate that by logging to the console a message for each user
 */
export async function sendPushNotification(message: string): Promise<void> {
  try {
    // Get all users from Firestore where role is "client"
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("role", "==", "client"));
    const querySnapshot = await getDocs(q);

    const usersIds: string[] = [];
    querySnapshot.forEach((doc) => {
      usersIds.push(doc.id); // Extract user IDs
    });

    // Simulate sending push notification to each client user
    for (const userId of usersIds) {
      console.log(`Sending push notification to user ${userId}: ${message}`);
    }

    console.log(
      `Push notifications sent (simulated) to ${usersIds.length} client(s).`
    );
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error; // Re-throw error to handle it in the calling function
  }
  return;
}
