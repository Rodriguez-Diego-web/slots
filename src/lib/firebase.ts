// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, FieldValue, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { SlotSymbol } from './slotLogic';

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
  symbols: SlotSymbol[]; // Storing the array of symbol objects
}

// Extended interface for win record including the win code
interface WinRecordDataWithCode extends WinRecordData {
  winCode: string;
  codeFormat: string; // e.g., "XX9999"
  isClaimed: boolean;
  claimedAt?: Timestamp | null; // Timestamp when the code was claimed
}

const CODE_CHARSET_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_CHARSET_NUMBERS = "0123456789";
const CODE_LENGTH_LETTERS = 2;
const CODE_LENGTH_NUMBERS = 4;

// Generates a random code in XX9999 format
const generateRandomCode = (): string => {
  let code = "";
  for (let i = 0; i < CODE_LENGTH_LETTERS; i++) {
    code += CODE_CHARSET_LETTERS.charAt(Math.floor(Math.random() * CODE_CHARSET_LETTERS.length));
  }
  for (let i = 0; i < CODE_LENGTH_NUMBERS; i++) {
    code += CODE_CHARSET_NUMBERS.charAt(Math.floor(Math.random() * CODE_CHARSET_NUMBERS.length));
  }
  return code;
};

// Checks if a given win code is unique among unclaimed wins
const isCodeUnique = async (code: string): Promise<boolean> => {
  const q = query(collection(db, "userWins"), where("winCode", "==", code), where("isClaimed", "==", false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty; // True if no documents found (code is unique for unclaimed wins)
};

// Generates a unique win code by repeatedly generating and checking
const generateUniqueWinCode = async (): Promise<string> => {
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // Safeguard against infinite loops if code space gets too full

  while (attempts < MAX_ATTEMPTS) {
    const newCode = generateRandomCode();
    if (await isCodeUnique(newCode)) {
      return newCode;
    }
    attempts++;
  }
  // Fallback or error handling if a unique code cannot be generated after MAX_ATTEMPTS
  // This is unlikely with 6.76 million combinations but good practice
  console.error("Failed to generate a unique win code after", MAX_ATTEMPTS, "attempts.");
  // Consider throwing an error or returning a default/fallback or trying a different strategy
  throw new Error("Could not generate a unique win code.");
};

export const saveUserWin = async (
  userId: string,
  winAmount: number,
  winningWord: string | null,
  symbols: SlotSymbol[] // The array of 3 symbols that formed the win
): Promise<{winId: string, winCode: string} | undefined> => {
  if (!userId) {
    console.error("Cannot save win: No user ID provided.");
    return;
  }
  if (!symbols || symbols.length !== 3) {
    console.error("Cannot save win: Invalid symbols array provided. Expected 3 symbols.", symbols);
    return;
  }

  try {
    const uniqueWinCode = await generateUniqueWinCode();

    const winData: WinRecordDataWithCode = {
      userId,
      timestamp: serverTimestamp(),
      winAmount,
      winningWord,
      symbols,
      winCode: uniqueWinCode,
      codeFormat: "XX9999",
      isClaimed: false,
      claimedAt: null, // Initially not claimed
    };
    const docRef = await addDoc(collection(db, "userWins"), winData);
    console.log("Win recorded in Firestore with ID: ", docRef.id, "and Code:", uniqueWinCode);
    return { winId: docRef.id, winCode: uniqueWinCode };
  } catch (error) {
    console.error("Error saving user win to Firestore: ", error);
    // Consider more sophisticated error handling or re-throwing if needed
    // If generateUniqueWinCode throws, it will be caught here.
    throw error; // Re-throw the error so the caller can handle it
  }
};

// Funktionen für die Verwaltung von Gast-Spins über localStorage
const saveGuestSpinToLocalStorage = () => {
  const currentDate = getCurrentDateString();
  if (typeof window !== 'undefined') {
    localStorage.setItem('guestSpin', currentDate);
  }
};

const checkGuestSpinStatus = () => {
  if (typeof window !== 'undefined') {
    const lastSpinDate = localStorage.getItem('guestSpin');
    const currentDate = getCurrentDateString();
    return lastSpinDate === currentDate;
  }
  return false;
};

const clearGuestSpinFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestSpin');
  }
};

// E-Mail/Passwort-Authentifizierungsfunktionen
const registerWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Bestätigungs-E-Mail senden
    await sendEmailVerification(user);
    console.log('Bestätigungs-E-Mail wurde gesendet an:', email);
    
    return user;
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    throw error; // Fehler weitergeben für besseres Error-Handling
  }
};

const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Überprüfen, ob die E-Mail bestätigt wurde
    if (!user.emailVerified) {
      // Wenn die E-Mail nicht bestätigt wurde, erneut eine Bestätigungs-E-Mail senden
      await sendEmailVerification(user);
      throw new Error("E-Mail-Adresse nicht bestätigt. Eine neue Bestätigungs-E-Mail wurde gesendet.");
    }
    
    return user;
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error);
    throw error; // Fehler weitergeben für besseres Error-Handling
  }
};

const resetPassword = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin, // Fügt die aktuelle Domain als Rückkehr-URL hinzu
      handleCodeInApp: false // Für Standard-E-Mail-Handling
    });
    console.log('Passwort-Zurücksetzen-E-Mail wurde gesendet an:', email);
    return true;
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    throw error; // Fehler weitergeben für besseres Error-Handling
  }
};

// Funktion zum erneuten Senden der Bestätigungs-E-Mail
const sendVerificationEmail = async (user: User): Promise<boolean> => {
  try {
    await sendEmailVerification(user);
    console.log('Bestätigungs-E-Mail wurde erneut gesendet');
    return true;
  } catch (error) {
    console.error("Fehler beim Senden der Bestätigungs-E-Mail:", error);
    throw error;
  }
};

// Funktion zum Überprüfen, ob die E-Mail-Adresse bestätigt wurde
const checkEmailVerification = async (user: User): Promise<boolean> => {
  try {
    // Force-Reload des User-Objekts, um den aktuellen Status zu erhalten
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error("Fehler beim Überprüfen des E-Mail-Status:", error);
    return false;
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User, 
  getUserProfile,
  initializeOrResetSpins,
  updateUserSpinsCount,
  getCurrentDateString,
  DEFAULT_SPINS,
  saveGuestSpinToLocalStorage,
  checkGuestSpinStatus,
  clearGuestSpinFromLocalStorage,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  sendVerificationEmail,
  checkEmailVerification
};
