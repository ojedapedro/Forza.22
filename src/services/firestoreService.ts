
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocFromServer,
  limit,
  startAfter
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Payment, SystemSettings, User, BudgetEntry, Employee, PayrollEntry, Store, Invoice, Client, ChatMessage } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to remove undefined values from objects before sending to Firestore
export function cleanObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanObject(item));
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      const cleaned = cleanObject(value);
      if (cleaned !== undefined) {
        newObj[key] = cleaned;
      }
    }
  });
  return newObj;
}

// Global cache to reduce reads. Persistent in localStorage to survive refreshes.
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'fiscalControl_cache_';

// --- OFFLINE MODE TOGGLE ---
// CAMBIE A 'false' PARA VOLVER A CONECTAR LA BASE DE DATOS
export const IS_OFFLINE_MODE = false; 

if (IS_OFFLINE_MODE) {
  console.warn("⚠️ MODO OFFLINE ACTIVADO: La aplicación no está realizando peticiones a Firestore para ahorrar cuota.");
}

function getFromCache(key: string) {
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cachedStr) return null;
    
    const cached = JSON.parse(cachedStr);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    // Expired
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

function setToCache(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

function invalidateCache(key: string) {
  localStorage.removeItem(CACHE_KEY_PREFIX + key);
}

// Test connection
export async function testConnection() {
  if (IS_OFFLINE_MODE) return;
  if (!auth.currentUser) {
    console.log("Firestore connection test skipped: User not authenticated.");
    return;
  }
  
  // Use session cache for test connection to avoid multiple reads per session
  if (getFromCache('test_conn')) return;

  try {
    // We use a path that should be public according to our rules (if deployed)
    const docRef = doc(db, 'settings', 'global');
    // Using default getDoc instead of getDocFromServer to use cache if available
    const docSnap = await getDoc(docRef);
    setToCache('test_conn', true);
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      console.error("Firestore connection test failed: Missing or insufficient permissions. Please ensure that firestore.rules have been deployed to your Firebase project.");
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection test failed: The client is offline.");
    } else {
      console.error("Firestore connection test failed with an unexpected error:", error);
    }
  }
}

export const firestoreService = {
  // Users
  getUsers: async (): Promise<User[]> => {
    if (IS_OFFLINE_MODE) return [];
    const path = 'users';
    const cached = getFromCache(path);
    if (cached) return cached;

    try {
      const snapshot = await getDocs(collection(db, path));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setToCache(path, users);
      return users;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createUser: async (user: User) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), cleanObject(user));
      invalidateCache('users');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateUser: async (user: User) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `users/${user.id}`;
    try {
      await updateDoc(doc(db, 'users', user.id), cleanObject(user));
      invalidateCache('users');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteUser: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
      invalidateCache('users');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Payments
  getPayments: async (limitCount?: number, lastDoc?: any): Promise<{ payments: Payment[], lastVisible: any }> => {
    if (IS_OFFLINE_MODE) return { payments: [], lastVisible: null };
    const path = 'payments';

    // Cache only the first page results for a short time
    if (!lastDoc && !limitCount) {
      const cached = getFromCache(path);
      if (cached) return cached;
    }

    try {
      let q = query(collection(db, path), orderBy('submittedDate', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const result = { payments, lastVisible };

      if (!lastDoc && !limitCount) {
        setToCache(path, result);
      }

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { payments: [], lastVisible: null };
    }
  },

  subscribeToPayments: (callback: (payments: Payment[]) => void, limitCount: number = 50) => {
    if (IS_OFFLINE_MODE) {
      callback([]);
      return () => {};
    }
    const path = 'payments';
    return onSnapshot(query(collection(db, path), orderBy('submittedDate', 'desc'), limit(limitCount)), (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  createPayment: async (payment: Payment) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payments/${payment.id}`;
    try {
      await setDoc(doc(db, 'payments', payment.id), cleanObject(payment));
      invalidateCache('payments');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayment: async (payment: Payment) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payments/${payment.id}`;
    try {
      await updateDoc(doc(db, 'payments', payment.id), cleanObject(payment));
      invalidateCache('payments');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePayment: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payments/${id}`;
    try {
      await deleteDoc(doc(db, 'payments', id));
      invalidateCache('payments');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Employees
  getEmployees: async (limitCount?: number, lastDoc?: any): Promise<{ employees: Employee[], lastVisible: any }> => {
    if (IS_OFFLINE_MODE) return { employees: [], lastVisible: null };
    const path = 'employees';

    if (!lastDoc && !limitCount) {
      const cached = getFromCache(path);
      if (cached) return cached;
    }

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
      const result = { employees, lastVisible };

      if (!lastDoc && !limitCount) {
        setToCache(path, result);
      }

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { employees: [], lastVisible: null };
    }
  },

  createEmployee: async (employee: Employee) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `employees/${employee.id}`;
    try {
      await setDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      invalidateCache('employees');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateEmployee: async (employee: Employee) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `employees/${employee.id}`;
    try {
      await updateDoc(doc(db, 'employees', employee.id), cleanObject(employee));
      invalidateCache('employees');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteEmployee: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `employees/${id}`;
    try {
      await deleteDoc(doc(db, 'employees', id));
      invalidateCache('employees');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Payroll
  getPayrollEntries: async (limitCount?: number, lastDoc?: any): Promise<{ entries: PayrollEntry[], lastVisible: any }> => {
    if (IS_OFFLINE_MODE) return { entries: [], lastVisible: null };
    const path = 'payroll';

    if (!lastDoc && !limitCount) {
      const cached = getFromCache(path);
      if (cached) return cached;
    }

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
      const result = { entries, lastVisible };

      if (!lastDoc && !limitCount) {
        setToCache(path, result);
      }

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { entries: [], lastVisible: null };
    }
  },

  createPayrollEntry: async (entry: PayrollEntry) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payroll/${entry.id}`;
    try {
      await setDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePayrollEntry: async (entry: PayrollEntry) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payroll/${entry.id}`;
    try {
      await updateDoc(doc(db, 'payroll', entry.id), cleanObject(entry));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePayrollEntry: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `payroll/${id}`;
    try {
      await deleteDoc(doc(db, 'payroll', id));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Budgets
  getBudgets: async (): Promise<BudgetEntry[]> => {
    if (IS_OFFLINE_MODE) return [];
    const path = 'budgets';
    const cached = getFromCache(path);
    if (cached) return cached;

    try {
      const budgetsRef = collection(db, 'budgets');
      const annualBudgetsRef = collection(db, 'annual_budgets');
      
      const [budgetsSnap, annualBudgetsSnap] = await Promise.all([
        getDocs(budgetsRef),
        getDocs(annualBudgetsRef)
      ]);
      
      const budgets = budgetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetEntry));
      const annualBudgets = annualBudgetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetEntry));
      
      // Merge and deduplicate by ID
      const allBudgets = [...budgets];
      annualBudgets.forEach(ab => {
        if (!allBudgets.find(b => b.id === ab.id)) {
          allBudgets.push(ab);
        }
      });
      
      setToCache(path, allBudgets);
      return allBudgets;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'budgets');
      return [];
    }
  },

  createBudget: async (budget: BudgetEntry) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `budgets/${budget.id}`;
    try {
      await setDoc(doc(db, 'budgets', budget.id), cleanObject(budget));
      invalidateCache('budgets');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  deleteBudget: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `budgets/${id}`;
    try {
      await deleteDoc(doc(db, 'budgets', id));
      invalidateCache('budgets');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Settings
  getSettings: async (): Promise<SystemSettings | null> => {
    if (IS_OFFLINE_MODE) return null;
    const path = 'settings/global';
    const cached = getFromCache(path);
    if (cached) return cached;

    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SystemSettings;
        setToCache(path, data);
        return data;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  saveSettings: async (settings: SystemSettings) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), cleanObject(settings));
      invalidateCache('settings/global');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  bootstrap: async () => {
    if (IS_OFFLINE_MODE) return;
    try {
      await testConnection();
      const settings = await firestoreService.getSettings();
      if (!settings) {
        const defaultSettings: SystemSettings = {
          whatsappEnabled: false,
          whatsappPhone: '',
          whatsappGatewayUrl: '',
          daysBeforeWarning: 7,
          daysBeforeCritical: 3,
          emailEnabled: false,
          exchangeRate: 1,
          pushEnabled: false,
          notifyPending: true,
          notifyOverdue: true,
          refreshInterval: 30000
        };
        await firestoreService.saveSettings(defaultSettings);
        console.log("System settings bootstrapped successfully.");
      }
    } catch (error) {
      console.error("Error during bootstrap:", error);
    }
  },

  // --- EXCHANGE RATES ---
  getExchangeRateByDate: async (date: string) => {
    if (IS_OFFLINE_MODE) return { success: true, rate: null };
    try {
      const docRef = doc(db, 'exchange_rates', date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, rate: docSnap.data().rate };
      }
      return { success: true, rate: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `exchange_rates/${date}`);
      return { success: false, rate: null };
    }
  },

  saveExchangeRate: async (rate: number, date?: string) => {
    if (IS_OFFLINE_MODE) return { success: true };
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'exchange_rates', targetDate), cleanObject({
        date: targetDate,
        rate: rate
      }));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exchange_rates/${targetDate}`);
      return { success: false };
    }
  },

  // --- STORES ---
  getStores: async (): Promise<Store[]> => {
    if (IS_OFFLINE_MODE) return [];
    const path = 'stores';
    const cached = getFromCache(path);
    if (cached) return cached;

    try {
      const snapshot = await getDocs(collection(db, path));
      const stores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
      setToCache(path, stores);
      return stores;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createStore: async (store: Store) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `stores/${store.id}`;
    try {
      await setDoc(doc(db, 'stores', store.id), cleanObject(store));
      invalidateCache('stores');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateStore: async (store: Store) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `stores/${store.id}`;
    try {
      await updateDoc(doc(db, 'stores', store.id), cleanObject(store));
      invalidateCache('stores');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteStore: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `stores/${id}`;
    try {
      await deleteDoc(doc(db, 'stores', id));
      invalidateCache('stores');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Invoices
  getInvoices: async (limitCount?: number, lastDoc?: any): Promise<{ invoices: Invoice[], lastVisible: any }> => {
    if (IS_OFFLINE_MODE) return { invoices: [], lastVisible: null };
    const path = 'invoices';
    
    // Cache only the first page without lastDoc
    if (!lastDoc && !limitCount) {
      const cached = getFromCache(path);
      if (cached) return cached;
    }

    try {
      let q = query(collection(db, path), orderBy('issueDate', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const result = { invoices, lastVisible };
      
      if (!lastDoc && !limitCount) {
        setToCache(path, result);
      }
      
      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { invoices: [], lastVisible: null };
    }
  },

  createInvoice: async (invoice: Invoice) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `invoices/${invoice.id}`;
    try {
      await setDoc(doc(db, 'invoices', invoice.id), cleanObject(invoice));
      invalidateCache('invoices');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateInvoice: async (invoice: Invoice) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `invoices/${invoice.id}`;
    try {
      await updateDoc(doc(db, 'invoices', invoice.id), cleanObject(invoice));
      invalidateCache('invoices');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteInvoice: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `invoices/${id}`;
    try {
      await deleteDoc(doc(db, 'invoices', id));
      invalidateCache('invoices');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Clients
  getClients: async (): Promise<Client[]> => {
    if (IS_OFFLINE_MODE) return [];
    const path = 'clients';
    const cached = getFromCache(path);
    if (cached) return cached;

    try {
      const snapshot = await getDocs(collection(db, path));
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setToCache(path, clients);
      return clients;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createClient: async (client: Client) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `clients/${client.id}`;
    try {
      await setDoc(doc(db, 'clients', client.id), cleanObject(client));
      invalidateCache('clients');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updateClient: async (client: Client) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `clients/${client.id}`;
    try {
      await updateDoc(doc(db, 'clients', client.id), cleanObject(client));
      invalidateCache('clients');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteClient: async (id: string) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `clients/${id}`;
    try {
      await deleteDoc(doc(db, 'clients', id));
      invalidateCache('clients');
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Storage
  uploadFile: async (file: File, path: string): Promise<string> => {
    if (IS_OFFLINE_MODE) return "https://via.placeholder.com/150";
    return new Promise(async (resolve, reject) => {
      // Timeout de seguridad de 60 segundos
      const timeout = setTimeout(() => {
        const error = new Error("Tiempo de espera agotado al subir el archivo (60s). Verifique su conexión.");
        reject(error);
      }, 60000);

      try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        clearTimeout(timeout);
        resolve(downloadURL);
      } catch (error) {
        clearTimeout(timeout);
        console.error("Error uploading file to Storage:", error);
        try {
          handleFirestoreError(error, OperationType.WRITE, `storage://${path}`);
        } catch (wrappedError) {
          reject(wrappedError);
        }
      }
    });
  },

  // Chat
  getChatMessages: async (room: string = 'global', limitCount: number = 50): Promise<ChatMessage[]> => {
    if (IS_OFFLINE_MODE) return [];
    const path = 'chat_messages';
    try {
      const q = query(
        collection(db, path), 
        where('room', '==', room),
        orderBy('timestamp', 'asc'), 
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createChatMessage: async (message: ChatMessage) => {
    if (IS_OFFLINE_MODE) return { status: 'success' };
    const path = `chat_messages/${message.id}`;
    try {
      await setDoc(doc(db, 'chat_messages', message.id), cleanObject(message));
      return { status: 'success' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToChat: (room: string = 'global', callback: (messages: ChatMessage[]) => void, limitCount: number = 50) => {
    if (IS_OFFLINE_MODE) {
      callback([]);
      return () => {};
    }
    const path = 'chat_messages';
    const q = query(
      collection(db, path), 
      where('room', '==', room),
      orderBy('timestamp', 'desc'), // Changed to desc for efficient limiting
      limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .reverse(); // Reverse back to chronological order for UI
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
