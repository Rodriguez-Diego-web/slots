'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  db,
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  getUserProfile,
  initializeOrResetSpins
} from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Funktion zum Prüfen der Admin-Rolle eines Benutzers
  const checkAdminStatus = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'userProfiles', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Fehler beim Prüfen des Admin-Status:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          await initializeOrResetSpins(user.uid);
        }
        
        const adminStatus = await checkAdminStatus(user.uid);
        setIsAdmin(adminStatus);
        
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Ein Fehler ist bei der Google-Anmeldung aufgetreten');
      }
      setIsAuthLoading(false); 
    }
  };

  const signOutUser = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Ein Fehler ist beim Abmelden aufgetreten');
      }
      setIsAuthLoading(false); 
    }
  };

  const contextValue = {
    currentUser,
    isAuthLoading,
    authError,
    isAdmin,
    signInWithGoogle,
    signOutUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
