// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, FieldValue } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { Symbol } from './slotLogic';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const provider = new GoogleAuthProvider();

// Helper to get current date as YYYY-MM-DD string
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UserProfile {
  spinsLeft: number;
  lastSpinsResetDate: string; // YYYY-MM-DD
  // Optionally add other fields like displayName, email if needed here
}

const DEFAULT_SPINS = 3;

// Get user profile (spins and last reset date)
const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'userProfiles', userId);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  }
  return null;
};

// Initialize or reset spins for a user
const initializeOrResetSpins = async (userId: string): Promise<UserProfile> => {
  const currentDate = getCurrentDateString();
  const newUserProfile: UserProfile = {
    spinsLeft: DEFAULT_SPINS,
    lastSpinsResetDate: currentDate,
  };
  const userDocRef = doc(db, 'userProfiles', userId);
  await setDoc(userDocRef, newUserProfile, { merge: true }); // merge true to not overwrite other fields if any
  return newUserProfile;
};

// Update only the spins count for a user
const updateUserSpinsCount = async (userId: string, newSpinsLeft: number): Promise<void> => {
  const userDocRef = doc(db, 'userProfiles', userId);
  await setDoc(userDocRef, { spinsLeft: newSpinsLeft }, { merge: true });
};

// Interface for the data structure of a win record
interface WinRecordData {
  userId: string;
  timestamp: FieldValue;
  winAmount: number;
  winningWord: string | null;
  symbols: Symbol[]; // Storing the array of symbol objects
}

export const saveUserWin = async (
  userId: string,
  winAmount: number,
  winningWord: string | null,
  symbols: Symbol[] // The array of 3 symbols that formed the win
) => {
  if (!userId) {
    console.error("Cannot save win: No user ID provided.");
    return;
  }
  if (!symbols || symbols.length !== 3) {
    console.error("Cannot save win: Invalid symbols array provided. Expected 3 symbols.", symbols);
    return;
  }

  try {
    const winData: WinRecordData = {
      userId,
      timestamp: serverTimestamp(),
      winAmount,
      winningWord,
      symbols,
    };
    const docRef = await addDoc(collection(db, "userWins"), winData);
    console.log("Win recorded in Firestore with ID: ", docRef.id);
    return docRef.id; // Optionally return the document ID
  } catch (error) {
    console.error("Error saving user win to Firestore: ", error);
    // Consider more sophisticated error handling or re-throwing if needed
  }
};

// Funktionen für die Verwaltung von Gast-Spins über localStorage
export const saveGuestSpinToLocalStorage = () => {
  const currentDate = getCurrentDateString();
  if (typeof window !== 'undefined') {
    localStorage.setItem('guestSpin', currentDate);
  }
};

export const checkGuestSpinStatus = () => {
  if (typeof window !== 'undefined') {
    const lastSpinDate = localStorage.getItem('guestSpin');
    const currentDate = getCurrentDateString();
    return lastSpinDate === currentDate;
  }
  return false;
};

export const clearGuestSpinFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestSpin');
  }
};

export { 
  app, 
  auth, 
  db, 
  analytics, 
  provider, 
  signInWithPopup, 
  signOut, 
  type User, 
  getUserProfile,
  initializeOrResetSpins,
  updateUserSpinsCount,
  getCurrentDateString,
  DEFAULT_SPINS
};
