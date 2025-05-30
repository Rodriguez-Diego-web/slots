import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, FieldValue, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { SlotSymbol } from './slotLogic';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

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

const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UserProfile {
  spinsLeft: number;
  lastSpinsResetDate: string; 
}

const DEFAULT_SPINS = 3;
const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'userProfiles', userId);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  }
  return null;
};

const initializeOrResetSpins = async (userId: string): Promise<UserProfile> => {
  const currentDate = getCurrentDateString();
  const newUserProfile: UserProfile = {
    spinsLeft: DEFAULT_SPINS,
    lastSpinsResetDate: currentDate,
  };
  const userDocRef = doc(db, 'userProfiles', userId);
  await setDoc(userDocRef, newUserProfile, { merge: true }); 
  return newUserProfile;
};

const updateUserSpinsCount = async (userId: string, newSpinsLeft: number): Promise<void> => {
  const userDocRef = doc(db, 'userProfiles', userId);
  await setDoc(userDocRef, { spinsLeft: newSpinsLeft }, { merge: true });
};

interface WinRecordData {
  userId: string;
  timestamp: FieldValue;
  winAmount: number;
  winningWord: string | null;
  symbols: SlotSymbol[];
}

interface WinRecordDataWithCode extends WinRecordData {
  winCode: string;
  codeFormat: string; 
  isClaimed: boolean;
  claimedAt?: Timestamp | null;
}

const CODE_CHARSET_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_CHARSET_NUMBERS = "0123456789";
const CODE_LENGTH_LETTERS = 2;
const CODE_LENGTH_NUMBERS = 4;

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

const isCodeUnique = async (code: string): Promise<boolean> => {
  const q = query(collection(db, "userWins"), where("winCode", "==", code), where("isClaimed", "==", false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty; 
};

const generateUniqueWinCode = async (): Promise<string> => {
  let attempts = 0;
  const MAX_ATTEMPTS = 10; 

  while (attempts < MAX_ATTEMPTS) {
    const newCode = generateRandomCode();
    if (await isCodeUnique(newCode)) {
      return newCode;
    }
    attempts++;
  }
  console.error("Failed to generate a unique win code after", MAX_ATTEMPTS, "attempts.");
  throw new Error("Could not generate a unique win code.");
};

export const saveUserWin = async (
  userId: string,
  winAmount: number,
  winningWord: string | null,
  symbols: SlotSymbol[]
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
      claimedAt: null,
    };
    const docRef = await addDoc(collection(db, "userWins"), winData);
    console.log("Win recorded in Firestore with ID: ", docRef.id, "and Code:", uniqueWinCode);
    return { winId: docRef.id, winCode: uniqueWinCode };
  } catch (error) {
    console.error("Error saving user win to Firestore: ", error);
    throw error; 
  }
};

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

// E-Mail-Authentifizierung wurde entfernt, nur Google-Login ist zulässig

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
  DEFAULT_SPINS,
  saveGuestSpinToLocalStorage,
  checkGuestSpinStatus,
  clearGuestSpinFromLocalStorage
};
