'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  User, // Firebase User type
  signInWithPopup,
  signOut as firebaseSignOut,
  getUserProfile,
  initializeOrResetSpins,
  loginWithEmail,
  registerWithEmail,
  resetPassword
} from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

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

  // Implementierung der E-Mail/Passwort-Funktionen
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      await loginWithEmail(email, password);
      // User wird durch onAuthStateChanged gesetzt, aber wir stellen sicher,
      // dass isAuthLoading zurückgesetzt wird, wenn das zu lange dauert
      setTimeout(() => {
        setIsAuthLoading(false);
      }, 1500); // Sicherheits-Timeout nach 1,5 Sekunden
    } catch (error) {
      console.error("Fehler bei der E-Mail-Anmeldung:", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Anmeldung fehlgeschlagen');
      }
      setIsAuthLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      await registerWithEmail(email, password);
      // User wird durch onAuthStateChanged gesetzt und Profil initialisiert
      // Sicherheits-Timeout für den Fall, dass onAuthStateChanged nicht korrekt auslöst
      setTimeout(() => {
        setIsAuthLoading(false);
      }, 1500); // Sicherheits-Timeout nach 1,5 Sekunden
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Registrierung fehlgeschlagen');
      }
      setIsAuthLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      setAuthError(null);
      await resetPassword(email);
      return true;
    } catch (error) {
      console.error("Fehler beim Zurücksetzen des Passworts:", error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Passwort-Reset fehlgeschlagen');
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthLoading,
      signInWithGoogle,
      signOutUser,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordResetEmail,
      authError
    }}>
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
