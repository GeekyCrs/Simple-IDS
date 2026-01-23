// src/lib/auth-utils.ts
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    UserCredential,
    updateProfile
  } from "firebase/auth";
  import { doc, setDoc, serverTimestamp } from "firebase/firestore";
  import { auth, db } from "./firebase";
  
  // Type for user registration
  interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: string;
  }
  
  // Register a new user
  export const registerUser = async ({ name, email, password, role = "client" }: RegisterData) => {
    try {
      // Create auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Set display name
      if (user) {
        await updateProfile(user, {
          displayName: name
        });
      }
      
      // Create user document in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name,
        email,
        role,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Registration failed"
      };
    }
  };
  
  // Sign in existing user
  export const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Sign in failed"
      };
    }
  };
  
  // Sign out
  export const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Sign out failed"
      };
    }
  };