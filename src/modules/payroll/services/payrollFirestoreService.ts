
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { Employee, PayrollEntry } from '../types';
import { cleanObject } from '../../../services/firestoreService';

export const payrollFirestoreService = {
  // Employees
  getEmployees: async (limitCount?: number, lastDoc?: any): Promise<{ employees: Employee[], lastVisible: any }> => {
    const path = 'employees';
    try {
      let q = query(collection(db, path), orderBy('lastName', 'asc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      return { employees, lastVisible };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { employees: [], lastVisible: null };
    }
  },

  createEmployee: async (employee: Employee) => {
    try {
      await setDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      return { status: 'success' };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  updateEmployee: async (employee: Employee) => {
    try {
      await updateDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      return { status: 'success' };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      return { status: 'success' };
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Payroll
  getPayrollEntries: async (limitCount?: number, lastDoc?: any): Promise<{ entries: PayrollEntry[], lastVisible: any }> => {
    const path = 'payroll';
    try {
      let q = query(collection(db, path), orderBy('submittedDate', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      return { entries, lastVisible };
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      return { entries: [], lastVisible: null };
    }
  },

  createPayrollEntry: async (entry: PayrollEntry) => {
    try {
      await setDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      console.error('Error creating payroll entry:', error);
      throw error;
    }
  },

  updatePayrollEntry: async (entry: PayrollEntry) => {
    try {
      await updateDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      console.error('Error updating payroll entry:', error);
      throw error;
    }
  },

  deletePayrollEntry: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payroll', id));
      return { status: 'success' };
    } catch (error) {
      console.error('Error deleting payroll entry:', error);
      throw error;
    }
  },

  // Storage
  uploadFile: async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
};
