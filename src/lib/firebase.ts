// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// It's best practice to use environment variables for sensitive data like API keys.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "FIRE_BASE_API_HERE",
  authDomain: "sample-firebase-ai-app-58f71.firebaseapp.com",
  projectId: "sample-firebase-ai-app-58f71",
  storageBucket: "sample-firebase-ai-app-58f71.firebasestorage.app",
  messagingSenderId: "376700116772",
  appId: "1:376700116772:web:f85ead3bc5ec9d5a759db1",
  measurementId: "G-3JBPS7YZS2"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
