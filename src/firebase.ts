
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the database ID from config
const dbId = (firebaseConfig as any).firestoreDatabaseId;
console.log(`[Firebase] Initializing Firestore for database: ${dbId || '(default)'}`);

export const db = getFirestore(app, dbId);

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
