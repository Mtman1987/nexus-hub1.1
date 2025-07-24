
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Function to safely get items from localStorage, only on the client side.
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Your web app's Firebase configuration
// This will now be dynamically loaded from localStorage.
const firebaseConfig = {
  apiKey: getLocalStorageItem('firebaseApiKey') || "FIRE_BASE_API_HERE",
  authDomain: getLocalStorageItem('firebaseAuthDomain') || "sample-firebase-ai-app-58f71.firebaseapp.com",
  projectId: getLocalStorageItem('firebaseProjectId') || "sample-firebase-ai-app-58f71",
  storageBucket: getLocalStorageItem('firebaseStorageBucket') || "sample-firebase-ai-app-58f71.appspot.com",
  messagingSenderId: getLocalStorageItem('firebaseMessagingSenderId') || "376700116772",
  appId: getLocalStorageItem('firebaseAppId') || "1:376700116772:web:f85ead3bc5ec9d5a759db1",
};

// Initialize Firebase
// We check if the essential config is present before initializing.
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "FIRE_BASE_API_HERE";
const app = !getApps().length && isConfigured ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);
const db = app ? getFirestore(app) : null;

export { app, db };

    