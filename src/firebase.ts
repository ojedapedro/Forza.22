
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the database ID from config
const dbId = (firebaseConfig as any).firestoreDatabaseId;
console.log(`[Firebase] Initializing Firestore for database: ${dbId || '(default)'}`);

// Set log level to avoid spam from transient network errors
setLogLevel('error');

// Force long polling for stability in the proxy environment
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, dbId);

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
