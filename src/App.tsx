
import React, { useState, useEffect } from 'react';
import { PresidencyDashboard } from './components/PresidencyDashboard';
import { Sidebar } from './components/Sidebar';
import { PaymentForm } from './components/PaymentForm';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { StoreStatus } from './components/StoreStatus';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { Login } from './components/Login'; 
import { UserManagement } from './components/UserManagement';
import { EvaluationModule } from './components/EvaluationModule';
import { PredictiveDashboard } from './components/PredictiveDashboard';
// import { Dashboard } from './components/Dashboard';
import { StoreManagement } from './components/StoreManagement';
import { InvoicingModule } from './components/InvoicingModule';
import { ChatCenter } from './components/ChatCenter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminControlPanel } from './components/AdminControlPanel';
import { Payment, PaymentStatus, Role, AuditLog, User, Category, BudgetEntry, SystemSettings, Store } from './types';
import { X, RefreshCw, Loader2, Users, Menu, Building2, BellRing, DollarSign, Plus, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';
import { deleteField } from 'firebase/firestore';
import { authService } from './services/auth';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService';
import { APP_LOGO_URL } from './constants';
import { sendPushNotification, requestNotificationPermission } from './utils/pushNotifications';
import { ThemeProvider } from './components/ThemeContext';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';
import { calculateNextDueDate } from './utils';
import { getTaxConfig } from './taxConfigurations';
import { processImageToBlob, processFileToBlob } from './utils/imageProcessing';
// import * as pdfjsLib from 'pdfjs-dist';
// const PDF_JS_VERSION = '4.10.38'; // Replace with hardcoded or remove
// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.mjs`;

interface AppProps {
  user?: User | null;
}

function App({ user }: AppProps = {}) {
  // App Version: 2.2.1 - Categoría Fiscal Update
  console.log("App Version: 2.2.1 - Categoría Fiscal Update");
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isAuthReady, setIsAuthReady] = useState(!!user);

  useEffect(() => {
    // If user is provided via props, we don't need a listener here
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setIsAuthReady(true);
    });
    
    return () => unsubscribe();
  }, [user]);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState('admin-control');

  // --- MOBILE & PWA STATE ---
  const [payments, setPayments] = useState<Payment[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('fiscal_exchange_rate');
    return saved ? Number(saved) : 1;
  });
  const [exchangeRateInput, setExchangeRateInput] = useState<number>(() => {
    const saved = localStorage.getItem('fiscal_exchange_rate');
    return saved ? Number(saved) : 1;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    return dismissed !== 'true';
  });
  const [hasShownPaymentAlert, setHasShownPaymentAlert] = useState(false);

  // --- PAGINATION STATE ---
  const PAGE_SIZE = 20;
  const [lastVisiblePayment, setLastVisiblePayment] = useState<any>(null);
  const [hasMorePayments, setHasMorePayments] = useState(true);

  // PWA Push Notification on Open
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const hasShownPwaNotification = sessionStorage.getItem('pwa_notification_shown');

    if (isStandalone && !hasShownPwaNotification) {
      if (Notification.permission === 'granted') {
        sendPushNotification('¡Bienvenido a Forza 22!', {
          body: 'Estás usando la aplicación en modo PWA.',
          icon: APP_LOGO_URL
        });
        sessionStorage.setItem('pwa_notification_shown', 'true');
      } else if (Notification.permission !== 'denied') {
        requestNotificationPermission().then(permission => {
          if (permission === 'granted') {
            sendPushNotification('¡Bienvenido a Forza 22!', {
              body: 'Estás usando la aplicación en modo PWA.',
              icon: APP_LOGO_URL
            });
            sessionStorage.setItem('pwa_notification_shown', 'true');
          }
        });
      }
    }
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir que Chrome en Android muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo después con el botón
      setInstallPrompt(e);
      console.log("PWA: Evento de instalación capturado");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      localStorage.setItem('pwa_banner_dismissed', 'true');
      console.log("PWA: Aplicación instalada");
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check inicial de permisos de notificación
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
          setShowInstallBanner(false);
          localStorage.setItem('pwa_banner_dismissed', 'true');
        } else {
          console.log('Usuario rechazó la instalación');
        }
        setInstallPrompt(null);
      });
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', newState.toString());
      return newState;
    });
  };

  const getInitialView = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN: return 'admin-control';
      case Role.ADMIN: return 'admin-control';
      case Role.AUDITOR: return 'approvals';
      case Role.PRESIDENT: return 'reports';
      default: return 'payments';
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setCurrentView(getInitialView(currentUser.role));
      loadData().catch(err => {
        console.error("Critical error in loadData:", err);
      });
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (payments.length > 0 && settings && !hasShownPaymentAlert && currentUser) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let overdueCount = 0;
      let nearingCount = 0;

      const isGlobalUser = currentUser.role === Role.SUPER_ADMIN || 
                           currentUser.role === Role.PRESIDENT ||
                           currentUser.role === Role.AUDITOR;
      
      const userStoreIds = isGlobalUser ? [] : currentUser.storeIds || [];
      const relevantPayments = isGlobalUser ? payments : payments.filter(p => userStoreIds.includes(p.storeId));

      relevantPayments.forEach(p => {
        if (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE) {
          const dueDate = new Date(p.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            overdueCount++;
          } else if (diffDays <= (settings.daysBeforeWarning || 3)) {
            nearingCount++;
          }
        }
      });

      if (overdueCount > 0 || nearingCount > 0) {
        let msgParts = [];
        if (overdueCount > 0) msgParts.push(`${overdueCount} vencido(s)`);
        if (nearingCount > 0) msgParts.push(`${nearingCount} próximo(s) a vencer`);
        
        setNotification(`⚠️ Atención: Tienes ${msgParts.join(' y ')}.`);
        
        if (pushPermission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration && registration.showNotification) {
              registration.showNotification('Alertas de Pagos', {
                body: `Tienes ${msgParts.join(' y ')}.`,
                icon: APP_LOGO_URL
              });
            }
          }).catch(err => console.error('Error showing push notification:', err));
        }
        
        setHasShownPaymentAlert(true);
      } else if (relevantPayments.length > 0) {
        setHasShownPaymentAlert(true);
      }
    }
  }, [payments, settings, hasShownPaymentAlert, currentUser, pushPermission]);

  // Abrir formulario automáticamente al entrar en Categoría Fiscal
  // Eliminado: El formulario ahora está embebido permanentemente en la vista 'payments'

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleAddBudget = async (budget: BudgetEntry) => {
    setIsLoading(true);
    try {
      await firestoreService.createBudget(budget);
      setBudgets(prev => [...prev, budget]);
      setNotification('✅ Presupuesto cargado');
    } catch (error) {
      setNotification('❌ Error guardando presupuesto');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    setIsLoading(true);
    try {
      await firestoreService.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
      setNotification('🗑️ Presupuesto eliminado');
    } catch (error) {
      setNotification('❌ Error eliminando presupuesto');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddStore = async (store: Store) => {
    setIsLoading(true);
    try {
      await firestoreService.createStore(store);
      setStores(prev => [...prev, store]);
      setNotification('✅ Tienda creada exitosamente');
    } catch (error) {
      setNotification('❌ Error guardando tienda');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUpdateStore = async (store: Store) => {
    setIsLoading(true);
    try {
      await firestoreService.updateStore(store);
      setStores(prev => prev.map(s => s.id === store.id ? store : s));
      setNotification('✅ Tienda actualizada');
    } catch (error) {
      setNotification('❌ Error actualizando tienda');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteStore = async (id: string) => {
    setIsLoading(true);
    try {
      await firestoreService.deleteStore(id);
      setStores(prev => prev.filter(s => s.id !== id));
      setNotification('🗑️ Tienda eliminada');
    } catch (error) {
      setNotification('❌ Error eliminando tienda');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPayments([]);
  };

  const loadData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Check if we already have data to avoid redundant reloads during navigation
    const hasData = payments.length > 0 && budgets.length > 0;
    const lastLoadTime = sessionStorage.getItem('last_data_load');
    const now = Date.now();
    
    // Only fetch if no data or data is older than 2 minutes
    if (hasData && lastLoadTime && (now - parseInt(lastLoadTime)) < 120000) {
      console.log("Using fresh local data, skipping Firestore fetch");
      setIsLoading(false);
      return;
    }

    try {
      // Only bootstrap ONCE per session
      if (!sessionStorage.getItem('app_bootstrapped')) {
        await firestoreService.bootstrap();
        sessionStorage.setItem('app_bootstrapped', 'true');
      }

      console.log("Loading data for user:", currentUser?.email, "with role:", currentUser?.role);
      const canManageUsers = currentUser.role === Role.SUPER_ADMIN || 
                            currentUser.role === Role.ADMIN || 
                            currentUser.role === Role.AUDITOR ||
                            currentUser.role === Role.PRESIDENT;
      
      const isGlobalUser = currentUser.role === Role.SUPER_ADMIN || 
                           currentUser.role === Role.PRESIDENT ||
                           currentUser.role === Role.AUDITOR;

      const [paymentsRes, budgetsData, settingsData, usersData, storesData] = await Promise.all([
        firestoreService.getPayments(PAGE_SIZE),
        firestoreService.getBudgets(),
        firestoreService.getSettings(),
        canManageUsers ? firestoreService.getUsers() : Promise.resolve([]),
        firestoreService.getStores()
      ]);

      console.log("Payments fetched:", paymentsRes.payments.length);
      console.log("Budgets fetched:", budgetsData.length);
      console.log("Stores fetched:", storesData.length);
      console.log("Users fetched:", usersData.length);
      console.log("Settings fetched:", !!settingsData);

      setPayments(paymentsRes.payments);
      setLastVisiblePayment(paymentsRes.lastVisible);
      setHasMorePayments(paymentsRes.payments.length === PAGE_SIZE);

      setBudgets(budgetsData);
      setSettings(settingsData);
      setUsers(usersData);
      if (storesData) {
        setStores(storesData);
      }

      if (settingsData && settingsData.exchangeRate) {
        setExchangeRate(settingsData.exchangeRate);
        setExchangeRateInput(settingsData.exchangeRate);
        localStorage.setItem('fiscal_exchange_rate', settingsData.exchangeRate.toString());
      }
      
      sessionStorage.setItem('last_data_load', Date.now().toString());
    } catch (error: any) {
      console.error('Error loading data:', error);
      let errorMsg = '❌ Error conectando con Firestore';
      
      try {
        const message = error.message || "";
        if (message.startsWith('{"error":')) {
          const firestoreInfo = JSON.parse(message);
          const isOffline = firestoreInfo.error.includes('the client is offline');
          if (isOffline) {
            errorMsg = `❌ Error: El cliente está offline. Verifique que la base de datos "${firestoreInfo.path?.includes('forza22bd') ? 'forza22bd' : 'seleccionada'}" exista y sea accesible.`;
          } else {
            errorMsg = `❌ Error Firestore (${firestoreInfo.operationType}) en ${firestoreInfo.path || 'desconocido'}: ${firestoreInfo.error}`;
          }
        } else if (message.includes('permission-denied')) {
          errorMsg = '❌ Error de permisos en Firestore. Verifique las reglas de seguridad.';
        } else if (message.includes('the client is offline')) {
           errorMsg = '❌ Error: El cliente está offline. Esto puede deberse a un ID de base de datos incorrecto.';
        }
      } catch (e) {
        // Not a JSON error
      }
      
      setNotification(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePayments = async () => {
    if (!hasMorePayments || isLoading) return;
    setIsLoading(true);
    try {
      const res = await firestoreService.getPayments(PAGE_SIZE, lastVisiblePayment);
      setPayments(prev => [...prev, ...res.payments]);
      setLastVisiblePayment(res.lastVisible);
      setHasMorePayments(res.payments.length === PAGE_SIZE);
    } catch (error) {
      setNotification('❌ Error cargando más pagos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupDatabase = () => {
    setNotification('✅ Base de datos configurada (Firebase)');
  };

  const requestPermission = () => {
    requestNotificationPermission().then(permission => {
      setPushPermission(permission);
      if (permission === 'granted') {
        sendPushNotification("¡Notificaciones Activadas!", {
          body: "Ahora recibirás alertas importantes de Forza 22.",
          icon: APP_LOGO_URL
        });
      }
    });
  };

  const handleNewPayment = async (paymentData: any) => {
    setIsLoading(true);
    console.log("🚀 Iniciando proceso de guardado de pago...", paymentData.id ? "(Actualización)" : "(Nuevo)");
    
    try {
        const isUpdate = !!paymentData.id;
        const originalPayment = isUpdate ? payments.find(p => p.id === paymentData.id) : null;
        
        const log: AuditLog = {
          date: new Date().toISOString(),
          action: isUpdate ? 'CORRECCION' : 'CREACION',
          actorName: currentUser?.name || 'Usuario', 
          role: currentUser?.role || Role.ADMIN,
          note: isUpdate ? 'Pago corregido tras devolución' : undefined
        };

        let attachments: string[] = paymentData.attachments || [];
        
        const paymentId = paymentData.id || `PAG-${Math.floor(Math.random() * 10000)}`;

        if (paymentData.files && paymentData.files.length > 0) {
            console.log(`📂 Subiendo ${paymentData.files.length} archivos a Storage...`);
            const uploadPromises = paymentData.files.map(async (file: File, idx: number) => {
                try {
                    console.log(`Procesando y subiendo archivo ${idx + 1}: ${file.name}...`);
                    const processedBlob = await processFileToBlob(file);
                    const path = `payments/${paymentId}/${Date.now()}_${file.name}`;
                    // Enviar como File si es File, o como Blob (uploadFile maneja ambos)
                    return await firestoreService.uploadFile(processedBlob as File, path);
                } catch (e: any) {
                    console.error(`❌ Error uploading file ${idx + 1}:`, e);
                    throw new Error(`Error en archivo ${file.name}: ${e.message}`);
                }
            });
            const newAttachmentUrls = await Promise.all(uploadPromises);
            attachments = [...attachments, ...newAttachmentUrls];
            console.log("✅ Archivos subidos exitosamente.");
        }

        // Determine status based on attachments
        const newStatus = (attachments.length > 0) ? PaymentStatus.UPLOADED : PaymentStatus.PENDING;
        
        // If it's a correction or a new submission with attachments, we update the submission date
        // to start the auditor's review timer.
        const shouldUpdateSubmittedDate = !isUpdate || 
            (isUpdate && originalPayment?.status === PaymentStatus.REJECTED) || 
            (isUpdate && originalPayment?.status === PaymentStatus.PENDING && newStatus === PaymentStatus.UPLOADED);

        // Create the payment object - Whitelist approach to avoid polluting with large state objects
        const paymentLocal: Payment = {
          ...(originalPayment || {}),
          id: paymentId,
          storeId: paymentData.storeId,
          category: paymentData.category,
          amount: paymentData.amount,
          dueDate: paymentData.dueDate,
          paymentDate: paymentData.paymentDate,
          daysToExpire: paymentData.daysToExpire,
          frequency: paymentData.frequency,
          specificType: paymentData.specificType,
          notes: paymentData.notes,
          originalBudget: paymentData.originalBudget,
          isOverBudget: paymentData.isOverBudget,
          documentDate: paymentData.documentDate,
          documentAmount: paymentData.documentAmount,
          documentName: paymentData.documentName,
          proposedAmount: paymentData.proposedAmount,
          proposedPaymentDate: paymentData.proposedPaymentDate,
          proposedDueDate: paymentData.proposedDueDate,
          proposedDaysToExpire: paymentData.proposedDaysToExpire,
          proposedFrequency: paymentData.proposedFrequency,
          proposedStatus: paymentData.proposedStatus,
          proposedJustification: paymentData.proposedJustification,
          dueDateRate: paymentData.dueDateRate,
          dueDateAmountBs: paymentData.dueDateAmountBs,
          storeName: stores.find(s => s.id === paymentData.storeId)?.name || originalPayment?.storeName || 'Tienda Desconocida',
          userId: currentUser?.id || originalPayment?.userId || 'U-UNK',
          status: newStatus,
          rejectionReason: isUpdate && originalPayment?.status === PaymentStatus.REJECTED ? '' : (originalPayment?.rejectionReason || ''),
          submittedDate: shouldUpdateSubmittedDate ? new Date().toISOString() : (originalPayment?.submittedDate || new Date().toISOString()),
          history: isUpdate 
            ? [...(originalPayment?.history || []), log].slice(-50)
            : [log],
          attachments: attachments,
          // Mantener legacy fields por compatibilidad
          receiptUrl: attachments[0] || undefined,
          receiptUrl2: attachments[1] || undefined,
        };

        const forbiddenKeys = ['file', 'file2', 'files', 'previewUrls', 'blob', 'dataUrl'];
        forbiddenKeys.forEach(key => {
          if ((paymentLocal as any)[key]) delete (paymentLocal as any)[key];
        });

        const paymentToSave: any = {
           ...paymentLocal,
           proposedAmount: paymentLocal.proposedAmount !== undefined ? paymentLocal.proposedAmount : deleteField(),
           proposedPaymentDate: paymentLocal.proposedPaymentDate !== undefined ? paymentLocal.proposedPaymentDate : deleteField(),
           proposedDueDate: paymentLocal.proposedDueDate !== undefined ? paymentLocal.proposedDueDate : deleteField(),
           proposedDaysToExpire: paymentLocal.proposedDaysToExpire !== undefined ? paymentLocal.proposedDaysToExpire : deleteField(),
           proposedFrequency: paymentLocal.proposedFrequency !== undefined ? paymentLocal.proposedFrequency : deleteField(),
           proposedStatus: paymentLocal.proposedStatus !== undefined ? paymentLocal.proposedStatus : deleteField(),
           proposedJustification: paymentLocal.proposedJustification !== undefined ? paymentLocal.proposedJustification : deleteField(),
        };

        console.log("💾 Guardando pago en Firestore...");
        if (isUpdate) {
            await firestoreService.updatePayment(paymentToSave);
            setPayments(prev => prev.map(p => p.id === paymentLocal.id ? paymentLocal : p));
            setNotification('✅ Pago corregido y enviado a revisión.');
        } else {
            await firestoreService.createPayment(paymentLocal);
            setPayments(prev => [paymentLocal, ...prev]);
            setNotification('✅ Pago guardado con éxito.');
            
            // Background notification
            notificationService.notifyNewPayment(paymentLocal, users, settings);
        }

        // --- INTEGRACIÓN CON PLANIFICACIÓN ANUAL (PRESUPUESTO) ---
        // Se registra la propuesta o el pago proyectado en el presupuesto para visualización en calendario
        const proposalBudgetId = `BUD-PROP-${paymentLocal.id}`;
        const isProposal = paymentLocal.proposedAmount !== undefined || paymentLocal.proposedDueDate;
        
        const budgetEntry: BudgetEntry = {
            id: proposalBudgetId,
            storeId: paymentLocal.storeId,
            date: paymentLocal.proposedDueDate || paymentLocal.dueDate,
            title: `${isProposal ? '[PROPUESTA] ' : '[PROGRAMADO] '}${paymentLocal.specificType}`,
            amount: paymentLocal.proposedAmount ?? paymentLocal.amount,
            category: paymentLocal.category,
            notes: `Registro de: ${paymentLocal.storeName}. Justificación: ${paymentLocal.proposedJustification || 'Sincronización automática'}`
        };
        
        try {
            await firestoreService.createBudget(budgetEntry);
            setBudgets(prev => {
                const filtered = prev.filter(b => b.id !== proposalBudgetId);
                return [...filtered, budgetEntry];
            });
            console.log("📊 Pago/Propuesta sincronizada con Planificación Anual");
        } catch (budgetErr) {
            console.error("Error sincronizando con presupuesto:", budgetErr);
        }

        console.log("✨ Proceso completado exitosamente.");
    } catch (error) {
        console.error('❌ Error en handleNewPayment:', error);
        setNotification(`❌ Error guardando el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        throw error; 
    } finally {
        setIsLoading(false);
        setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleApprove = async (id: string, newDueDate?: string, newBudgetAmount?: number, checklist?: Payment['checklist']) => {
      setIsLoading(true);
      const paymentToUpdate = payments.find(p => p.id === id);
      if (paymentToUpdate) {
        let actionNote = undefined;
        let actionType: 'APROBACION' | 'ACTUALIZACION' = 'APROBACION';
        const notes = [];

        let newDaysToExpire = paymentToUpdate.daysToExpire;

        let finalDueDate = newDueDate || paymentToUpdate.dueDate;
        let finalAmount = newBudgetAmount !== undefined ? newBudgetAmount : paymentToUpdate.amount;
        let finalPaymentDate = paymentToUpdate.paymentDate;

        // Apply proposed changes automatically if present
        if (paymentToUpdate.proposedDueDate) {
             finalDueDate = paymentToUpdate.proposedDueDate;
             notes.push(`Fe. Venc: ${paymentToUpdate.dueDate} ➔ Propuesta: ${finalDueDate}`);
        }
        if (paymentToUpdate.proposedPaymentDate) {
             finalPaymentDate = paymentToUpdate.proposedPaymentDate;
             notes.push(`Fe. Pago: ${paymentToUpdate.paymentDate || 'N/A'} ➔ Propuesta: ${finalPaymentDate}`);
        }
        if (paymentToUpdate.proposedAmount !== undefined) {
             finalAmount = paymentToUpdate.proposedAmount;
             notes.push(`Monto: ${paymentToUpdate.amount} ➔ Propuesta: ${finalAmount}`);
        }
        
        let finalFrequency = paymentToUpdate.frequency;
        if (paymentToUpdate.proposedFrequency) {
            finalFrequency = paymentToUpdate.proposedFrequency;
            if (paymentToUpdate.proposedFrequency !== paymentToUpdate.frequency) {
                notes.push(`Frecuencia: ${paymentToUpdate.frequency} ➔ Propuesta: ${finalFrequency}`);
            }
        }
        
        if (paymentToUpdate.proposedDaysToExpire !== undefined) {
            newDaysToExpire = paymentToUpdate.proposedDaysToExpire;
        }

        if (finalDueDate && finalDueDate !== paymentToUpdate.dueDate && !paymentToUpdate.proposedDueDate) {
            notes.push(`Fecha Vencimiento: ${paymentToUpdate.dueDate} ➔ ${finalDueDate}`);
        }

        // Recalcular daysToExpire si cambiaron las fechas
        if (finalPaymentDate && finalDueDate) {
            const d1 = new Date(finalPaymentDate);
            const d2 = new Date(finalDueDate);
            const diffTime = d2.getTime() - d1.getTime();
            newDaysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (newDaysToExpire !== paymentToUpdate.daysToExpire) {
                notes.push(`Días a Vencer: ${paymentToUpdate.daysToExpire || 0} ➔ ${newDaysToExpire}`);
            }
        }

        if (newBudgetAmount !== undefined && newBudgetAmount !== paymentToUpdate.amount && paymentToUpdate.proposedAmount === undefined) {
            notes.push(`Monto: ${paymentToUpdate.amount || 'N/A'} ➔ ${newBudgetAmount}`);
        }

        if (notes.length > 0) {
            actionNote = notes.join(' | ');
        }

        const log: AuditLog = {
            date: new Date().toISOString(),
            action: actionType,
            actorName: currentUser?.name || 'Auditor',
            role: currentUser?.role || Role.AUDITOR,
            note: actionNote
        };

        const updatedPaymentLocal: Payment = {
            ...paymentToUpdate,
            status: PaymentStatus.APPROVED,
            dueDate: finalDueDate,
            paymentDate: finalPaymentDate,
            daysToExpire: newDaysToExpire,
            frequency: finalFrequency,
            amount: finalAmount,
            history: paymentToUpdate.history ? [...paymentToUpdate.history, log] : [log],
            checklist: checklist || paymentToUpdate.checklist,
        };

        // Explicitly clear proposed from local state
        delete updatedPaymentLocal.proposedDueDate;
        delete updatedPaymentLocal.proposedPaymentDate;
        delete updatedPaymentLocal.proposedAmount;
        delete updatedPaymentLocal.proposedDaysToExpire;
        delete updatedPaymentLocal.proposedStatus;
        delete updatedPaymentLocal.proposedFrequency;
        delete updatedPaymentLocal.proposedJustification;
        delete updatedPaymentLocal.previousDueDate;
        delete updatedPaymentLocal.previousPaymentDate;
        delete updatedPaymentLocal.previousAmount;

        const payloadForFirestore: Payment = {
            ...updatedPaymentLocal,
            proposedDueDate: deleteField() as any,
            proposedPaymentDate: deleteField() as any,
            proposedAmount: deleteField() as any,
            proposedDaysToExpire: deleteField() as any,
            proposedStatus: deleteField() as any,
            proposedFrequency: deleteField() as any,
            proposedJustification: deleteField() as any,
            previousDueDate: deleteField() as any,
            previousPaymentDate: deleteField() as any,
            previousAmount: deleteField() as any,
        };

        if (updatedPaymentLocal.originalBudget !== undefined) {
            updatedPaymentLocal.isOverBudget = updatedPaymentLocal.amount > updatedPaymentLocal.originalBudget;
            payloadForFirestore.isOverBudget = updatedPaymentLocal.isOverBudget;
        }

        try {
            await firestoreService.updatePayment(payloadForFirestore);
            setPayments(prev => prev.map(p => p.id === id ? updatedPaymentLocal : p));
            setNotification(`Pago ${id} Aprobado y Sincronizado`);

            // --- SINCRONIZACIÓN CON PRESUPUESTO AL APROBAR ---
            // El pago aprobado ahora se convierte en una entrada definitiva en la planificación anual
            const proposalBudgetId = `BUD-PROP-${id}`;
            const finalBudgetId = `BUD-APR-${id}`;
            
            const finalBudgetEntry: BudgetEntry = {
                id: finalBudgetId, 
                storeId: updatedPaymentLocal.storeId,
                date: updatedPaymentLocal.dueDate,
                title: `[APROBADO] ${updatedPaymentLocal.specificType}`,
                amount: updatedPaymentLocal.amount,
                category: updatedPaymentLocal.category,
                notes: `Aprobado por auditor. Ref: ${id}. Rubro: ${updatedPaymentLocal.category}`
            };
            
            try {
                await firestoreService.createBudget(finalBudgetEntry);
                // Si existía una propuesta, la eliminamos para evitar duplicidad
                await firestoreService.deleteBudget(proposalBudgetId);
                
                setBudgets(prev => [
                    ...prev.filter(b => b.id !== proposalBudgetId && b.id !== finalBudgetId),
                    finalBudgetEntry
                ]);
                console.log("✅ Presupuesto actualizado tras aprobación");
            } catch (budgetErr) {
                console.error("Error actualizando presupuesto tras aprobación:", budgetErr);
            }

            // Notificar al creador del pago
            notificationService.notifyPaymentApproved(updatedPaymentLocal, users, settings);
        } catch (error) {
            console.error('Error en handleApprove:', error);
            setNotification('❌ Error sincronizando aprobación.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
      }
  };

  const handleUpdatePayment = async (updatedPayment: Payment) => {
    try {
      await firestoreService.updatePayment(updatedPayment);
      setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    } catch (error) {
      console.error('Error updating payment:', error);
      setNotification('Error al actualizar el pago');
    }
  };

  const handleApproveAll = async () => {
      setIsLoading(true);
      const pendingPayments = filteredPayments.filter(p => 
          p.status === PaymentStatus.PENDING || 
          p.status === PaymentStatus.UPLOADED || 
          p.status === PaymentStatus.OVERDUE
      );
      
      if (pendingPayments.length === 0) {
          setIsLoading(false);
          setNotification('No hay pagos pendientes para aprobar.');
          setTimeout(() => setNotification(null), 3000);
          return;
      }

      const log: AuditLog = {
          date: new Date().toISOString(),
          action: 'APROBACION_MASIVA',
          actorName: currentUser?.name || 'Auditor',
          role: currentUser?.role || Role.AUDITOR,
          note: `Aprobación masiva de ${pendingPayments.length} pagos`
      };

      const localUpdatedPayments = pendingPayments.map(p => {
          let updatedP = {
              ...p,
              status: PaymentStatus.APPROVED,
              history: p.history ? [...p.history, log] : [log]
          };

          if (p.proposedDueDate) {
              updatedP.dueDate = p.proposedDueDate;
          }
          if (p.proposedPaymentDate) {
              updatedP.paymentDate = p.proposedPaymentDate;
          }
          if (p.proposedAmount !== undefined) {
              updatedP.amount = p.proposedAmount;
          }
          if (p.proposedFrequency) {
              updatedP.frequency = p.proposedFrequency;
          }
          if (p.proposedDaysToExpire !== undefined) {
              updatedP.daysToExpire = p.proposedDaysToExpire;
          }

          if (updatedP.paymentDate && updatedP.dueDate && p.proposedDaysToExpire === undefined) {
              const d1 = new Date(updatedP.paymentDate);
              const d2 = new Date(updatedP.dueDate);
              const diffTime = d2.getTime() - d1.getTime();
              updatedP.daysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          // Clear proposals for local state
          delete updatedP.proposedDueDate;
          delete updatedP.proposedPaymentDate;
          delete updatedP.proposedAmount;
          delete updatedP.proposedDaysToExpire;
          delete updatedP.proposedStatus;
          delete updatedP.proposedFrequency;
          delete updatedP.proposedJustification;
          delete updatedP.previousDueDate;
          delete updatedP.previousPaymentDate;
          delete updatedP.previousAmount;

          return updatedP;
      });

      try {
          for (const localP of localUpdatedPayments) {
              const pPayload: any = {
                  ...localP,
                  proposedDueDate: deleteField(),
                  proposedPaymentDate: deleteField(),
                  proposedAmount: deleteField(),
                  proposedDaysToExpire: deleteField(),
                  proposedStatus: deleteField(),
                  proposedFrequency: deleteField(),
                  proposedJustification: deleteField(),
                  previousDueDate: deleteField(),
                  previousPaymentDate: deleteField(),
                  previousAmount: deleteField(),
              };
              await firestoreService.updatePayment(pPayload);
          }
          setPayments(prev => prev.map(p => {
              const updated = localUpdatedPayments.find(up => up.id === p.id);
              return updated ? updated : p;
          }));
          setNotification(`✅ ${pendingPayments.length} pagos aprobados.`);
      } catch (error) {
          setNotification('❌ Error en aprobación masiva.');
      } finally {
          setIsLoading(false);
          setTimeout(() => setNotification(null), 3000);
      }
  };

  const handleReject = async (id: string, reason: string, newDueDate?: string, newBudgetAmount?: number, checklist?: Payment['checklist']) => {
      setIsLoading(true);
      const paymentToUpdate = payments.find(p => p.id === id);
      
      if (paymentToUpdate) {
          let newDaysToExpire = paymentToUpdate.daysToExpire;
          let rejectionNote = reason;

          if (newDueDate && newDueDate !== paymentToUpdate.dueDate) {
              rejectionNote += ` | Sugerencia Vencimiento: ${newDueDate}`;
              if (paymentToUpdate.paymentDate) {
                  const d1 = new Date(paymentToUpdate.paymentDate);
                  const d2 = new Date(newDueDate);
                  const diffTime = d2.getTime() - d1.getTime();
                  newDaysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
          }

          if (newBudgetAmount !== undefined && newBudgetAmount !== paymentToUpdate.originalBudget) {
              rejectionNote += ` | Sugerencia Presupuesto: $${newBudgetAmount.toLocaleString()}`;
          }

          const log: AuditLog = {
            date: new Date().toISOString(),
            action: 'RECHAZO',
            actorName: currentUser?.name || 'Auditor',
            role: currentUser?.role || Role.AUDITOR,
            note: rejectionNote
          };

          const updatedPayment: Payment = {
            ...paymentToUpdate,
            status: PaymentStatus.REJECTED,
            rejectionReason: reason,
            dueDate: newDueDate || paymentToUpdate.dueDate,
            daysToExpire: newDaysToExpire,
            originalBudget: newBudgetAmount !== undefined ? newBudgetAmount : paymentToUpdate.originalBudget,
            history: paymentToUpdate.history ? [...paymentToUpdate.history, log] : [log],
            checklist: checklist || paymentToUpdate.checklist
          };

          try {
            await firestoreService.updatePayment(updatedPayment);
            setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
            setNotification(`Pago ${id} Rechazado y Sincronizado`);

            // --- ELIMINAR PROPUESTA DEL PRESUPUESTO SI SE RECHAZA ---
            const proposalBudgetId = `BUD-PROP-${id}`;
            if (budgets.find(b => b.id === proposalBudgetId)) {
                await firestoreService.deleteBudget(proposalBudgetId);
                setBudgets(prev => prev.filter(b => b.id !== proposalBudgetId));
            }

            // Notificar al creador del pago
            notificationService.notifyPaymentRejected(updatedPayment, reason, users, settings);

            // Enviar Notificación Push
            if (pushPermission === 'granted' && 'serviceWorker' in navigator) {
              const title = `⚠️ Pago Devuelto para Corrección`;
              const options = {
                body: `El pago ${id} (${paymentToUpdate.storeName}) fue devuelto por el auditor. Razón: ${reason}`,
                icon: '/icons/icon-192x192.png', // Asegúrate que este ícono exista en /public
                badge: '/icons/badge.png',
                vibrate: [200, 100, 200],
                tag: `payment-rejected-${id}`,
              };
              navigator.serviceWorker.ready.then(registration => {
                if (registration && registration.showNotification) {
                  registration.showNotification(title, options);
                }
              }).catch(err => console.error('Error showing push notification:', err));
            }

          } catch (error) {
             console.error('Error en handleReject:', error);
             setNotification('❌ Error sincronizando rechazo.');
          } finally {
             setIsLoading(false);
             setTimeout(() => setNotification(null), 3000);
          }
      }
  };

  const handleManageNotification = (paymentId: string) => {
    if (currentUser?.role === Role.AUDITOR || currentUser?.role === Role.SUPER_ADMIN) {
      setCurrentView('approvals');
    } else {
      setCurrentView('payments');
    }
    setNotification(`Gestionando pago ${paymentId}...`);
    setTimeout(() => setNotification(null), 2000);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setIsLoading(true);
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        const updatedPayment = { ...payment, status: PaymentStatus.PAID };
        await firestoreService.updatePayment(updatedPayment);
        
        // Generate next payment if it has a frequency
        if (payment.frequency && payment.frequency !== 'Único') {
          const nextDueDate = calculateNextDueDate(payment.dueDate, payment.frequency);
          const nextPayment: Payment = {
            ...payment,
            id: `PAY-${Math.random().toString(36).substr(2, 9)}`,
            dueDate: nextDueDate,
            status: PaymentStatus.PENDING,
            paymentDate: undefined,
            receiptUrl: undefined,
            notes: '',
            rejectionReason: undefined,
            submittedDate: new Date().toISOString(),
            history: [{
              date: new Date().toISOString(),
              action: 'CREACION',
              actorName: 'Sistema (Renovación Automática)',
              role: Role.SUPER_ADMIN,
              note: `Generado automáticamente a partir del pago ${payment.id}`
            }]
          };
          await firestoreService.createPayment(nextPayment);
          setPayments(prev => [...prev.map(p => p.id === paymentId ? updatedPayment : p), nextPayment]);
        } else {
          setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
        }
        
        setNotification('✅ Pago procesado exitosamente');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setNotification('❌ Error al actualizar el estado del pago');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Filter data based on user's assigned stores
  const isGlobalUser = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
  const userStoreIds = isGlobalUser ? [] : currentUser?.storeIds || [];
  
  const filteredPayments = payments.filter(p => {
    // Filter by store
    if (userStoreIds.length > 0 && !userStoreIds.includes(p.storeId)) return false;
    
    // Filter by fiscal permissions if not a global user
    if (!isGlobalUser) {
      const hasAllowedCategories = currentUser?.allowedCategories && currentUser.allowedCategories.length > 0;
      const hasAllowedTaxGroups = currentUser?.allowedTaxGroups && currentUser.allowedTaxGroups.length > 0;
      const hasAllowedTaxItems = currentUser?.allowedTaxItems && currentUser.allowedTaxItems.length > 0;

      if (hasAllowedCategories && !currentUser.allowedCategories.includes(p.category)) return false;
      
      const itemCode = p.specificType.split(' - ')[0];

      if (hasAllowedTaxGroups) {
        const config = getTaxConfig(p.category);
        if (config) {
          const groupKey = Object.entries(config).find(([_, group]) => 
            group.items.some(item => item.code === itemCode)
          )?.[0];
          
          if (groupKey && !currentUser.allowedTaxGroups.includes(groupKey)) return false;
        }
      }
      
      if (hasAllowedTaxItems) {
        if (!currentUser.allowedTaxItems.includes(itemCode)) return false;
      }
    }
    
    return true;
  });
  const filteredBudgets = budgets.filter(b => {
    if (userStoreIds.length > 0 && !userStoreIds.includes(b.storeId)) return false;
    return true;
  });
  const filteredStores = userStoreIds.length > 0 ? stores.filter(s => userStoreIds.includes(s.id)) : stores;

  const renderContent = () => {
    if (!isAuthenticated) return null;

    if (isLoading && payments.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p>Conectando con Servidor Fiscal...</p>
            </div>
        );
    }

    switch (currentView) {
      case 'admin-control':
        return (
          <AdminControlPanel
            payments={filteredPayments}
            users={users}
            stores={filteredStores}
            budgets={filteredBudgets}
            currentUser={currentUser}
            onNavigate={setCurrentView}
          />
        );
      case 'dashboard':
        return (
          <div className="p-8 text-center text-slate-500">
            Error: Módulo deshabilitado. Redirigiendo a Panel de Control...
            {setTimeout(() => setCurrentView('admin-control'), 500) && ''}
          </div>
        );
      case 'payments':
        const rejectedPayments = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED);
        return (
          <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
            {rejectedPayments.length > 0 && (
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border-b border-pink-100 dark:border-pink-900/30">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-pink-900 dark:text-pink-100">Pagos Devueltos ({rejectedPayments.length})</h3>
                      <p className="text-xs text-pink-700 dark:text-pink-300">Tienes pagos que requieren corrección según el auditor.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowRejectedModal(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    Ver y Corregir
                  </button>
                </div>
              </div>
            )}
            
            <PaymentForm 
              initialData={editingPayment}
              payments={filteredPayments}
              onSubmit={handleNewPayment} 
              onCancel={() => {
                setEditingPayment(null);
                setIsFormOpen(false);
              }} 
              isEmbedded={true}
              currentUser={currentUser}
              stores={filteredStores}
              budgets={filteredBudgets}
            />
            
            {/* Modal for Rejected Payments */}
            {showRejectedModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full max-w-[95vw] xl:max-w-[1600px] max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Corrección de Pagos Devueltos</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un pago para editar y reenviar al auditor.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowRejectedModal(false);
                        setEditingPayment(null);
                      }}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {editingPayment && editingPayment.status === PaymentStatus.REJECTED ? (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setEditingPayment(null)}
                          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mb-4"
                        >
                          <ChevronLeft size={16} />
                          Volver a la lista
                        </button>
                        <PaymentForm 
                          initialData={editingPayment}
                          payments={filteredPayments}
                          onSubmit={async (data) => {
                            await handleNewPayment(data);
                            // Eliminamos el setEditingPayment(null) inmediato para dejar que 
                            // PaymentForm muestre su mensaje de éxito y se cierre solo
                            
                            // Si era el último pago rechazado, cerramos el modal después de un delay
                            if (rejectedPayments.length <= 1) {
                              setTimeout(() => setShowRejectedModal(false), 3000);
                            }
                          }}
                          onCancel={() => setEditingPayment(null)}
                          isEmbedded={true}
                          currentUser={currentUser}
                          stores={filteredStores}
                          budgets={filteredBudgets}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rejectedPayments.map(payment => (
                          <div 
                            key={payment.id}
                            onClick={() => setEditingPayment(payment)}
                            className="p-4 bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 rounded-2xl hover:border-pink-500 dark:hover:border-pink-500 cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{payment.category}</span>
                              <span className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Devuelto</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-pink-600 transition-colors">{payment.specificType}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{payment.storeName} • {payment.dueDate}</p>
                            
                            <div className="p-2 bg-pink-50 dark:bg-pink-900/10 rounded-lg border border-pink-100 dark:border-pink-900/20 mb-3">
                              <p className="text-[10px] text-pink-700 dark:text-pink-300 italic">
                                <span className="font-bold">Motivo:</span> {payment.rejectionReason || 'No especificado'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <span className="font-bold text-slate-900 dark:text-white">${(payment.amount || 0).toLocaleString()}</span>
                              <div className="flex items-center gap-1 text-pink-600 font-bold text-xs">
                                Corregir <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'approvals':
        return (
          <Approvals 
            payments={filteredPayments} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            onUpdatePayment={handleUpdatePayment}
            currentUser={currentUser} 
            onApproveAll={handleApproveAll}
            onLoadMore={loadMorePayments}
            hasMore={hasMorePayments}
          />
        );
      case 'reports':
        return <Reports payments={filteredPayments} currentUser={currentUser} budgets={filteredBudgets} stores={filteredStores} />;
      case 'presidency':
        return <PresidencyDashboard payments={filteredPayments} budgets={filteredBudgets} currentUser={currentUser} onApproveAll={handleApproveAll} stores={filteredStores} />;
      case 'network':
        return <StoreStatus payments={filteredPayments} budgets={filteredBudgets} userStoreIds={userStoreIds} stores={filteredStores} />;
      case 'calendar':
        return <CalendarView 
          payments={filteredPayments} 
          budgets={filteredBudgets} 
          onAddBudget={handleAddBudget} 
          onDeleteBudget={handleDeleteBudget} 
          onUpdatePayment={handlePaymentSuccess}
          currentUser={currentUser} 
          stores={filteredStores}
        />;
      case 'invoices':
        return <InvoicingModule currentUser={currentUser} stores={filteredStores} />;
      case 'evaluation':
        return <EvaluationModule payments={filteredPayments} />;
      case 'notifications':
        return (
          <NotificationsView 
            onBack={() => setCurrentView('payments')} 
            payments={filteredPayments}
            onManage={handleManageNotification}
            onRefresh={loadData}
            users={users}
            settings={settings}
            currentUser={currentUser}
            stores={filteredStores}
          />
        );
      case 'predictive':
        return <PredictiveDashboard payments={filteredPayments} />;
      case 'chat':
        return currentUser ? <ChatCenter currentUser={currentUser} /> : null;
      case 'settings':
        return (
          <div className="p-6 lg:p-10 text-slate-900 dark:text-white animate-in fade-in space-y-8 pb-24 lg:pb-10">
            <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
            
            {/* Sección Mi Perfil */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
               <h3 className="font-bold mb-6 flex items-center gap-2 text-blue-500">
                   <Users size={20} /> Mi Perfil de Usuario
               </h3>
               
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-400">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg cursor-pointer transition-all hover:scale-110">
                      <Plus size={20} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && currentUser) {
                            setIsLoading(true);
                            try {
                              const blob = await processImageToBlob(URL.createObjectURL(file));
                              const path = `users/${currentUser.id}/avatar_${Date.now()}.jpg`;
                              const url = await firestoreService.uploadFile(blob as File, path);
                              const updatedUser = { ...currentUser, avatar: url };
                              await firestoreService.updateUser(updatedUser);
                              setCurrentUser(updatedUser);
                              setNotification('✅ Avatar actualizado correctamente');
                            } catch (err) {
                              setNotification('❌ Error al actualizar avatar');
                            } finally {
                              setIsLoading(false);
                              setTimeout(() => setNotification(null), 3000);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre</label>
                      <p className="text-lg font-bold">{currentUser?.name}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Correo</label>
                      <p className="text-slate-600 dark:text-slate-400">{currentUser?.email}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rol</label>
                      <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800/50">
                        {currentUser?.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tiendas Asignadas</label>
                      <p className="text-slate-600 dark:text-slate-400">
                        {currentUser?.storeIds && currentUser.storeIds.length > 0 
                          ? currentUser.storeIds.length === 1 
                            ? stores.find(s => s.id === currentUser.storeIds![0])?.name 
                            : `${currentUser.storeIds.length} Tiendas`
                          : 'Acceso Global'}
                      </p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Configuración Financiera */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
               <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                   <DollarSign size={20} /> Configuración Financiera
               </h3>
               <div className="max-w-xs">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tasa de Cambio ($ / Bs.)</label>
                   <div className="flex gap-2">
                       <div className="relative flex-1">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Bs.</span>
                           <input 
                               type="number" 
                               step="0.01"
                               value={exchangeRateInput}
                               onChange={(e) => {
                                   const val = Number(e.target.value);
                                   setExchangeRateInput(val);
                                   setExchangeRate(val);
                                   localStorage.setItem('fiscal_exchange_rate', val.toString());
                               }}
                               className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
                           />
                       </div>
                       <button 
                           onClick={async () => {
                               setIsLoading(true);
                               setNotification('🌐 Obteniendo tasa BCV...');
                               try {
                                   const response = await fetch('/api/exchange-rate');
                                   const data = await response.json();
                                   if (data.success && data.rate) {
                                       setExchangeRateInput(data.rate);
                                       setExchangeRate(data.rate);
                                       localStorage.setItem('fiscal_exchange_rate', data.rate.toString());
                                       
                                       // Guardar automáticamente en Firestore
                                       const currentSettings = await firestoreService.getSettings() || {
                                           whatsappEnabled: false,
                                           whatsappPhone: '',
                                           whatsappGatewayUrl: '',
                                           daysBeforeWarning: 5,
                                           daysBeforeCritical: 2,
                                           emailEnabled: false,
                                           exchangeRate: 1
                                       };
                                       await firestoreService.saveSettings({ ...currentSettings, exchangeRate: data.rate });
                                       await firestoreService.saveExchangeRate(data.rate);
                                       
                                       setNotification(`✅ Tasa BCV actualizada: Bs. ${data.rate} (${data.lastUpdate || 'Hoy'})`);
                                   } else {
                                       setNotification('❌ No se pudo obtener la tasa oficial');
                                   }
                               } catch (err) {
                                   console.error('Error fetching exchange rate:', err);
                                   setNotification('❌ Error de conexión al obtener tasa');
                               } finally {
                                   setIsLoading(false);
                                   setTimeout(() => setNotification(null), 5000);
                               }
                           }}
                           title="Obtener tasa oficial del BCV"
                           className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-lg text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
                       >
                           <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                       </button>
                       <button 
                           onClick={async () => {
                               setIsLoading(true);
                               try {
                                   const currentSettings = await firestoreService.getSettings() || {
                                       whatsappEnabled: false,
                                       whatsappPhone: '',
                                       whatsappGatewayUrl: '',
                                       daysBeforeWarning: 5,
                                       daysBeforeCritical: 2,
                                       emailEnabled: false,
                                       exchangeRate: 1
                                   };
                                   await firestoreService.saveSettings({ ...currentSettings, exchangeRate: exchangeRateInput });
                                   await firestoreService.saveExchangeRate(exchangeRateInput);
                                   setExchangeRate(exchangeRateInput);
                                   localStorage.setItem('fiscal_exchange_rate', exchangeRateInput.toString());
                                   setNotification('✅ Tasa de cambio guardada y actualizada');
                               } catch (e) {
                                   setNotification('❌ Error actualizando tasa');
                               } finally {
                                   setIsLoading(false);
                               }
                           }}
                           className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                       >
                           Actualizar
                       </button>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2 italic">
                       Esta tasa se utiliza para mostrar los montos equivalentes en Bolívares en todo el sistema.
                   </p>
               </div>
            </div>

            {/* Gestión de Tiendas (Solo Super Usuario y Presidencia) */}
            {(currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT) && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <StoreManagement 
                  stores={filteredStores}
                  users={users}
                  onAddStore={handleAddStore}
                  onUpdateStore={handleUpdateStore}
                  onDeleteStore={handleDeleteStore}
                  currentUser={currentUser}
                />
              </div>
            )}

            {currentUser?.role === Role.SUPER_ADMIN && (
               <div className="bg-indigo-900/40 border border-indigo-500/50 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-300">Modo Super Usuario Activo</h3>
                    <p className="text-sm text-indigo-200/80">Tiene permisos totales para gestionar mantenimiento, usuarios y configuraciones avanzadas.</p>
                  </div>
               </div>
            )}
            
            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPER_ADMIN) && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                   <UserManagement currentUser={currentUser} stores={filteredStores} />
                </div>
              </div>
            )}

            {/* Configuración de Notificaciones */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
               <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-400">
                   <BellRing size={20} /> Canales de Notificación
               </h3>
               <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                       <div>
                           <h4 className="font-bold text-sm">Notificaciones por Correo</h4>
                           <p className="text-xs text-slate-500">Activar envío de alertas y recibos vía Email (Resend)</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={settings?.emailEnabled || false}
                             onChange={async (e) => {
                                 const isChecked = e.target.checked;
                                 if (settings) {
                                     const updated = { ...settings, emailEnabled: isChecked };
                                     setSettings(updated);
                                     await firestoreService.saveSettings(updated);
                                 }
                             }} 
                           />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                       </label>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                       <div>
                           <h4 className="font-bold text-sm">Notificaciones por WhatsApp</h4>
                           <p className="text-xs text-slate-500">Activar envío de alertas vía WhatsApp</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={settings?.whatsappEnabled || false}
                             onChange={async (e) => {
                                 const isChecked = e.target.checked;
                                 if (settings) {
                                     const updated = { ...settings, whatsappEnabled: isChecked };
                                     setSettings(updated);
                                     await firestoreService.saveSettings(updated);
                                 }
                             }} 
                           />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                       </label>
                   </div>
               </div>
            </div>

            <div className="grid gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                   <h3 className="font-bold mb-4 flex items-center gap-2"><BellRing size={20} /> Permisos Locales</h3>
                   <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Push Notifications: {pushPermission === 'granted' ? 'Activo' : 'Inactivo'}</span>
                      {pushPermission !== 'granted' && (
                        <button onClick={requestPermission} className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Activar</button>
                      )}
                   </div>
                </div>
            </div>
          </div>
        );
      default:
        return <div className="p-10 text-white">Vista no encontrada.</div>;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const allViews = ['admin-control', 'payments', 'network', 'calendar', 'notifications', 'settings', 'approvals', 'reports', 'invoices', 'presidency', 'evaluation', 'predictive', 'chat'];
    const allowedViews: Record<Role, string[]> = {
      [Role.SUPER_ADMIN]: allViews,
      [Role.ADMIN]: ['admin-control', 'payments', 'network', 'calendar', 'notifications', 'settings', 'invoices', 'reports', 'evaluation', 'chat'],
      [Role.AUDITOR]: ['approvals', 'calendar', 'notifications', 'settings', 'evaluation', 'predictive', 'chat'],
      [Role.PRESIDENT]: ['reports', 'network', 'notifications', 'settings', 'invoices', 'presidency', 'predictive', 'chat']
    };
    if (!allowedViews[currentUser.role].includes(currentView)) {
      setCurrentView(getInitialView(currentUser.role));
    }
  }, [currentView, currentUser]);

  if (!isAuthReady) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <Login onLoginSuccess={handleLogin} />
    );
  }

  return (
    <ExchangeRateProvider exchangeRate={exchangeRate}>
        <div className="flex bg-[#111827] dark:bg-slate-950 min-h-screen font-sans overflow-hidden">
          
          {/* Sidebar Responsive */}
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            currentRole={currentUser?.role || Role.ADMIN}
            currentUser={currentUser}
            onChangeRole={() => {}} 
            onLogout={handleLogout}
            isMobileOpen={isMobileMenuOpen}
            closeMobileMenu={() => setIsMobileMenuOpen(false)}
            installPrompt={installPrompt}
            onInstallClick={handleInstallClick}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onPaymentsClick={() => {
              setEditingPayment(null);
              setIsFormOpen(false); // Asegurar que el modal esté cerrado ya que está embebido
            }}
          />
          
          {/* Contenedor Principal */}
          <main className={`flex-1 relative transition-all duration-300 flex flex-col h-screen overflow-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
            
            {/* PWA Install Banner */}
            <AnimatePresence>
              {installPrompt && showInstallBanner && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-blue-600 text-white overflow-hidden z-40 shrink-0"
                >
                  <div className="p-3 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Instala Forza 22</p>
                        <p className="text-[10px] opacity-80">Accede más rápido y recibe notificaciones en tiempo real.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleInstallClick}
                        className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                      >
                        Instalar
                      </button>
                      <button 
                        onClick={handleDismissBanner}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Push Notification Permission Banner */}
            {pushPermission === 'default' && (
              <div className="bg-indigo-600 text-white p-3 flex items-center justify-between animate-in slide-in-from-top duration-500 z-40 shrink-0 border-b border-indigo-500">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <BellRing size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Activar Notificaciones</p>
                    <p className="text-[10px] opacity-80">Recibe alertas sobre aprobaciones y pagos vencidos al instante.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={requestPermission}
                    className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                  >
                    Permitir
                  </button>
                </div>
              </div>
            )}

            {/* Header Móvil */}
            <div className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-90 transition-all"
                    aria-label="Abrir menú"
                  >
                      <Menu size={24} />
                  </button>
                  <div className="h-8 flex-shrink-0 flex items-center justify-center">
                    <img src={APP_LOGO_URL} alt="Forza Gerencia" className="h-8 w-auto object-contain" />
                  </div>
               </div>
               <div className="w-8"></div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute top-20 right-4 lg:top-4 lg:right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    Procesando...
                </div>
            )}

            {/* Notificaciones Toast */}
            {notification && (
              <div className="fixed top-20 right-6 lg:top-6 lg:right-6 z-[60] animate-in slide-in-from-right-10 fade-in duration-300">
                 <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-blue-500 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <span className="font-medium">{notification}</span>
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                 </div>
              </div>
            )}

            {/* Modal Formulario */}
            {isFormOpen && currentView !== 'payments' && (
               <div className="fixed inset-0 z-[60] bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-[1600px] h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5">
                      <PaymentForm 
                        initialData={editingPayment}
                        payments={filteredPayments}
                        onSubmit={handleNewPayment} 
                        onCancel={() => {
                          setIsFormOpen(false);
                          setEditingPayment(null);
                        }} 
                        currentUser={currentUser}
                        stores={filteredStores}
                        budgets={filteredBudgets}
                      />
                  </div>
               </div>
            )}

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
               {renderContent()}
            </div>
          </main>
        </div>
    </ExchangeRateProvider>
  );
}

export default App;
