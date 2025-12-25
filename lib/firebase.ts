import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB_wlTisykoPnE2E3NZJ1bSz0ErxjINgfY",
  authDomain: "curious-context-409607.firebaseapp.com",
  projectId: "curious-context-409607",
  storageBucket: "curious-context-409607.firebasestorage.app",
  messagingSenderId: "386472192378",
  appId: "1:386472192378:web:1482a0891df928700ecec3",
  measurementId: "G-9BXK65Y6XR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with proper typing
export const db: Firestore = getFirestore(app);

export const functions = getFunctions(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Ignore analytics errors
    });
  }).catch(() => {
    // Ignore analytics import errors
  });
}

export { analytics };
export default app;