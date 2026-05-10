
import { Payment, PaymentStatus, Category, Store, BudgetEntry } from './types';
import { getTaxConfig } from './taxConfigurations';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { FISCAL_CALENDAR_2026 } from './constants/fiscalCalendar';

export type TrafficLightStatus = 'red' | 'green' | 'amber' | 'slate';

export interface FiscalStatusResult {
  status: TrafficLightStatus;
  label: string;
  colorClass: string;
  textClass: string;
  bgSoftClass: string;
}

export const getFiscalDueDate = (category: Category, itemCode: string, rifEnding: number, date: Date = new Date()) => {
  const monthIdx = date.getMonth(); // 0-11
  
  // Logic for SPE (Sujetos Pasivos Especiales) - IVA and Biweekly Retentions
  // These usually have prefixes starting with 7.3-7.6 or 7.8 (Biweekly SENIAT)
  const isBiweekly = itemCode.startsWith('7.3') || 
                     itemCode.startsWith('7.4') || 
                     itemCode.startsWith('7.5') || 
                     itemCode.startsWith('7.8') || // IGTF
                     itemCode.startsWith('2.1'); // Legacy check

  if (isBiweekly) {
    const day = date.getDate();
    const table = day <= 15 ? FISCAL_CALENDAR_2026.firstHalf : FISCAL_CALENDAR_2026.secondHalf;
    const rifDates = table[rifEnding as unknown as keyof typeof table];
    const targetDay = rifDates[monthIdx];
    
    if (day <= 15) {
      // For 1-15 period, payment is usually late in the same month
      return new Date(date.getFullYear(), monthIdx, targetDay);
    } else {
      // For 16-EOH, payment is early in NEXT month
      // Note: Table a.2 Jan value is for Dec second half.
      const nextMonthDate = new Date(date.getFullYear(), monthIdx + 1, 1);
      const nextMonthIdx = nextMonthDate.getMonth();
      const nextMonthRifDates = FISCAL_CALENDAR_2026.secondHalf[rifEnding as keyof typeof FISCAL_CALENDAR_2026.secondHalf];
      const nextTargetDay = nextMonthRifDates[nextMonthIdx];
      
      // If we are calculating for 16-31 Jan, we look at table a.2 for FEB.
      return new Date(nextMonthDate.getFullYear(), nextMonthIdx, nextTargetDay || 5);
    }
  }

  // Pensions logic (New code 7.10)
  if (itemCode.startsWith('7.10') || itemCode.startsWith('7.8')) {
    const rifDates = FISCAL_CALENDAR_2026.pensiones[rifEnding as keyof typeof FISCAL_CALENDAR_2026.pensiones];
    return new Date(date.getFullYear(), monthIdx, rifDates[monthIdx]);
  }

  // Default fallback for items not in Gaceta explicitly or handled by standard deadlines
  return null;
};

export const getTaxStatus = (deadlineDay: number, category?: Category, itemCode?: string, store?: Store) => {
  const today = new Date();
  const currentDay = today.getDate();
  
  let targetDueDate: Date | null = null;
  if (category && itemCode && store && store.rifEnding !== undefined) {
    targetDueDate = getFiscalDueDate(category, itemCode, store.rifEnding, today);
  }

  if (targetDueDate) {
    const diffTime = targetDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'Vencido', 
        color: 'bg-red-500', 
        text: 'text-red-600', 
        bgSoft: 'bg-red-100',
        icon: AlertCircle
      };
    } else if (diffDays <= 5) {
      return { 
        status: 'Próximo', 
        color: 'bg-amber-500', 
        text: 'text-amber-600', 
        bgSoft: 'bg-amber-100',
        icon: Clock
      };
    } else {
      return { 
        status: 'En fecha', 
        color: 'bg-emerald-500', 
        text: 'text-emerald-600', 
        bgSoft: 'bg-emerald-100',
        icon: CheckCircle2
      };
    }
  }

  // Old logic for static deadlineDay
  if (currentDay > deadlineDay) {
    return { 
      status: 'Vencido', 
      color: 'bg-red-500', 
      text: 'text-red-600', 
      bgSoft: 'bg-red-100',
      icon: AlertCircle
    };
  } else if (deadlineDay - currentDay <= 5) {
    return { 
      status: 'Próximo', 
      color: 'bg-amber-500', 
      text: 'text-amber-600', 
      bgSoft: 'bg-amber-100',
      icon: Clock
    };
  } else {
    return { 
      status: 'En fecha', 
      color: 'bg-emerald-500', 
      text: 'text-emerald-600', 
      bgSoft: 'bg-emerald-100',
      icon: CheckCircle2
    };
  }
};

/**
 * Determina el estado del semáforo para una categoría fiscal específica en una tienda.
 * Reglas actualizadas:
 * 1. Prioridad: Rojo > Naranja > Verde.
 * 2. El Rojo se activa por pagos RECHAZADOS/VENCIDOS o por calendario VENCIDO.
 * 3. El Naranja se activa por pagos PENDIENTES/CARGADOS o por calendario PRÓXIMO.
 * 4. El Verde es el estado por defecto para conceptos al día o satisfechos (APROBADO/PAGADO).
 * 5. Si no hay actividad para un concepto, se muestra en VERDE a menos que el calendario indique lo contrario.
 */
export const getCategoryTrafficLight = (
  category: Category, 
  storeId: string, 
  payments: Payment[],
  budgets: BudgetEntry[] = [],
  store?: Store
): TrafficLightStatus => {
  if (!storeId) return 'slate';

  const configMap = getTaxConfig(category);
  if (!configMap) return 'green';
  
  let hasRed = false;
  let hasAmber = false;

  // Iterar por todos los grupos y conceptos definidos en la configuración fiscal
  Object.values(configMap).forEach(groupConfig => {
    groupConfig.items.forEach(item => {
      // 1. Estado base desde el calendario
      const calendarStatus = getTaxStatus(groupConfig.deadlineDay, category, item.code, store);
      let itemStatus: TrafficLightStatus = 'green';
      
      if (calendarStatus.status === 'Vencido') {
        itemStatus = 'red';
      } else if (calendarStatus.status === 'Próximo') {
        itemStatus = 'amber';
      }
      
      // 2. Refinar estado con movimientos (pagos)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const itemPayments = payments.filter(p => {
        const pDate = new Date(p.dueDate);
        return p.storeId === storeId && 
               p.category === category && 
               p.specificType.startsWith(item.code) &&
               pDate.getMonth() === currentMonth &&
               pDate.getFullYear() === currentYear;
      });

      // Budget Exceedance Logic for Variable Items
      const totalPaid = itemPayments
          .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const assignedBudget = budgets.find(b => 
          b.storeId === storeId && 
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
        itemStatus = 'red';
      }

      if (itemPayments.length > 0) {
        // La aprobación o pago tiene prioridad absoluta: si está satisfecho, el estado es verde
        const hasPaymentGreen = itemPayments.some(p => 
          p.status === PaymentStatus.APPROVED || 
          p.status === PaymentStatus.PAID
        );
        
        if (hasPaymentGreen && !isBudgetExceeded) {
          itemStatus = 'green';
        } else if (!isBudgetExceeded) {
          // Prioridad para pagos no satisfechos: Rojo > Ambar
          const hasPaymentRed = itemPayments.some(p => 
            p.status === PaymentStatus.REJECTED || 
            p.status === PaymentStatus.OVERDUE
          );
          
          if (hasPaymentRed) {
            itemStatus = 'red';
          } else {
            const hasPaymentAmber = itemPayments.some(p => 
              p.status === PaymentStatus.PENDING || 
              p.status === PaymentStatus.UPLOADED
            );
            
            if (hasPaymentAmber) {
              itemStatus = 'amber';
            }
          }
        }
      }

      // 3. Aplicar prevalencia a nivel de categoría
      if (itemStatus === 'red') hasRed = true;
      if (itemStatus === 'amber') hasAmber = true;
    });
  });

  // Prevalencia Final de Categoría
  if (hasRed) return 'red';
  if (hasAmber) return 'amber';
  return 'green';
};

/**
 * Obtiene el estado general de salud fiscal de una tienda.
 */
export const getStoreFiscalHealth = (
  storeId: string, 
  payments: Payment[], 
  budgets: BudgetEntry[] = [],
  store?: Store
): TrafficLightStatus => {
  const categories = Object.values(Category);
  let hasRed = false;
  let allGreen = true;
  let hasPayments = false;

  categories.forEach(cat => {
    const status = getCategoryTrafficLight(cat, storeId, payments, budgets, store);
    if (status === 'red') hasRed = true;
    if (status !== 'green' && status !== 'slate') allGreen = false;
    if (status !== 'slate') hasPayments = true;
  });

  if (!hasPayments) return 'slate';
  if (hasRed) return 'red';
  if (allGreen) return 'green';
  return 'amber';
};
