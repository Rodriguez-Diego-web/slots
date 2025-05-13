'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  User, // Firebase User type
  signInWithPopup,
  signOut as firebaseSignOut,
  getUserProfile,
  initializeOrResetSpins 
} from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see if we have a profile, otherwise create one.
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          // New user, initialize spins etc.
          await initializeOrResetSpins(user.uid);
        }
        setCurrentUser(user);
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsAuthLoading(true);
      await signInWithPopup(auth, provider);
      // User object is handled by onAuthStateChanged
      // If new user, onAuthStateChanged logic will create profile and spins
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setIsAuthLoading(false); // Ensure loading is false on error
    }
  };

  const signOutUser = async () => {
    try {
      setIsAuthLoading(true);
      await firebaseSignOut(auth);
      // currentUser will be set to null by onAuthStateChanged
    } catch (error) {
      console.error("Error signing out: ", error);
      setIsAuthLoading(false); // Ensure loading is false on error
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthLoading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
