// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Function to safely get items from localStorage, only on the client side.
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Your web app's Firebase configuration
// This will now be dynamically loaded from localStorage.
const firebaseConfig = {
  apiKey: getLocalStorageItem('firebaseApiKey'),
  authDomain: getLocalStorageItem('firebaseAuthDomain'),
  projectId: getLocalStorageItem('firebaseProjectId'),
  storageBucket: getLocalStorageItem('firebaseStorageBucket'),
  messagingSenderId: getLocalStorageItem('firebaseMessagingSenderId'),
  appId: getLocalStorageItem('firebaseAppId'),
};

// Initialize Firebase only if the config is valid and it hasn't been initialized yet.
// This check prevents errors when the app first loads without any keys in localStorage.
if (firebaseConfig.apiKey && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else if (getApps().length) {
  app = getApp();
  db = getFirestore(app);
}

export { app, db };
