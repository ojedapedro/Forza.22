import admin from 'firebase-admin';
import firebaseConfig from '../../firebase-applet-config.json';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

export const adminDb = admin.firestore();
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  adminDb.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
}
export const adminAuth = admin.auth();

export default admin;
