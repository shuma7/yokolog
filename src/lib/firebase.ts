// src/lib/firebase.ts (New file)
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration from the Firebase console.
// These should ideally be stored in environment variables (e.g., .env.local)
// and accessed via process.env.NEXT_PUBLIC_FIREBASE_...
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  if (!firebaseConfig.projectId) {
    console.warn(
      'Firebase config not found. Features requiring Firebase will not work. ' +
      'Please ensure your .env.local file is set up with Firebase credentials.'
    );
    // Provide dummy app and db if config is missing to prevent hard crashes on import
    // although features requiring db will fail.
    app = {} as FirebaseApp; // This is a mock, app won't be functional
    db = {} as Firestore;    // This is a mock, db won't be functional
  } else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

export { db, app };
