
// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

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
  // Check if all essential Firebase config values are present
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      console.warn(
        'Firebase initialization failed. Firebase features will not be available. ' +
        'Please ensure your Firebase project configuration and environment variables are correct.'
      );
      app = {} as FirebaseApp; // Fallback to mock objects
      db = {} as Firestore;   // Fallback to mock objects
    }
  } else {
    console.warn(
      'Firebase core configuration (apiKey, authDomain, projectId) is incomplete in environment variables. ' +
      'Firebase features will not be available. Please ensure NEXT_PUBLIC_FIREBASE_... variables are correctly set in your deployment environment.'
    );
    app = {} as FirebaseApp; // Fallback to mock objects
    db = {} as Firestore;   // Fallback to mock objects
  }
} else {
  app = getApps()[0];
  // Ensure db is initialized even if app was already initialized (e.g., in HMR scenarios)
  try {
    db = getFirestore(app);
  } catch (error) {
     console.error("Error getting Firestore instance from existing app:", error);
     db = {} as Firestore;
  }
}

export { db, app };
