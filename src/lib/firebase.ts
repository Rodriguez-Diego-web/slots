// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, FieldValue } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { Symbol } from './slotLogic';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcE3-PbiujHJ1eQW_ZrW0NXya0tjfcuAM",
  authDomain: "slotgame-84887.firebaseapp.com",
  projectId: "slotgame-84887",
  storageBucket: "slotgame-84887.firebasestorage.app",
  messagingSenderId: "932278755769",
  appId: "1:932278755769:web:5210e0bccdb0403d42d668",
  measurementId: "G-3M0GRRM5VE"
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
