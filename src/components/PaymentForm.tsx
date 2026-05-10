
import React from 'react';
import { TaxInfoSearch } from './TaxInfoSearch';
import { 
  Building2, 
  Landmark, 
  Zap, 
  Upload, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Calculator,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Loader2,
  Trash2,
  Scan,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Clock,
  FileWarning,
  Users,
  Check,
  Target,
  History,
  ShieldCheck,
  Search,
  ArrowRight,
  Calendar,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { Category, Payment, PaymentStatus, User, Store, PaymentFrequency, AuditLog, Role, BudgetEntry } from '../types';
import { formatDate, getFrequencyDays, calculateNextDueDate, formatDateTime } from '../utils';
import VenezuelaMap from './VenezuelaMap';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { firestoreService } from '../services/firestoreService';
import { getTaxConfig } from '../taxConfigurations';
import { getTaxStatus, getCategoryTrafficLight, getFiscalDueDate } from '../fiscalUtils';

interface PaymentFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Payment | null;
  payments: Payment[];
  isEmbedded?: boolean;
  currentUser?: User | null;
  stores: Store[];
  budgets: BudgetEntry[];
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialData, payments, isEmbedded = false, currentUser, stores, budgets }) => {
  const { exchangeRate } = useExchangeRate();
  const [store, setStore] = React.useState(initialData?.storeId || (currentUser?.storeIds && currentUser.storeIds.length > 0 ? currentUser.storeIds[0] : ''));
  
  const filteredPayments = React.useMemo(() => {
      return payments.filter(p => p.storeId === store);
  }, [payments, store]);

  const handleStoreChange = (storeId: string) => {
    setStore(storeId);
    setCategory('');
    setTaxGroup('');
    setTaxItem('');
    setAmount('');
    setExpectedBudget(null);
    setDueDate('');
    setSpecificType('');
    setErrors({});
  };

  const [storeAddress, setStoreAddress] = React.useState('');
  const [storeMunicipality, setStoreMunicipality] = React.useState('');
  const [category, setCategory] = React.useState<Category | ''>(initialData?.category || '');
  
  // States for Tax Logic (Municipal & National)
  const [taxGroup, setTaxGroup] = React.useState('');
  const [taxItem, setTaxItem] = React.useState('');

  const [amount, setAmount] = React.useState(initialData?.amount?.toString() || '');
  const [usdAmountInput, setUsdAmountInput] = React.useState<string | null>(null);
  const [docAmountBsInput, setDocAmountBsInput] = React.useState<string | null>(null);
  const [proposedAmountBsInput, setProposedAmountBsInput] = React.useState<string | null>(null);
  const [expectedBudget, setExpectedBudget] = React.useState<number | null>(initialData?.originalBudget || null);
  
  const [dueDate, setDueDate] = React.useState(initialData?.dueDate || '');
  const [paymentDate, setPaymentDate] = React.useState(initialData?.paymentDate || new Date().toISOString().split('T')[0]);
  const [daysToExpire, setDaysToExpire] = React.useState<string>(initialData?.daysToExpire?.toString() || '');
  const [frequency, setFrequency] = React.useState<PaymentFrequency>(initialData?.frequency || PaymentFrequency.NONE);
  const [specificType, setSpecificType] = React.useState(initialData?.specificType || '');
  
  // Archivos
  const [files, setFiles] = React.useState<File[]>([]);
  const [attachments, setAttachments] = React.useState<string[]>(initialData?.attachments || [initialData?.receiptUrl, initialData?.receiptUrl2].filter(Boolean) as string[]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);

  // --- Justification State ---
  const [isOverBudget, setIsOverBudget] = React.useState(initialData?.isOverBudget || false);

  // --- Proposed Changes State ---
  const [proposedAmount, setProposedAmount] = React.useState<number | undefined>(initialData?.proposedAmount);
  const [proposedPaymentDate, setProposedPaymentDate] = React.useState<string | undefined>(initialData?.proposedPaymentDate);
  const [proposedDueDate, setProposedDueDate] = React.useState<string | undefined>(initialData?.proposedDueDate);
  const [proposedDaysToExpire, setProposedDaysToExpire] = React.useState<number | undefined>(initialData?.proposedDaysToExpire);
  const [proposedFrequency, setProposedFrequency] = React.useState<PaymentFrequency>(initialData?.proposedFrequency || PaymentFrequency.NONE);
  const [proposedJustification, setProposedJustification] = React.useState('');
  const [isProposedEdited, setIsProposedEdited] = React.useState(false);


  // Campos del Soporte
  const [docDate, setDocDate] = React.useState(initialData?.documentDate || '');
  const [docExchangeRate, setDocExchangeRate] = React.useState<number | null>(null);
  const [docAmount, setDocAmount] = React.useState(initialData?.documentAmount?.toString() || '');
  const [docName, setDocName] = React.useState(initialData?.documentName || '');
  const [dueDateExchangeRate, setDueDateExchangeRate] = React.useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = React.useState(false);

  const [notes, setNotes] = React.useState(initialData?.notes || '');

  // Fetch exchange rate when due date changes for fiscal categories
  React.useEffect(() => {
    const isFiscalCategory = category === Category.MUNICIPAL_TAX || 
                           category === Category.SENIAT_DECLARATIONS || 
                           category === Category.INSTITUTIONS;
    
    if (isFiscalCategory && dueDate) {
      const fetchRate = async () => {
        setIsLoadingRate(true);
        try {
          const result = await firestoreService.getExchangeRateByDate(dueDate);
          if (result.success && result.rate) {
            setDueDateExchangeRate(result.rate);
            // Optionally set it as the doc exchange rate if not manually set
            if (!docExchangeRate) {
              setDocExchangeRate(result.rate);
            }
          } else {
            // If no historical rate, fallback to current global rate
            setDueDateExchangeRate(null);
          }
        } catch (error) {
          console.error("Error fetching due date rate:", error);
        } finally {
          setIsLoadingRate(false);
        }
      };
      fetchRate();
    } else {
      setDueDateExchangeRate(null);
    }
  }, [dueDate, category]);

  const effectiveExchangeRate = docExchangeRate || dueDateExchangeRate || exchangeRate;

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setStore(initialData.storeId || '');
      setCategory(initialData.category || '');
      // Convert USD amount from database to Bs for the form input
      const initialAmountInBs = (initialData.amount !== undefined && initialData.amount !== null) ? (initialData.amount * (docExchangeRate || exchangeRate)).toFixed(2) : '';
      setAmount(initialAmountInBs);
      setExpectedBudget(initialData.originalBudget || null);
      setDueDate(initialData.dueDate || '');
      setPaymentDate(initialData.paymentDate || new Date().toISOString().split('T')[0]);
      setDaysToExpire(initialData.daysToExpire?.toString() || '');
      setFrequency(initialData.frequency || PaymentFrequency.NONE);
      setSpecificType(initialData.specificType || '');

      // Initialize taxGroup and taxItem from specificType
      const config = getTaxConfig(initialData.category || '');
      if (config && initialData.specificType) {
        const code = initialData.specificType.split(' - ')[0];
        let found = false;
        for (const [groupKey, groupData] of Object.entries(config)) {
          const item = (groupData as any).items?.find((i: any) => i.code === code);
          if (item) {
            setTaxGroup(groupKey);
            setTaxItem(code);
            found = true;
            break;
          }
        }
        // Fallback if code split didn't work as expected
        if (!found) {
           for (const [groupKey, groupData] of Object.entries(config)) {
             const item = (groupData as any).items?.find((i: any) => initialData.specificType.includes(i.name));
             if (item) {
               setTaxGroup(groupKey);
               setTaxItem(item.code);
               break;
             }
           }
        }
      }

      setAttachments(initialData.attachments || [initialData.receiptUrl, initialData.receiptUrl2].filter(Boolean) as string[]);
      setFiles([]);
      setPreviewUrls([]);
      setIsOverBudget(initialData.isOverBudget || false);
      
      // Initialize proposed fields - pre-fill with main values if proposed ones are empty
      setProposedAmount(initialData.proposedAmount !== undefined ? initialData.proposedAmount : initialData.amount);
      setProposedPaymentDate(initialData.proposedPaymentDate || initialData.paymentDate);
      setProposedDueDate(initialData.proposedDueDate || initialData.dueDate);
      setProposedDaysToExpire(initialData.proposedDaysToExpire !== undefined ? initialData.proposedDaysToExpire : (initialData.daysToExpire || 0));
      setProposedFrequency(initialData.proposedFrequency !== PaymentFrequency.NONE ? initialData.proposedFrequency : (initialData.frequency || PaymentFrequency.NONE));
      setProposedJustification(initialData.proposedJustification || '');

      setDocDate(initialData.documentDate || '');
      setDocAmount(initialData.documentAmount?.toString() || '');
      setDocName(initialData.documentName || '');
      setNotes(initialData.notes || '');
      setDocAmountBsInput(null);
      setProposedAmountBsInput(null);
    } else {
      // Reset to defaults for new payment
      setStore(currentUser?.storeIds && currentUser.storeIds.length > 0 ? currentUser.storeIds[0] : '');
      setCategory('');
      setAmount('');
      setExpectedBudget(null);
      setDueDate('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setDaysToExpire('');
      setFrequency(PaymentFrequency.NONE);
      setSpecificType('');
      setTaxGroup('');
      setTaxItem('');
      setFiles([]);
      setPreviewUrls([]);
      setAttachments([]);
      setIsOverBudget(false);
      setDocDate('');
      setDocAmount('');
      setDocName('');
      setNotes('');
      setDocAmountBsInput(null);
      setProposedAmountBsInput(null);
    }
    setErrors({});
    setIsManualOverride(false);
    setIsProposedEdited(false);
    setShowSuccess(false);
  }, [initialData, currentUser]);

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const storeObj = React.useMemo(() => {
    return stores.find(s => s.id === store);
  }, [stores, store]);

  const [isManualOverride, setIsManualOverride] = React.useState(false);
  const [isFinancialLocked, setIsFinancialLocked] = React.useState(true);
  const canEditFinancials = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
  
  // Estados de carga
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isFileScanning, setIsFileScanning] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const resetForm = () => {
    setStore('');
    setCategory('');
    setTaxGroup('');
    setTaxItem('');
    setAmount('');
    setExpectedBudget(null);
    setDueDate('');
    setFrequency(PaymentFrequency.NONE);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSpecificType('');
    setFiles([]);
    setAttachments([]);
    setPreviewUrls([]);
    setIsOverBudget(false);
    setDocDate('');
    setDocAmount('');
    setDocName('');
    setNotes('');
    setDocAmountBsInput(null);
    setProposedAmountBsInput(null);
    
    // Reset proposed fields
    setProposedAmount(undefined);
    setProposedPaymentDate(undefined);
    setProposedDueDate(undefined);
    setProposedDaysToExpire(undefined);
    setProposedFrequency(PaymentFrequency.NONE);
    setProposedJustification('');

    setErrors({});
    setIsManualOverride(false);
    setIsProposedEdited(false);
    setShowSuccess(false);
  };

  // Auto-fill logic based on municipal selection (Items & Amounts)
  React.useEffect(() => {
    if (store === 'NATIONAL') {
        setStoreAddress('Cobertura Nacional');
        setStoreMunicipality('Cobertura Nacional');
    } else if (store) {
      const selectedStore = stores.find(s => s.id === store);
      if (selectedStore) {
        setStoreAddress(selectedStore.address || '');
        setStoreMunicipality(selectedStore.municipality || '');
      }
    } else {
      setStoreAddress('');
      setStoreMunicipality('');
    }
  }, [store]);

  const handlePaymentDateChange = React.useCallback((val: string) => {
    setPaymentDate(val);
    if (val && dueDate) {
      const d1 = new Date(val);
      const d2 = new Date(dueDate);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExpire(diffDays.toString());
    }
  }, [dueDate]);

  const handleDueDateChange = React.useCallback((val: string) => {
    setDueDate(val);
    if (val && paymentDate) {
      const d1 = new Date(paymentDate);
      const d2 = new Date(val);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExpire(diffDays.toString());
    }
  }, [paymentDate]);

  // Auto-fill logic based on tax selection (Items & Amounts)
  const salesBookPayment = React.useMemo(() => {
    // Definimos el mapeo de códigos de Patente a Libros de Venta SENIAT (Declaraciones)
    const PATENT_TO_SENIAT_CODE: Record<string, string> = {
      '1.2.2': '7.2.1', // Patente Cod 1 -> Libro Venta Cod 1
      '1.2.3': '7.2.2', // Patente Cod 2 -> Libro Venta Cod 2
      '1.2.4': '7.2.3', // Patente Cod 3 -> Libro Venta Cod 3
    };

    const targetSeniatCode = PATENT_TO_SENIAT_CODE[taxItem];

    if (category === Category.MUNICIPAL_TAX && (taxGroup === 'PATENTE' || taxGroup === 'VENTAS') && !!dueDate && !!targetSeniatCode) {
        const parts = dueDate.split('-');
        if (parts.length < 2) return null;
        const targetYear = parts[0];
        const targetMonth = parts[1];

        // Buscamos un pago en SENIAT_DECLARACIONES que coincida con el código mapeado
        // Refinamos la búsqueda para ser más exactos con el storeId y el código
        return payments.find(p => {
            const sameStore = String(p.storeId) === String(store);
            if (!sameStore) return false;

            const isSeniatCategory = p.category === Category.SENIAT_DECLARATIONS;
            if (!isSeniatCategory) return false;
            
            if (p.status === PaymentStatus.REJECTED) return false;
            
            // Extraer el código del specificType para comparación exacta
            // specificType suele ser "7.2.1 - NOMBRE DEL RUBRO"
            const pCode = p.specificType.split(' - ')[0];
            const isTargetCode = pCode === targetSeniatCode || p.specificType.startsWith(targetSeniatCode + ' ');
            
            if (!isTargetCode) return false;
            
            if (!p.dueDate) return false;
            const pParts = p.dueDate.split('-');
            if (pParts.length < 2) return false;
            
            // Verificamos que sea el mismo año y mes
            return pParts[0] === targetYear && pParts[1] === targetMonth;
        });
    }
    return null;
  }, [category, taxGroup, taxItem, dueDate, payments, store]);

  const isPatenteGroup = category === Category.MUNICIPAL_TAX && (taxGroup === 'PATENTE' || taxGroup === 'VENTAS');
  const isPatenteScaleItem = isPatenteGroup && ['1.2.2', '1.2.3', '1.2.4'].includes(taxItem);
  const isSalesBookMissing = isPatenteScaleItem && !!dueDate && !salesBookPayment;

  React.useEffect(() => {
    const config = getTaxConfig(category);
    const isTaxCategory = !!config;

    if (isTaxCategory && config && taxGroup && taxItem) {
      const groupData = config[taxGroup];
      const itemData = groupData?.items?.find(i => i.code === taxItem);
      
      if (itemData) {
        const newSpecificType = `${itemData.code} - ${itemData.name}`;
        
        if (newSpecificType !== specificType) {
          setSpecificType(newSpecificType);
        }

        // Siempre actualizamos la frecuencia si el rubro la tiene definida
        if (itemData.frequency && frequency !== itemData.frequency) {
          setFrequency(itemData.frequency);
        }

        // --- Logic for Patente Amount ---
        if (!isManualOverride && category === Category.MUNICIPAL_TAX && (taxGroup === 'PATENTE' || taxGroup === 'VENTAS')) {
            if (taxItem === '1.1.3') {
                // Renewal is fixed $150
                const amountVal = (itemData.amount! * (effectiveExchangeRate || 1)).toFixed(2);
                if (amount !== amountVal) {
                    setAmount(amountVal);
                    setExpectedBudget(itemData.amount!);
                }
            } else if (isPatenteScaleItem) {
                if (salesBookPayment) {
                  const salesAmount = salesBookPayment.amount;
                  const finalAmount = salesAmount <= 20 ? 20 : salesAmount;
                  const amountVal = (finalAmount * (effectiveExchangeRate || 1)).toFixed(2);
                  if (amount !== amountVal) {
                      setAmount(amountVal);
                      setExpectedBudget(finalAmount);
                  }
                } else if (dueDate) {
                  // Si es un rubro de patente 1-5 y no hay libro de venta, pero hay fecha, forzamos a 0.00
                  if (amount !== "0.00") {
                      setAmount("0.00");
                      setExpectedBudget(null);
                  }
                }
            }
        } 
        // --- Logic for Other Tax Items (or fixed Patent items like Renewal if not handled above) ---
        else if (newSpecificType !== specificType && !isManualOverride && (!initialData || newSpecificType !== initialData.specificType)) {
          if (itemData.amount !== undefined && !itemData.isVariable) {
            setAmount((itemData.amount * (effectiveExchangeRate || 1)).toFixed(2));
            setExpectedBudget(itemData.amount);
          } else if (itemData.isVariable) {
            setAmount("0.00");
            setExpectedBudget(null);
          }
        }
      }
    } else if (!isTaxCategory) {
        setTaxGroup('');
        setTaxItem('');
        setExpectedBudget(null);
    }
  }, [category, taxGroup, taxItem, effectiveExchangeRate, initialData, isManualOverride, specificType, salesBookPayment, amount, dueDate, frequency, isPatenteScaleItem]);

  // Sync paymentDate when daysToExpire changes manually
  const handleDaysToExpireChange = React.useCallback((val: string) => {
    let finalVal = val;
    const days = parseInt(val);
    // Force negative if positive (as requested by user for consistency)
    if (!isNaN(days) && days > 0) {
      finalVal = (-days).toString();
    }
    setDaysToExpire(finalVal);
    
    if (finalVal && paymentDate && !isNaN(days)) {
      const d = new Date(paymentDate);
      // DueDate = PaymentDate - DaysToExpire
      d.setDate(d.getDate() - parseInt(finalVal));
      const formatted = d.toISOString().split('T')[0];
      setDueDate(formatted);
    }
  }, [paymentDate]);

  // --- Proposed Changes Handlers ---
  // Sync proposed fields with main fields if not explicitly edited by the user
  React.useEffect(() => {
    if (!isProposedEdited && !initialData) {
      const amountUsd = parseFloat(amount) / (effectiveExchangeRate || 1);
      setProposedAmount(isNaN(amountUsd) ? undefined : amountUsd);
      setProposedPaymentDate(paymentDate);
      setProposedDueDate(dueDate);
      setProposedDaysToExpire(parseInt(daysToExpire) || 0);
      setProposedFrequency(frequency);
    }
  }, [amount, paymentDate, dueDate, daysToExpire, frequency, isProposedEdited, effectiveExchangeRate, initialData]);

  const handleProposedPaymentDateChange = React.useCallback((val: string) => {
    setIsProposedEdited(true);
    setProposedPaymentDate(val);
    if (val && proposedDueDate) {
      const d1 = new Date(val);
      const d2 = new Date(proposedDueDate);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setProposedDaysToExpire(diffDays);
    }
  }, [proposedDueDate]);

  const handleProposedDueDateChange = React.useCallback((val: string) => {
    setIsProposedEdited(true);
    setProposedDueDate(val);
    if (val && proposedDaysToExpire !== undefined) {
      const d = new Date(val);
      d.setDate(d.getDate() + proposedDaysToExpire);
      const formatted = d.toISOString().split('T')[0];
      setProposedPaymentDate(formatted);
    } else if (val && proposedPaymentDate) {
      const d1 = new Date(proposedPaymentDate);
      const d2 = new Date(val);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setProposedDaysToExpire(diffDays);
    }
  }, [proposedDaysToExpire, proposedPaymentDate]);

  const handleProposedDaysToExpireChange = React.useCallback((val: string) => {
    setIsProposedEdited(true);
    let days = parseInt(val);
    // Force negative if positive (as requested by user)
    if (!isNaN(days) && days > 0) {
      days = -days;
    }
    setProposedDaysToExpire(isNaN(days) ? undefined : days);
    if (val && proposedDueDate && !isNaN(days)) {
      const d = new Date(proposedDueDate);
      d.setDate(d.getDate() + days);
      const formatted = d.toISOString().split('T')[0];
      setProposedPaymentDate(formatted);
    }
  }, [proposedDueDate]);

  // Auto-fill Due Date based on Tax Group Configuration (With Gaceta 43.273 Logic)
  React.useEffect(() => {
    const configMap = getTaxConfig(category);
    const isTaxCategory = !!configMap;

    if (isTaxCategory && configMap && taxGroup && !initialData) {
        const config = configMap[taxGroup];
        if (config) {
            const now = new Date();
            
            // Try to get specific date from RIF logic (Gaceta 43.273)
            // Use the first item in group as representative for code checking
            const repItem = config.items[0];
            const rifDate = (storeObj && repItem && category) 
               ? getFiscalDueDate(category, repItem.code, storeObj.rifEnding || 0, now) 
               : null;

            if (rifDate) {
               handleDueDateChange(rifDate.toISOString().split('T')[0]);
            } else {
              // Legacy/Fallback Logic
              const year = now.getFullYear();
              const month = now.getMonth();
              const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
              const targetDay = Math.min(config.deadlineDay, lastDayOfMonth);
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
              handleDueDateChange(formattedDate);
            }
        }
    }
  }, [category, taxGroup, initialData, handleDueDateChange, storeObj]);

  const isCurrentTaxItemVariable = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    const isTaxCategory = !!configMap;

    if (isTaxCategory && configMap && taxGroup && taxItem) {
        const groupData = configMap[taxGroup];
        const itemData = groupData?.items?.find(i => i.code === taxItem);
        return itemData?.isVariable || false;
    }
    return false;
  }, [category, taxGroup, taxItem]);

  // Budget Monitoring Logic
  React.useEffect(() => {
    // Convert current Bs amount to USD for budget comparison
    const amountInUsd = parseFloat(amount) / (effectiveExchangeRate || 1);
    // Use document amount if present (already in USD), otherwise use converted main amount
    const effectiveAmountInUsd = docAmount ? parseFloat(docAmount) : amountInUsd;
    
    if (isCurrentTaxItemVariable) {
        // For variable items, only manual flag determines over budget
        setIsOverBudget(false);
    } else if (expectedBudget !== null && !isNaN(effectiveAmountInUsd)) {
        // For fixed items, compare amount to budget
        if (effectiveAmountInUsd > expectedBudget) {
            setIsOverBudget(true);
        } else {
            setIsOverBudget(false);
        }
    } else {
        setIsOverBudget(false);
    }
  }, [amount, docAmount, expectedBudget, isCurrentTaxItemVariable, effectiveExchangeRate]);


  // Reset tax selection when category changes to prevent inconsistent state
  React.useEffect(() => {
    if (!initialData) { // Only reset if not in initial edit mode
      setTaxGroup('');
      setTaxItem('');
      setExpectedBudget(null);
      setIsManualOverride(false);
    }
  }, [category, initialData]);

  // Calcular el estado dinámico de las tiendas para el mapa
  const dynamicStores = React.useMemo(() => {
    const storesToProcess = (currentUser?.storeIds && currentUser.storeIds.length > 0) ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores;
    return storesToProcess.map(store => {
        const storePayments = payments.filter(p => p.storeId === store.id);
        let calculatedStatus: 'En Regla' | 'En Riesgo' | 'Vencido' = 'En Regla';
        
        const hasOverdue = storePayments.some(p => p.status === PaymentStatus.OVERDUE);
        const hasPending = storePayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);

        if (hasOverdue) {
            calculatedStatus = 'Vencido';
        } else if (hasPending) {
            calculatedStatus = 'En Riesgo';
        }

        return {
            ...store,
            status: calculatedStatus
        };
    });
  }, [payments, currentUser, stores]);

  // Clean up preview URLs
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  React.useEffect(() => {
    const fetchHistoricalRate = async () => {
      if (docDate) {
        try {
          const result = await firestoreService.getExchangeRateByDate(docDate);
          if (result && result.rate) {
            setDocExchangeRate(result.rate);
          } else {
            setDocExchangeRate(null);
          }
        } catch (e) {
          console.error("Error fetching historical rate:", e);
          setDocExchangeRate(null);
        }
      } else {
        setDocExchangeRate(null);
      }
    };
    fetchHistoricalRate();
  }, [docDate]);

  const taxStatusList = React.useMemo(() => {
    const config = getTaxConfig(category);
    if (!config) return [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isGlobalUser = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
    const hasAllowedTaxGroups = currentUser?.allowedTaxGroups && currentUser.allowedTaxGroups.length > 0;

    return Object.entries(config)
      .filter(([key]) => {
        if (isGlobalUser || !hasAllowedTaxGroups) return true;
        return currentUser.allowedTaxGroups?.includes(key);
      })
      .map(([key, groupConfig]) => {
        let hasRed = false;
        let hasOrange = false;
        
        groupConfig.items.forEach(item => {
            const itemPayments = payments.filter(p => {
                const pDate = new Date(p.dueDate);
                return p.storeId === store && 
                       p.category === category && 
                       p.specificType.startsWith(item.code) &&
                       pDate.getMonth() === currentMonth &&
                       pDate.getFullYear() === currentYear;
            });

            const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
            
            if (hasApprovedOrPaid) {
                // Si está aprobado, no hay alerta
                return;
            }

            const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
            const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
            const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

            // Budget Exceedance Logic
            const totalPaid = itemPayments
                .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const assignedBudget = budgets.find(b => 
                b.storeId === store && 
                b.category === category && 
                b.title.startsWith(item.code) &&
                new Date(b.date).getMonth() === currentMonth &&
                new Date(b.date).getFullYear() === currentYear
            );

            const budgetValue = assignedBudget ? assignedBudget.amount : item.amount;
            const isVariable = item.isVariable === true;
            const hasBaseAmount = item.amount !== undefined;
            const hasAssignedBudget = !!assignedBudget;
            const isBudgetExceeded = isVariable && hasBaseAmount && hasAssignedBudget && totalPaid > budgetValue;

            // Estado base desde el calendario para este ítem específico
            const itemCalendarStatus = category ? getTaxStatus(groupConfig.deadlineDay, category, item.code, storeObj) : null;

            if (hasRejected || hasOverdue || (itemCalendarStatus?.status === 'Vencido') || isBudgetExceeded) {
                hasRed = true;
            } else if (hasPendingOrUploaded || (itemCalendarStatus?.status === 'Próximo')) {
                hasOrange = true;
            }
        });

        if (hasRed) {
            return { key, label: groupConfig.label, color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Acción Requerida', icon: AlertCircle };
        } else if (hasOrange) {
            return { key, label: groupConfig.label, color: 'bg-amber-500', text: 'text-amber-600', bgSoft: 'bg-amber-100', status: 'Enviado', icon: Clock };
        } else {
            return { key, label: groupConfig.label, color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', status: 'Al día', icon: CheckCircle2 };
        }
    });
  }, [category, store, payments, currentUser, budgets]);

  const specificItemStatusList = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    if (!configMap || !taxGroup) return [];
    const groupConfig = configMap[taxGroup];
    if (!groupConfig) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isGlobalUser = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
    const hasAllowedTaxItems = currentUser?.allowedTaxItems && currentUser.allowedTaxItems.length > 0;

    return groupConfig.items
      .filter(item => {
        if (isGlobalUser || !hasAllowedTaxItems) return true;
        return currentUser.allowedTaxItems?.includes(item.code);
      })
      .map(item => {
        const itemPayments = filteredPayments.filter(p => {
        const pDate = new Date(p.dueDate);
        return p.category === category && 
               p.specificType.startsWith(item.code) &&
               pDate.getMonth() === currentMonth &&
               pDate.getFullYear() === currentYear;
      });

      const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
      const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
      const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
      const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

      // Budget Exceedance Logic
      const totalPaid = itemPayments
          .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const assignedBudget = budgets.find(b => 
          b.storeId === store && 
          b.category === category && 
          b.title.startsWith(item.code) &&
          new Date(b.date).getMonth() === currentMonth &&
          new Date(b.date).getFullYear() === currentYear
      );

      const budgetValue = assignedBudget ? assignedBudget.amount : item.amount;
      const isVariable = item.isVariable === true;
      const hasBaseAmount = item.amount !== undefined;
      const hasAssignedBudget = !!assignedBudget;
      const isBudgetExceeded = isVariable && hasBaseAmount && hasAssignedBudget && totalPaid > budgetValue;

      if (isBudgetExceeded) {
        return { 
          ...item, 
          color: 'bg-red-500', 
          text: 'text-red-700', 
          bgSoft: 'bg-red-100', 
          status: 'Excedido', 
          icon: AlertTriangle 
        };
      }

      if (hasRejected || hasOverdue) {
        return { 
          ...item, 
          color: 'bg-red-500', 
          text: 'text-red-600', 
          bgSoft: 'bg-red-100', 
          status: 'Vencido', 
          icon: AlertCircle 
        };
      }

      if (hasPendingOrUploaded) {
        return { 
          ...item, 
          color: 'bg-amber-500', 
          text: 'text-amber-600', 
          bgSoft: 'bg-amber-100', 
          status: 'Enviado', 
          icon: Clock 
        };
      }

      if (hasApprovedOrPaid) {
        return { 
          ...item, 
          color: 'bg-emerald-500', 
          text: 'text-emerald-600', 
          bgSoft: 'bg-emerald-100', 
          status: 'Al día', 
          icon: CheckCircle2 
        };
      }

      const status = category ? getTaxStatus(groupConfig.deadlineDay, category, groupConfig.items[0]?.code, storeObj) : { status: 'En fecha', color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', icon: CheckCircle2 };
      // Map 'Próximo' to 'Enviado' (Orange) if we want to follow the user's color logic strictly
      // but 'Próximo' is a date status, not a payment status.
      // However, the user wants Orange for "sent to auditor".
      // If no payment exists and it's 'Próximo', maybe it should be Amber/Orange too.
      return { 
        ...item, 
        ...status,
        status: status.status === 'Próximo' ? 'Próximo' : (status.status === 'En fecha' ? 'Al día' : status.status)
      };
    });
  }, [category, taxGroup, payments, store, currentUser, budgets]);

  const allCategoryItemsStatus = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    if (!configMap) return [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isGlobalUser = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
    const hasAllowedTaxGroups = currentUser?.allowedTaxGroups && currentUser.allowedTaxGroups.length > 0;
    const hasAllowedTaxItems = currentUser?.allowedTaxItems && currentUser.allowedTaxItems.length > 0;

    return Object.entries(configMap)
      .filter(([key]) => {
        if (isGlobalUser || !hasAllowedTaxGroups) return true;
        return currentUser.allowedTaxGroups?.includes(key);
      })
      .map(([groupKey, groupConfig]) => {
        const items = groupConfig.items
          .filter(item => {
            if (isGlobalUser || !hasAllowedTaxItems) return true;
            return currentUser.allowedTaxItems?.includes(item.code);
          })
          .map(item => {
            const itemPayments = filteredPayments.filter(p => {
                const pDate = new Date(p.dueDate);
                return p.category === category && 
                       p.specificType.startsWith(item.code) &&
                       pDate.getMonth() === currentMonth &&
                       pDate.getFullYear() === currentYear;
            });

            const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
            const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
            const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
            const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

            // Budget Exceedance Logic for Variable Items
            const totalPaid = itemPayments
                .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const assignedBudget = budgets.find(b => 
                b.storeId === store && 
                b.category === category && 
                b.title.startsWith(item.code) &&
                new Date(b.date).getMonth() === currentMonth &&
                new Date(b.date).getFullYear() === currentYear
            );

            const budgetValue = assignedBudget ? assignedBudget.amount : item.amount;
            const isVariable = item.isVariable === true;
            const hasBaseAmount = item.amount !== undefined;
            const hasAssignedBudget = !!assignedBudget;
            const isBudgetExceeded = isVariable && hasBaseAmount && hasAssignedBudget && totalPaid > budgetValue;

            let statusInfo;
            if (isBudgetExceeded) {
                statusInfo = { color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Presupuesto Excedido', icon: AlertTriangle };
            } else if (hasApprovedOrPaid) {
                statusInfo = { color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', status: 'Al día', icon: CheckCircle2 };
            } else if (hasRejected || hasOverdue) {
                statusInfo = { color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Vencido', icon: AlertCircle };
            } else if (hasPendingOrUploaded) {
                statusInfo = { color: 'bg-amber-500', text: 'text-amber-600', bgSoft: 'bg-amber-100', status: 'Enviado', icon: Clock };
            } else {
                const dateStatus = category ? getTaxStatus(groupConfig.deadlineDay, category, item.code, storeObj) : { status: 'En fecha', color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', icon: CheckCircle2 };
                statusInfo = { 
                    ...dateStatus, 
                    status: dateStatus.status === 'Próximo' ? 'Próximo' : (dateStatus.status === 'En fecha' ? 'Al día' : dateStatus.status)
                };
            }

            return { ...item, ...statusInfo, payments: itemPayments };
        });

        return {
            groupKey,
            label: groupConfig.label,
            items
        };
    }).filter(group => group.items.length > 0);
  }, [category, store, payments, currentUser, budgets]);

  const globalStatus = React.useMemo(() => {
    if (taxStatusList.some(i => i.status === 'Vencido')) return { color: 'bg-red-500', border: 'border-red-200', text: 'text-red-700', bg: 'bg-red-50', label: 'ACCIONES REQUERIDAS (VENCIDO)' };
    if (taxStatusList.some(i => i.status === 'Próximo' || i.status === 'Enviado')) return { color: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', label: 'ATENCIÓN (PENDIENTES / PRÓXIMOS)' };
    return { color: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'TODO EN REGLA' };
  }, [taxStatusList]);



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const limitMB = 10;
        const maxSize = limitMB * 1024 * 1024;
        
        const validFiles: File[] = [];
        const newPreviewUrls: string[] = [];

        for (const file of selectedFiles) {
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({...prev, file: `Formato no permitido para ${file.name}. Use PDF, JPG o PNG.`}));
                continue;
            }
            if (file.size > maxSize) {
                setErrors(prev => ({...prev, file: `${file.name} es muy grande. El límite es ${limitMB}MB.`}));
                continue;
            }
            validFiles.push(file);
            if (file.type.startsWith('image/')) {
                newPreviewUrls.push(URL.createObjectURL(file));
            }
        }

        if (validFiles.length > 0) {
            setIsFileScanning(true);
            setUploadProgress(0);
            
            const duration = 1000;
            const steps = 10;
            const interval = duration / steps;
            for (let i = 0; i <= 100; i += (100 / steps)) {
                setUploadProgress(Math.min(100, Math.round(i)));
                await new Promise(resolve => setTimeout(resolve, interval));
            }

            setFiles(prev => [...prev, ...validFiles]);
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
            setIsFileScanning(false);
            setErrors(prev => { const newErrs = {...prev}; delete newErrs.file; return newErrs; });
        }
    }
  };

  const removeFile = (index: number, isExisting: boolean) => {
    if (isExisting) {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
        const fileToRemove = files[index];
        const previewUrlToRemove = previewUrls[index];
        if (previewUrlToRemove) URL.revokeObjectURL(previewUrlToRemove);
        
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    const isTaxCategory = !!getTaxConfig(category);
    if (isTaxCategory) {
        if (!taxGroup) newErrors.taxGroup = "Seleccione el grupo fiscal";
        if (!taxItem) newErrors.taxItem = "Seleccione el concepto";
        
        if (category === Category.MUNICIPAL_TAX && taxGroup === 'PATENTE' && isSalesBookMissing) {
            newErrors.taxItem = "No se puede pagar Patente sin haber cargado el Libro de Venta del periodo.";
        }
    }
    const parsedAmount = amount === '' ? 0 : parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      newErrors.amount = "Monto inválido (debe ser mayor o igual a cero)";
    }
    if (!dueDate) newErrors.dueDate = "Fecha requerida";
    if (!paymentDate) newErrors.paymentDate = "Fecha requerida";
    if (!specificType) newErrors.specificType = "Descripción requerida";
    if (files.length === 0 && attachments.length === 0 && !isFileScanning) newErrors.file = "Al menos un comprobante es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isFileScanning) return; 

    processSubmit();
  };

  const processSubmit = async () => {
    setIsSubmitting(true);
    setLoadingText('Digitalizando...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingText('Verificando...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingText('Guardando...');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await onSubmit({
            id: initialData?.id,
            storeId: store,
            category,
            // Convert Bs amount back to USD for storage, treat empty as 0
            amount: (parseFloat(amount) || 0) / (effectiveExchangeRate || 1),
            dueDate,
            paymentDate,
            daysToExpire: daysToExpire ? parseInt(daysToExpire) : undefined,
            frequency,
            specificType,
            files,
            attachments,
            notes,
            // Extra Data
            originalBudget: expectedBudget,
            isOverBudget,
            // Soporte Data
            documentDate: docDate,
            documentAmount: docAmount ? parseFloat(docAmount) : undefined,
            documentName: docName,
            // Proposed Data
            proposedAmount,
            proposedPaymentDate,
            proposedDueDate,
            proposedDaysToExpire,
            proposedFrequency,
            proposedJustification,
            proposedStatus: (proposedAmount !== undefined) || proposedPaymentDate || proposedDueDate ? 'PENDING_APPROVAL' : undefined,
            // Historic Rate Reference
            dueDateRate: category === Category.MUNICIPAL_TAX || category === Category.SENIAT_DECLARATIONS || category === Category.INSTITUTIONS ? (dueDateExchangeRate || undefined) : undefined,
            dueDateAmountBs: category === Category.MUNICIPAL_TAX || category === Category.SENIAT_DECLARATIONS || category === Category.INSTITUTIONS ? (parseFloat(amount) || 0) : undefined
        });
        
        setShowSuccess(true);
        setIsSubmitting(false);
        setLoadingText('');
        
        // Esperamos un momento para que el usuario vea el check
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reseteamos el estado de éxito local ANTES de llamar onCancel/resetForm
        // Esto previene que el overlay se mantenga si el componente no se desmonta
        setShowSuccess(false);
        
        if (onCancel) onCancel();
        resetForm();
    } catch (error) {
        console.error("Error submitting payment:", error);
        setIsSubmitting(false);
        setLoadingText('');
    }
  };

  return (
    <div className="p-6 lg:p-10 xl:p-12 w-full max-w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Overlay de Éxito */}
      {showSuccess && (
        <div 
          onClick={() => {
            setShowSuccess(false);
            onCancel();
            resetForm();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 cursor-pointer"
        >
           <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md w-full shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] border border-emerald-500/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500"
           >
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping duration-1000"></div>
                <CheckCircle2 size={48} className="text-emerald-500 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">¡Pago Guardado!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                  El pago ha sido registrado exitosamente en el sistema de control fiscal. 
                  <br /><br />
                  <span className="font-bold text-slate-400">Esta ventana se cerrará automáticamente en unos segundos.</span>
              </p>
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  <Loader2 size={12} className="animate-spin" />
                  Finalizando...
              </div>
           </div>
        </div>
      )}
      
      {/* Top Banner for Rejected Payments */}
      {initialData?.status === PaymentStatus.REJECTED && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="mb-10 -mx-6 lg:-mx-10 xl:-mx-12 -mt-6 lg:-mt-10 xl:-mt-12 p-4 bg-red-600 text-white text-center text-sm font-black uppercase tracking-[0.3em] rounded-t-2xl flex items-center justify-center gap-4 shadow-xl shadow-red-500/20 border-b border-red-500"
        >
          <AlertTriangle size={20} className="animate-pulse" aria-hidden="true" />
          <span>Atención: Este pago requiere correcciones inmediatas</span>
          <AlertTriangle size={20} className="animate-pulse" aria-hidden="true" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            {!isEmbedded && (
                <button onClick={onCancel} disabled={isSubmitting} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <ChevronDown className="rotate-90" size={24} />
                </button>
            )}
            <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {initialData?.status === PaymentStatus.REJECTED ? 'Corregir Registro' : (initialData ? 'Editar Pago' : 'Cargar Nuevo Pago')}
                  </h1>
                  {initialData?.status === PaymentStatus.REJECTED && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-md border border-red-200 animate-pulse">
                      Devuelto
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {initialData?.status === PaymentStatus.REJECTED 
                        ? `ID de Transacción: ${initialData.id}` 
                        : (initialData ? `Editando pago: ${initialData.id}` : 'Registre los detalles de la transacción para auditoría.')
                    }
                </p>
            </div>
        </div>
      </div>

      {/* Auditor Feedback for Rejected Payments - Refined UI */}
      {initialData?.status === PaymentStatus.REJECTED && initialData.rejectionReason && (
        <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="glass-card border-red-500/30 bg-red-500/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Motivo de la Devolución</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{formatDate(new Date())}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 relative">
                  <p className="text-slate-300 text-lg font-serif italic leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                    "{initialData.rejectionReason}"
                  </p>
                  
                  {initialData.checklist && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(initialData.checklist).filter(([key]) => key !== 'documentDateApproved').map(([key, value]) => {
                        const labels: Record<string, string> = {
                          receiptValid: 'Comprobante Válido',
                          stampLegible: 'Sello Legible',
                          storeConceptMatch: 'Tienda y Concepto',
                          datesApproved: 'Fechas de Vencimiento',
                          proposedDatesApproved: 'Fechas Propuestas',
                          amountsApproved: 'Montos y Presupuesto',
                          proposedAmountApproved: 'Monto Autorizado',
                          observationsApproved: 'Notas y Observaciones'
                        };
                        return (
                          <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            value 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}>
                            {value ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-wider">{labels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1 bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Instrucciones de Auditoría</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Por favor, revise los campos resaltados en rojo y asegúrese de que la documentación adjunta sea legible y corresponda al concepto solicitado.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <RefreshCw size={14} className="text-red-500 animate-spin-slow" /> 
                  Ajuste los campos marcados o reemplace los documentos para reenviar.
                </p>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 shadow-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Origen y Clasificación */}
        <section className={`glass-card p-8 transition-all duration-500 ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
            <h2 className="label-caps mb-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
                Ubicación y Clasificación Fiscal
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-3 space-y-8">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Sucursal / Tienda</label>
                        <div className="relative group">
                            <select 
                                value={store}
                                onChange={(e) => handleStoreChange(e.target.value)}
                                disabled={isSubmitting || (!!currentUser?.storeIds && currentUser.storeIds.length === 1)}
                                className={`w-full appearance-none bg-slate-50 dark:bg-slate-950/50 border ${errors.store ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'} text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer`}
                            >
                                <option value="" className="bg-slate-50 dark:bg-slate-900">Seleccionar ubicación...</option>
                                {category === Category.PAYROLL && (!currentUser?.storeIds || currentUser.storeIds.length === 0) && (
                                    <option value="NATIONAL" className="bg-slate-50 dark:bg-slate-900">Nacional (Cobertura Nacional)</option>
                                )}
                                {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(s => (
                                    <option key={s.id} value={s.id} className="bg-slate-50 dark:bg-slate-900">{s.name}</option>
                                ))}
                            </select>
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                        </div>
                        {errors.store && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.store}</p>}
                    </div>

                    {category && (
                        <div className="p-5 bg-brand-500/5 border border-brand-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-left-2">
                            <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Guía de Categoría</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {[
                                        { id: Category.MUNICIPAL_TAX, desc: 'Impuestos y tasas correspondientes a la alcaldía (Patentes, Inmuebles, Aseo).' },
                                        { id: Category.OBJECT, desc: 'Certificaciones y registros relacionados con el objeto de la empresa (SENCAMER, RACDA).' },
                                        { id: Category.INSTITUTIONS, desc: 'Trámites ante instituciones nacionales y permisos sanitarios (SNC, RUPDAE, FONACIT, INSALUD).' },
                                        { id: Category.PAYROLL, desc: 'Nómina, pasivos laborales y contribuciones patronales (IVSS, BANAVIH, INCES).' },
                                        { id: Category.TRANSPORT, desc: 'Documentación legal de choferes, vehículos y control de mantenimiento.' },
                                        { id: Category.UTILITY, desc: 'Servicios públicos, mantenimiento de sede, alquileres e insumos de limpieza.' },
                                        { id: Category.SENIAT_DECLARATIONS, desc: 'Cumplimiento de obligaciones tributarias SENIAT (IVA, ISLR, IGTF, IGP).' },
                                        { id: Category.SENIAT_BOOKS, desc: 'Mantenimiento de libros legales y contables obligatorios.' },
                                        { id: Category.SYSTEMS, desc: 'Gastos de tecnología, marketing digital, papelería y mobiliario.' },
                                    ].find(c => c.id === category)?.desc}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-9">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Categoría Fiscal</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                        {[
                            { id: Category.MUNICIPAL_TAX, label: 'Alcaldía', icon: Building2 },
                            { id: Category.OBJECT, label: 'Objeto', icon: FileText },
                            { id: Category.INSTITUTIONS, label: 'Inst. Nac.', icon: Landmark },
                            { id: Category.PAYROLL, label: 'RRHH', icon: Users },
                            { id: Category.TRANSPORT, label: 'Transporte', icon: FileText },
                            { id: Category.UTILITY, label: 'Servicios', icon: Zap },
                            { id: Category.SENIAT_DECLARATIONS, label: 'SENIAT Decl.', icon: FileText },
                            { id: Category.SENIAT_BOOKS, label: 'SENIAT Libros', icon: FileText },
                            { id: Category.SYSTEMS, label: 'Sistemas', icon: FileText },
                            { id: Category.INVENTORY, label: 'Inventario', icon: Calculator },
                            { id: Category.OTHER, label: 'Otros', icon: Plus },
                        ].filter(cat => {
                            const isGlobalUser = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;
                            if (isGlobalUser || !currentUser?.allowedCategories || currentUser.allowedCategories.length === 0) return true;
                            return currentUser.allowedCategories.includes(cat.id);
                        }).map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            const rawTrafficLight = getCategoryTrafficLight(cat.id, store, filteredPayments, budgets, storeObj);
                            const trafficLight = rawTrafficLight;
                            
                            let trafficClasses = '';
                            let iconClasses = '';
                            let textClasses = '';
                            
                            if (trafficLight === 'red') {
                                trafficClasses = isSelected 
                                    ? 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                                    : 'border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-400 hover:border-red-500 hover:bg-red-500/10';
                                iconClasses = isSelected ? 'bg-red-500 text-white shadow-red-500/20 scale-110' : 'bg-red-500/20 text-red-500 group-hover:bg-red-500/30';
                                textClasses = isSelected ? 'text-red-900 dark:text-red-100' : 'text-red-700 dark:text-red-400 group-hover:text-red-500';
                            } else if (trafficLight === 'amber') {
                                trafficClasses = isSelected 
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                                    : 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:border-amber-500 hover:bg-amber-500/10';
                                iconClasses = isSelected ? 'bg-amber-500 text-white shadow-amber-500/20 scale-110' : 'bg-amber-500/20 text-amber-500 group-hover:bg-amber-500/30';
                                textClasses = isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-amber-700 dark:text-amber-400 group-hover:text-amber-500';
                            } else if (trafficLight === 'green') {
                                trafficClasses = isSelected 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                    : 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10';
                                iconClasses = isSelected ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-110' : 'bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/30';
                                textClasses = isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-500';
                            } else {
                                trafficClasses = isSelected 
                                    ? 'border-brand-500 bg-brand-500/10 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:bg-slate-800';
                                iconClasses = isSelected ? 'bg-brand-500 text-slate-900 dark:text-white shadow-brand-500/20 scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300';
                                textClasses = isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 group-hover:text-slate-300';
                            }

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setCategory(cat.id)}
                                    aria-pressed={isSelected}
                                    aria-label={`${cat.label} - Estado: ${trafficLight === 'red' ? 'Vencido' : trafficLight === 'amber' ? 'Pendiente' : 'Al día'}`}
                                    className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group active:scale-95 ${trafficClasses} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${iconClasses}`} aria-hidden="true">
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-tighter transition-colors ${textClasses}`}>{cat.label}</span>
                                    <span className="sr-only">
                                        {trafficLight === 'red' ? 'Esta categoría tiene obligaciones vencidas' : trafficLight === 'amber' ? 'Esta categoría tiene obligaciones pendientes' : 'Categoría al día'}
                                    </span>
                                    {isSelected && (
                                        <div className={`absolute top-2 right-2 animate-in zoom-in duration-300 ${trafficLight === 'red' ? 'text-red-500' : trafficLight === 'amber' ? 'text-amber-500' : trafficLight === 'green' ? 'text-emerald-500' : 'text-brand-400'}`}>
                                            <CheckCircle2 size={14} aria-hidden="true" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    {errors.category && <p className="text-red-400 text-[10px] font-black uppercase mt-3 ml-1 tracking-tighter">{errors.category}</p>}
                </div>
            </div>
        </section>

        <div className="space-y-10">
            <div className="space-y-10">
                {/* Dynamic Tax Section with Traffic Light */}
                {!!getTaxConfig(category) && (
                    <section className={`rounded-3xl border-2 transition-all duration-500 animate-in slide-in-from-top-4 overflow-hidden shadow-2xl ${globalStatus.bg} ${globalStatus.border}`}>
                        
                        {/* Header Dinámico */}
                        <div className={`p-6 border-b-2 ${globalStatus.border} flex items-center justify-between bg-white/40 dark:bg-black/10 backdrop-blur-md`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${globalStatus.color} text-slate-950 dark:text-slate-50 shadow-lg`}>
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black uppercase tracking-tight ${globalStatus.text}`}>Desglose de Obligaciones</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estado fiscal actualizado al día de hoy</p>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black border-2 uppercase tracking-widest bg-white/80 dark:bg-black/40 shadow-sm ${globalStatus.text} ${globalStatus.border}`}>
                                {globalStatus.label}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
                            {/* Selector de Rubro */}
                            <div className="p-8 bg-white/30 dark:bg-slate-900/30">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Seleccione Rubro a Pagar</label>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{taxStatusList.length} Rubros Disponibles</span>
                                </div>
                                <div 
                                    role="listbox"
                                    aria-label="Seleccione Rubro a Pagar"
                                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2"
                                >
                                    {taxStatusList.map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            role="option"
                                            aria-selected={taxGroup === item.key}
                                            onClick={() => {
                                                setTaxGroup(item.key);
                                                setTaxItem('');
                                                const element = document.getElementById(`group-${item.key}`);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group active:scale-[0.98] ${
                                                taxGroup === item.key 
                                                ? 'bg-brand-500/10 border-brand-500 ring-4 ring-brand-500/10 shadow-lg' 
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className={`w-3.5 h-3.5 rounded-full shadow-md ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}
                                                    aria-label={`Estado: ${item.status}`}
                                                ></div>
                                                <span className={`text-xs font-black uppercase tracking-tight ${taxGroup === item.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {item.label.split(' ').slice(1, 5).join(' ')}
                                                </span>
                                            </div>
                                            <div className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1.5 ${item.bgSoft} ${item.text} border border-current/10`}>
                                                <item.icon size={10} aria-hidden="true" />
                                                <span className="hidden sm:inline uppercase tracking-tighter">{item.status}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selector de Concepto Específico - Ahora muestra TODOS los conceptos agrupados */}
                            <div className="p-8 flex flex-col bg-white dark:bg-slate-900">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase ml-1">Conceptos de Pago</label>
                                    <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">
                                        {allCategoryItemsStatus.reduce((acc, curr) => acc + curr.items.length, 0)} Conceptos totales
                                    </span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[600px] space-y-8">
                                    {allCategoryItemsStatus.map((group) => (
                                        <div key={group.groupKey} id={`group-${group.groupKey}`} className={`space-y-4 transition-all duration-500 ${taxGroup && taxGroup !== group.groupKey ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{group.label}</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {group.items.map((item) => (
                                                    <button
                                                        key={item.code}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={taxItem === item.code}
                                                        disabled={isSubmitting}
                                                        onClick={() => {
                                                            setTaxGroup(group.groupKey);
                                                            setTaxItem(item.code);
                                                        }}
                                                        className={`w-full flex flex-col p-4 rounded-2xl border-2 transition-all text-left group relative active:scale-[0.98] ${
                                                            taxItem === item.code 
                                                            ? 'bg-brand-500/10 border-brand-500 ring-4 ring-brand-500/10 shadow-xl' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${item.bgSoft} ${item.text} flex items-center gap-1.5 border border-current/10 uppercase tracking-tighter`}>
                                                                <item.icon size={12} aria-hidden="true" />
                                                                {item.status}
                                                            </span>
                                                            <span className="text-[10px] font-black font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">{item.code}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-black leading-tight mb-2 uppercase tracking-tight ${taxItem === item.code ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {item.name}
                                                            </span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {item.amount !== undefined && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md">
                                                                            ${item.amount.toLocaleString()}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Presupuestaria</span>
                                                                    </div>
                                                                )}
                                                                {item.frequency && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                                                            {item.frequency}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frecuencia</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Desglose de Pagos Existentes */}
                                                            {item.payments && item.payments.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-1.5">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Desglose de Pagos ({item.payments.length})</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {item.payments.map((p: any) => (
                                                                            <div 
                                                                                key={p.id} 
                                                                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1 ${
                                                                                    p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID
                                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                                    : p.status === PaymentStatus.REJECTED || p.status === PaymentStatus.OVERDUE
                                                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                                                    : 'bg-amber-50 text-amber-600 border-amber-200'
                                                                                }`}
                                                                            >
                                                                                <div 
                                                                                    className={`w-1 h-1 rounded-full ${
                                                                                        p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID
                                                                                        ? 'bg-emerald-500'
                                                                                        : p.status === PaymentStatus.REJECTED || p.status === PaymentStatus.OVERDUE
                                                                                        ? 'bg-red-500'
                                                                                        : 'bg-amber-500'
                                                                                    }`}
                                                                                    aria-label={`Estado del pago: ${p.status}`}
                                                                                ></div>
                                                                                {p.status}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div 
                                                            className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-sm ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}
                                                            aria-label={`Estado de la obligación: ${item.status}`}
                                                        ></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {isSalesBookMissing && (
                                        <div className="mt-4 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="p-3 bg-red-500/20 rounded-xl">
                                                <AlertTriangle className="text-red-500" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-red-400 text-sm font-black uppercase tracking-widest">Libro de Venta Faltante</p>
                                                <p className="text-red-300/70 text-xs mt-2 leading-relaxed font-medium">
                                                    Aviso: Para realizar el pago de <span className="text-red-400 font-bold">Patente Municipal</span>, primero debe haber registro del <span className="text-red-400 font-bold">Libro de Venta</span> en <span className="text-red-400 font-bold">SENIAT Declaraciones</span> para el código y periodo mensual seleccionado.
                                                </p>
                                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-red-400/50 uppercase tracking-tighter">
                                                    <Clock size={12} />
                                                    Periodo: {dueDate ? new Date(dueDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'No seleccionado'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 p-4 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl border border-brand-500/20 text-xs text-slate-500 dark:text-slate-300">
                                    <div className="flex gap-3">
                                        <AlertCircle size={18} className="shrink-0 text-brand-500" />
                                        <p className="leading-relaxed">
                                            <span className="font-black uppercase tracking-widest text-brand-500 block mb-1">Guía de Selección</span>
                                            Seleccione el rubro y concepto exacto. El color indica la urgencia según la fecha de vencimiento legal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Section 2: Detalles Financieros */}
                <section className={`glass-card p-10 transition-all duration-500 shadow-xl ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="label-caps flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            Detalles Financieros
                        </h2>
                        <div className="flex items-center gap-4">
                            {!!getTaxConfig(category) && !isManualOverride && !isFinancialLocked && (
                                <button
                                    type="button"
                                    onClick={() => setIsManualOverride(true)}
                                    className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <RefreshCw size={12} className="animate-spin-slow" />
                                    Editar manualmente
                                </button>
                            )}
                            {canEditFinancials && isFinancialLocked && (
                                <button
                                    type="button"
                                    onClick={() => setIsFinancialLocked(false)}
                                    className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <Unlock size={12} />
                                    Editar Detalles
                                </button>
                            )}
                            {canEditFinancials && !isFinancialLocked && (
                                <button
                                    type="button"
                                    onClick={() => setIsFinancialLocked(true)}
                                    className="text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <Lock size={12} />
                                    Bloquear Detalles
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Store Location Info (Auto-filled) */}
                    {store && (
                        <div className="mb-8 p-6 bg-[#0a0c10] border border-slate-800 rounded-2xl flex items-start gap-5 animate-in fade-in slide-in-from-left-2 shadow-inner">
                            <div className="p-3 bg-brand-500/10 rounded-xl">
                                <MapPin className="text-brand-400 shrink-0" size={24} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                <div>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-2">Municipio / Alcaldía</p>
                                    <p className="text-lg font-bold text-slate-200">{storeMunicipality || 'No especificado'}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-2">Dirección de Sucursal</span>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{storeAddress || 'No especificada'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-10">
                        {/* Row 1: Description */}
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Descripción del Pago</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder={!!getTaxConfig(category) ? "Se autocompleta con la selección..." : "ej. IVA Octubre, ISLR, Factura Luz #12345"}
                                    value={specificType}
                                    readOnly={isFinancialLocked || (!!getTaxConfig(category) && !isManualOverride) || isSubmitting}
                                    onChange={(e) => setSpecificType(e.target.value)}
                                    className={`w-full bg-[#0a0c10] border ${errors.specificType ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-slate-200 text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all ${(isFinancialLocked || (!!getTaxConfig(category) && !isManualOverride)) ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                                />
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-400 transition-colors" size={20} />
                            </div>
                            {errors.specificType && <p className="text-red-400 text-[11px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.specificType}</p>}
                        </div>

                        {/* Row 2: Financial Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                            
                            {/* Column 1: Amount & Equivalent */}
                            <div className="xl:col-span-3 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Monto Total (Bs.)</label>
                                    {salesBookPayment && isPatenteScaleItem && (
                                        <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-pulse">
                                            <p className="text-[10px] font-bold text-emerald-400 leading-tight">
                                                Monto calculado del Libro de Venta: {salesBookPayment.amount <= 20 ? '$20.00 (Mínimo)' : `$${salesBookPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                            </p>
                                        </div>
                                    )}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-700 group-focus-within:text-brand-400 font-black transition-colors">Bs.</div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={amount}
                                            readOnly={isFinancialLocked && !isPatenteGroup || (!!getTaxConfig(category) && !isManualOverride && !isPatenteGroup) || isSubmitting}
                                            onChange={(e) => {
                                                setAmount(e.target.value);
                                                setUsdAmountInput(null);
                                                if (isPatenteGroup) setIsManualOverride(true);
                                            }}
                                            className={`w-full ${(isFinancialLocked && !isPatenteGroup || (!!getTaxConfig(category) && !isManualOverride && !isPatenteGroup)) ? 'bg-[#0a0c10]/60 cursor-not-allowed' : 'bg-[#0a0c10]'} border ${
                                                isOverBudget 
                                                    ? 'border-amber-500/50 ring-2 ring-amber-500/10' 
                                                    : errors.amount ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'
                                            } text-slate-200 text-base font-black rounded-xl focus:ring-4 focus:ring-brand-500/10 block pl-12 p-4 outline-none font-mono transition-all`}
                                        />
                                        {isOverBudget && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse" title="Excede Presupuesto">
                                                <AlertTriangle size={20} />
                                            </div>
                                        )}
                                    </div>
                                    {errors.amount && <p className="text-red-400 text-[11px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.amount}</p>}
                                </div>

                                {effectiveExchangeRate !== undefined && (
                                    <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl flex items-center gap-4 group/conv transition-all hover:bg-emerald-500/[0.06] overflow-hidden relative shadow-inner">
                                        <div className="p-2 bg-emerald-500/10 text-emerald-500/80 rounded-xl shrink-0">
                                            <DollarSign size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <p className="text-[11px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Equivalente en $</p>
                                                <span className="text-[9px] font-black text-slate-950 bg-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Actual</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xl">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={usdAmountInput !== null ? usdAmountInput : ((amount !== '' && !isNaN(parseFloat(amount))) ? (parseFloat(amount) / effectiveExchangeRate).toFixed(2) : '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setUsdAmountInput(val);
                                                            if (val === '') setAmount('');
                                                            else setAmount((parseFloat(val) * effectiveExchangeRate).toFixed(2));
                                                            if (isPatenteGroup) setIsManualOverride(true);
                                                        }}
                                                        onBlur={() => setUsdAmountInput(null)}
                                                        readOnly={isFinancialLocked && !isPatenteGroup || (!!getTaxConfig(category) && !isManualOverride && !isPatenteGroup) || isSubmitting}
                                                        className="w-full bg-transparent border-none text-3xl font-black text-emerald-400 tabular-nums pl-6 outline-none focus:ring-0 p-0"
                                                    />
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-600 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Column 2: Alert */}
                            <div className="xl:col-span-2">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Alerta</label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        aria-label="Alerta"
                                        readOnly={isFinancialLocked || isSubmitting}
                                        onChange={(e) => handlePaymentDateChange(e.target.value)}
                                        className={`w-full bg-[#0a0c10] border ${errors.paymentDate ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-slate-200 text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light] ${isFinancialLocked ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-400 transition-colors" size={20} aria-hidden="true" />
                                </div>
                                {errors.paymentDate && <p className="text-red-400 text-[11px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.paymentDate}</p>}
                            </div>

                            {/* Column 3: Days to Expire */}
                            <div className="xl:col-span-2">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Dias a Vencer</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={daysToExpire}
                                        readOnly={isFinancialLocked || isSubmitting}
                                        onChange={(e) => handleDaysToExpireChange(e.target.value)}
                                        className={`w-full bg-[#0a0c10] border border-slate-800 group-focus-within:border-brand-500/50 text-slate-200 text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all ${isFinancialLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-400 transition-colors" size={20} aria-hidden="true" />
                                </div>
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] mt-3 ml-1">Lapsos de vencimiento</p>
                            </div>

                            {/* Column 4: Due Date */}
                            <div className="xl:col-span-2">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Fecha de Vencimiento</label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        aria-label="Fecha de Vencimiento"
                                        readOnly={isFinancialLocked || isSubmitting}
                                        onChange={(e) => handleDueDateChange(e.target.value)}
                                        className={`w-full bg-[#0a0c10] border ${errors.dueDate ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-slate-200 text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light] ${isFinancialLocked ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-400 transition-colors" size={20} aria-hidden="true" />
                                </div>
                                {errors.dueDate && <p className="text-red-400 text-[11px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.dueDate}</p>}
                            </div>

                            {/* Column 5: Frequency */}
                            <div className="xl:col-span-3">
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Frecuencia</label>
                                <div className="relative group">
                                    <select
                                        value={frequency}
                                        aria-label="Frecuencia"
                                        disabled={isSubmitting || isFinancialLocked || (!!getTaxConfig(category) && !isManualOverride)}
                                        onChange={(e) => {
                                            const newFreq = e.target.value as PaymentFrequency;
                                            setFrequency(newFreq);
                                            if (newFreq !== PaymentFrequency.NONE) {
                                                const days = getFrequencyDays(newFreq);
                                                setDaysToExpire(days.toString());
                                            } else {
                                                setDaysToExpire('');
                                            }
                                        }}
                                        className="w-full appearance-none bg-[#0a0c10] border border-slate-800 text-slate-200 text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {Object.entries(PaymentFrequency).map(([key, value]) => (
                                            <option key={key} value={value} className="bg-slate-900">{value}</option>
                                        ))}
                                    </select>
                                    <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-400 transition-colors" size={20} aria-hidden="true" />
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} aria-hidden="true" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Soportes y Notas */}
                <section className={`glass-card p-8 transition-all duration-500 ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
                    <h2 className="label-caps mb-8 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        Soportes y Notas
                    </h2>

                    <div className="space-y-10">
                        {/* Row 1: File Upload & Support Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* File Upload */}
                            <div className="space-y-6">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Comprobante / Recibo Principal</label>
                                <label className={`relative block rounded-[2.5rem] border-2 border-dashed transition-all duration-500 overflow-hidden group cursor-pointer ${
                                    errors.file ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 hover:border-brand-500/50 bg-[#0a0c10]'
                                }`}>
                                    <div className="p-10 flex flex-col items-center justify-center min-h-[320px] relative z-10 text-center">
                                        {isFileScanning ? (
                                            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                                <div className="w-16 h-16 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                                                <p className="font-black uppercase tracking-widest text-brand-500 text-sm mb-2">Procesando Archivos...</p>
                                                <div className="w-48 h-1.5 bg-brand-500/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`p-5 rounded-2xl mb-4 transition-all duration-300 group-hover:scale-110 ${errors.file ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/10 text-brand-400'}`}>
                                                    <Upload size={32} />
                                                </div>
                                                <p className="mb-1 text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight">Cargar Comprobantes</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Seleccione uno o más (PDF, JPG, PNG)</p>
                                                
                                                {(files.length > 0 || attachments.length > 0) && (
                                                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                                                        {attachments.map((url, idx) => (
                                                            <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group/item border border-slate-800">
                                                                {url.startsWith('data:image/') || url.includes('firebasestorage') || url.includes('googleusercontent') ? (
                                                                    <img src={url} alt="Soporte" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                                        <FileText size={24} className="text-slate-600" />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeFile(idx, true)}
                                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {files.map((f, idx) => (
                                                            <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group/item border border-brand-500/20">
                                                                {f.type.startsWith('image/') ? (
                                                                    <img src={URL.createObjectURL(f)} alt="Nuevo Soporte" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-brand-500/5 flex items-center justify-center">
                                                                        <FileText size={24} className="text-brand-400" />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeFile(idx, false)}
                                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-6 px-3 py-1.5 bg-brand-500/5 dark:bg-brand-500/10 rounded-lg border border-brand-500/20">
                                                    <p className="text-[9px] text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest text-center leading-tight">
                                                        Límites: PDF e Imágenes 10MB c/u<br/>
                                                        (Multi-archivos activado)
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept=".pdf,.jpg,.jpeg,.png" 
                                        multiple
                                        onChange={handleFileChange} 
                                        disabled={isSubmitting || isFileScanning}
                                    />
                                </label>
                                {errors.file && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.file}</p>}
                            </div>

                            {/* Support Details */}
                            <div className="flex flex-col space-y-6">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Detalles del Documento</label>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre del Documento</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={docName}
                                                onChange={(e) => setDocName(e.target.value)}
                                                placeholder="Ej: Factura #123"
                                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
                                            />
                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fecha Doc.</label>
                                            <div className="relative group">
                                                <input
                                                    type="date"
                                                    value={docDate}
                                                    onChange={(e) => setDocDate(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                                />
                                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Monto Doc. (Bs.)</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-brand-400 font-black transition-colors">Bs.</div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={docAmountBsInput !== null ? docAmountBsInput : (docAmount !== '' ? (parseFloat(docAmount) * effectiveExchangeRate).toFixed(2) : '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setDocAmountBsInput(val);
                                                            if (val === '') setDocAmount('');
                                                            else setDocAmount((parseFloat(val) / effectiveExchangeRate).toFixed(2));
                                                        }}
                                                        onBlur={() => setDocAmountBsInput(null)}
                                                        placeholder="0.00"
                                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-black rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-mono"
                                                    />
                                                </div>
                                            </div>

                                            {effectiveExchangeRate !== undefined && (
                                                <div className="p-3 bg-brand-500/[0.03] border border-brand-500/20 rounded-xl flex items-center gap-3 group/conv transition-all hover:bg-brand-500/[0.06] overflow-hidden relative shadow-inner">
                                                    <div className="p-1.5 bg-brand-500/10 text-brand-500/80 rounded-lg shrink-0">
                                                        <DollarSign size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className="text-[9px] font-black text-brand-500/80 uppercase tracking-[0.2em]">Equivalente en $</p>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400 font-black text-sm">$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    value={docAmount}
                                                                    onChange={(e) => {
                                                                        setDocAmount(e.target.value);
                                                                        setDocAmountBsInput(null);
                                                                    }}
                                                                    className="w-full bg-transparent border-none text-lg font-black text-brand-600 dark:text-brand-400 tabular-nums pl-4 outline-none focus:ring-0 p-0"
                                                                />
                                                            </div>
                                                            <p className="text-[9px] font-bold text-slate-500 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Propuesta de Pago */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-8 relative overflow-hidden group/prop shadow-inner">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/prop:opacity-10 transition-opacity">
                                <RefreshCw size={60} className="text-brand-500" />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-brand-500/20 rounded-xl text-brand-400 shadow-lg shadow-brand-500/10">
                                        <RefreshCw size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Propuesta de Pago</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Sugerencia de cambios para revisión del auditor</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                                {/* Column 1: Proposed Amount & Equivalent */}
                                <div className="xl:col-span-3 space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Monto Total (Bs.)</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-brand-400 font-black transition-colors">Bs.</div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={proposedAmountBsInput !== null ? proposedAmountBsInput : (proposedAmount !== undefined ? (proposedAmount * effectiveExchangeRate).toFixed(2) : '')}
                                                onChange={(e) => {
                                                    setIsProposedEdited(true);
                                                    const val = e.target.value;
                                                    setProposedAmountBsInput(val);
                                                    if (val === '') setProposedAmount(undefined);
                                                    else setProposedAmount(parseFloat((parseFloat(val) / effectiveExchangeRate).toFixed(2)));
                                                }}
                                                onBlur={() => setProposedAmountBsInput(null)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-base font-black rounded-xl focus:ring-4 focus:ring-brand-500/10 block pl-12 p-4 outline-none font-mono transition-all"
                                            />
                                        </div>
                                    </div>

                                    {effectiveExchangeRate !== undefined && (
                                        <div className="p-4 bg-brand-500/[0.03] border border-brand-500/20 rounded-2xl flex items-center gap-4 group/conv transition-all hover:bg-brand-500/[0.06] overflow-hidden relative shadow-inner">
                                            <div className="p-2 bg-brand-500/10 text-brand-500/80 rounded-xl shrink-0">
                                                <DollarSign size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <p className="text-[11px] font-black text-brand-500/80 uppercase tracking-[0.2em]">Equivalente en $</p>
                                                    <span className="text-[9px] font-black text-slate-950 bg-brand-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Propuesto</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-400 font-black text-xl">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={proposedAmount || ''}
                                                            onChange={(e) => {
                                                                setIsProposedEdited(true);
                                                                setProposedAmount(e.target.value ? parseFloat(e.target.value) : undefined);
                                                                setProposedAmountBsInput(null);
                                                            }}
                                                            className="w-full bg-transparent border-none text-3xl font-black text-brand-600 dark:text-brand-400 tabular-nums pl-6 outline-none focus:ring-0 p-0"
                                                        />
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Column 2: Proposed Alert */}
                                <div className="xl:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Alerta</label>
                                    <div className="relative group">
                                        <input
                                            type="date"
                                            value={proposedPaymentDate || ''}
                                            onChange={(e) => handleProposedPaymentDateChange(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                        />
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    </div>
                                </div>

                                {/* Column 3: Proposed Days to Expire */}
                                <div className="xl:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Dias a Vencer</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={proposedDaysToExpire ?? ''}
                                            onChange={(e) => handleProposedDaysToExpireChange(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all"
                                        />
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mt-3 ml-1">Lapsos de vencimiento</p>
                                </div>

                                {/* Column 4: Proposed Due Date */}
                                <div className="xl:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Fecha de Vencimiento</label>
                                    <div className="relative group">
                                        <input
                                            type="date"
                                            value={proposedDueDate || ''}
                                            onChange={(e) => handleProposedDueDateChange(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                        />
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    </div>
                                </div>

                                {/* Column 5: Proposed Frequency */}
                                <div className="xl:col-span-3">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Frecuencia</label>
                                    <div className="relative group">
                                        <select
                                            value={proposedFrequency}
                                            onChange={(e) => {
                                                setIsProposedEdited(true);
                                                const newFreq = e.target.value as PaymentFrequency;
                                                setProposedFrequency(newFreq);
                                                if (newFreq !== PaymentFrequency.NONE) {
                                                    const days = getFrequencyDays(newFreq);
                                                    setProposedDaysToExpire(days);
                                                    if (proposedDueDate) {
                                                        const d = new Date(proposedDueDate);
                                                        d.setDate(d.getDate() + days);
                                                        setProposedPaymentDate(d.toISOString().split('T')[0]);
                                                    }
                                                } else {
                                                    setProposedDaysToExpire(undefined);
                                                }
                                            }}
                                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-base font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none cursor-pointer"
                                        >
                                            {Object.entries(PaymentFrequency).map(([key, value]) => (
                                                <option key={key} value={value} className="bg-slate-900">{value}</option>
                                            ))}
                                        </select>
                                        <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" size={20} />
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Map & Observaciones */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Map */}
                            <div className="glass-card p-6 border-brand-500/20 bg-slate-950/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                        <MapPin size={18} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Cobertura Nacional</h3>
                                </div>
                                <VenezuelaMap 
                                    stores={dynamicStores} 
                                    selectedStoreIds={store && store !== 'NATIONAL' ? [store] : []} 
                                    onStoreClick={(id) => setStore(id)}
                                />
                            </div>

                            {/* Observaciones */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Observaciones / Notas</label>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${notes.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {notes.length} / 500
                                    </span>
                                </div>
                                <div className="relative flex-1 group">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        maxLength={500}
                                        disabled={isSubmitting}
                                        placeholder="Añada notas adicionales para el auditor..."
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-slate-200 text-sm font-medium rounded-2xl p-5 outline-none focus:ring-4 focus:ring-brand-500/10 h-full min-h-[300px] resize-none transition-all disabled:opacity-50 leading-relaxed"
                                    ></textarea>
                                    <div className="absolute bottom-4 right-4 text-slate-600 group-focus-within:text-brand-500/50 transition-colors">
                                        <MessageSquare size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-4 p-5 bg-red-500/5 text-red-400 rounded-2xl border border-red-500/20 animate-in slide-in-from-bottom-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle size={20} className="shrink-0" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Hay campos requeridos incompletos o errores. Por favor revise el formulario.</span>
            </div>
        )}

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/50 flex flex-col-reverse md:flex-row gap-6">
            {!isEmbedded && (
                <button 
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-10 py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 hover:text-slate-900 dark:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    Cancelar
                </button>
            )}
            <button 
                type="submit"
                disabled={isSubmitting || isFileScanning}
                className={`w-full md:flex-1 relative overflow-hidden group/submit ${
                    isOverBudget 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
                } text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm py-5 rounded-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isSubmitting || isFileScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000"></div>
                
                {isSubmitting ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{loadingText || 'Procesando...'}</span>
                    </>
                ) : isFileScanning ? (
                    <>
                         <Loader2 size={20} className="animate-spin" />
                         <span>Escaneando...</span>
                    </>
                ) : (
                    <>
                        <span>{initialData?.status === PaymentStatus.REJECTED ? 'Reenviar Corrección' : 'Enviar a Auditoría'}</span>
                        <CheckCircle2 size={20} className="group-hover/submit:scale-110 transition-transform" />
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};
