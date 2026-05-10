
import { Role, User } from '../types';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cleanObject } from './firestoreService';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // Force Super Admin role for the bootstrap email
        if (firebaseUser.email === 'analistadedatosnova@gmail.com') {
          if (userData.role !== Role.SUPER_ADMIN || (userData.storeIds && userData.storeIds.length > 0)) {
            const updatedUser = { ...userData, role: Role.SUPER_ADMIN, storeIds: [] };
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(updatedUser));
            return { id: firebaseUser.uid, ...updatedUser } as User;
          }
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // If user exists in Auth but not in Firestore, create a default profile
        const defaultUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email || email,
          role: email === 'analistadedatosnova@gmail.com' ? Role.SUPER_ADMIN : Role.ADMIN,
          avatar: firebaseUser.photoURL || null
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(defaultUser));
        return defaultUser;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Credenciales incorrectas.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con correo/contraseña no está habilitado en Firebase Console.');
      }
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Unauthorized domain. Current origin:', window.location.origin);
        throw new Error('Este dominio no está autorizado en Firebase. Por favor, añada ' + window.location.hostname + ' a los dominios autorizados en la consola de Firebase.');
      }
      throw new Error(error.message || 'Error al iniciar sesión.');
    }
  },

  loginWithGoogle: async (): Promise<User> => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // Force Super Admin role for the bootstrap email
        if (firebaseUser.email === 'analistadedatosnova@gmail.com') {
          if (userData.role !== Role.SUPER_ADMIN || (userData.storeIds && userData.storeIds.length > 0)) {
            const updatedUser = { ...userData, role: Role.SUPER_ADMIN, storeIds: [] };
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(updatedUser));
            return { id: firebaseUser.uid, ...updatedUser } as User;
          }
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        const defaultUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          email: firebaseUser.email || '',
          role: firebaseUser.email === 'analistadedatosnova@gmail.com' ? Role.SUPER_ADMIN : Role.ADMIN,
          avatar: firebaseUser.photoURL || null
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(defaultUser));
        return defaultUser;
      }
    } catch (error: any) {
      console.error('Google Login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con Google no está habilitado en Firebase Console.');
      }
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Unauthorized domain. Current origin:', window.location.origin);
        throw new Error('Este dominio no está autorizado en Firebase. Por favor, añada ' + window.location.hostname + ' a los dominios autorizados en la consola de Firebase.');
      }
      throw new Error(error.message || 'Error al iniciar sesión con Google.');
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  recoverPassword: async (email: string): Promise<string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return `Se ha enviado un correo de recuperación a ${email}`;
    } catch (error: any) {
      console.error('Recovery error:', error);
      return `Se ha enviado un correo de recuperación a ${email}`;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Force Super Admin role for the bootstrap email
          if (firebaseUser.email === 'analistadedatosnova@gmail.com') {
            if (userData.role !== Role.SUPER_ADMIN || (userData.storeIds && userData.storeIds.length > 0)) {
              const updatedUser = { ...userData, role: Role.SUPER_ADMIN, storeIds: [] };
              await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(updatedUser));
              callback({ id: firebaseUser.uid, ...updatedUser } as User);
            } else {
              callback({ id: firebaseUser.uid, ...userData } as User);
            }
          } else {
            callback({ id: firebaseUser.uid, ...userData } as User);
          }
        } else {
          // If user exists in Auth but not in Firestore, create a default profile
          const defaultUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'analistadedatosnova@gmail.com' ? Role.SUPER_ADMIN : Role.ADMIN,
            avatar: firebaseUser.photoURL || null
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), cleanObject(defaultUser));
          callback(defaultUser);
        }
      } else {
        callback(null);
      }
    });
  }
};
