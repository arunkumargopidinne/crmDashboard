import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const requiredEnv = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

function hasFirebaseConfig(): boolean {
  return requiredEnv.every((k) => Boolean(process.env[k as keyof typeof process.env]));
}

let initializedApp: FirebaseApp | null = null;

function initApp(): FirebaseApp | null {
  // If env vars are present, use them. Otherwise fall back to the provided static config.
  // Provided fallback Firebase config (from user):
  const FALLBACK_CONFIG = {
    apiKey: "AIzaSyCgenMuyOq03MCNTf6GSlFH7M_JPUHn5UQ",
    authDomain: "fir-16ee9.firebaseapp.com",
    projectId: "fir-16ee9",
    storageBucket: "fir-16ee9.firebasestorage.app",
    messagingSenderId: "41963003196",
    appId: "1:41963003196:web:b9966bd5e77dd9d2e61239",
    measurementId: "G-5P188MM71W",
  };

  const firebaseConfig = hasFirebaseConfig()
    ? {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
    : FALLBACK_CONFIG;

  if (getApps().length) {
    initializedApp = getApp();
  } else {
    initializedApp = initializeApp(firebaseConfig);
  }

  return initializedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = initializedApp ?? initApp();
  if (!app) return null;
  return getAuth(app);
}
