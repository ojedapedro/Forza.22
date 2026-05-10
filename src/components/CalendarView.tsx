
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Calendar,
  CheckCircle2, 
  Clock,
  Landmark, 
  AlertOctagon,
  FileText,
  Target,
  X,
  DollarSign,
  Tag,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Payment, PaymentStatus, Category, PayrollEntry, BudgetEntry, User, Role, Store } from '../types';
import { formatDate } from '../utils';
import { ConfirmationModal } from './ConfirmationModal';

interface CalendarViewProps {
  payments: Payment[];
  payrollEntries?: PayrollEntry[];
  budgets: BudgetEntry[];
  onAddBudget: (budget: BudgetEntry) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onUpdatePayment?: (id: string) => Promise<void>;
  currentUser: User | null;
  stores: Store[];
}

// Definición de Obligación Estatutaria (Basada en el cuadro)
interface StatutoryDeadline {
  id: string;
  day: number | 'end'; // Día específico o fin de mes
  month?: number; // Si es anual, el índice del mes (0 = Enero)
  title: string;
  category: Category;
  description: string;
  frequency: 'Mensual' | 'Anual' | 'Bi-anual';
}

// Definición de Entrada de Presupuesto Manual
// Eliminado: Usando BudgetEntry de types.ts

// Configuración de Reglas Fiscales (Alcaldía)
const TAX_RULES: StatutoryDeadline[] = [
  {
    id: 'rule-decl-patente',
    day: 5,
    title: 'Límite Declaración Ventas',
    category: Category.MUNICIPAL_TAX,
    description: 'Declarar antes del 5to día (Patente 1.1.2 - 1.1.7)',
    frequency: 'Mensual'
  },
  {
    id: 'rule-pago-patente',
    day: 19,
    title: 'Vencimiento Pago Patente',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago mensual códigos 1.1.2 al 1.1.7',
    frequency: 'Mensual'
  },
  {
    id: 'rule-aseo',
    day: 'end', // Fin de mes
    title: 'IMA Aseo Urbano (1.3)',
    category: Category.UTILITY,
    description: 'Pago mensual tarifa aseo',
    frequency: 'Mensual'
  },
  // Anuales (Asumiremos Marzo como mes fiscal común para anuales, ajustable)
  {
    id: 'rule-anual-visto-bueno',
    day: 31,
    month: 2, // Marzo
    title: 'Visto Bueno (1.2) & Bomberos (1.7)',
    category: Category.MUNICIPAL_TAX,
    description: 'Renovación anual de permisos y tasas',
    frequency: 'Anual'
  },
  {
    id: 'rule-anual-inmueble',
    day: 31,
    month: 2, // Marzo
    title: 'Impuesto Inmobiliario (1.5)',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago anual impuesto inmueble',
    frequency: 'Anual'
  },
  {
    id: 'rule-anual-pub',
    day: 31,
    month: 2, // Marzo
    title: 'Publicidad (1.6)',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago anual derechos publicidad',
    frequency: 'Anual'
  }
];

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  payments, 
  payrollEntries = [], 
  budgets, 
  onAddBudget, 
  onDeleteBudget,
  onUpdatePayment,
  currentUser,
  stores
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'fiscal' | 'payroll'>('fiscal');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    currentUser?.storeIds && currentUser.storeIds.length > 0 
      ? currentUser.storeIds[0] 
      : (stores.length > 0 ? stores[0].id : 'all')
  );
  
  // Filtrar presupuestos por tienda seleccionada
  const filteredBudgets = useMemo(() => {
    if (selectedStoreId === 'all') return budgets;
    return budgets.filter(b => b.storeId === selectedStoreId);
  }, [budgets, selectedStoreId]);

  // Filtrar pagos por tienda seleccionada
  const filteredPayments = useMemo(() => {
    if (selectedStoreId === 'all') return payments;
    return payments.filter(p => p.storeId === selectedStoreId);
  }, [payments, selectedStoreId]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAnnualAssistantOpen, setIsAnnualAssistantOpen] = useState(false);
  
  // Estado para el asistente anual
  const [annualBudgetForm, setAnnualBudgetForm] = useState<{
    year: number;
    category: Category;
    amounts: number[];
  }>({
    year: new Date().getFullYear(),
    category: Category.MUNICIPAL_TAX,
    amounts: Array(12).fill(0)
  });
  
  // Formulario de presupuesto
  const [newBudget, setNewBudget] = useState<{
    title: string;
    amount: string;
    category: Category;
  }>({ title: '', amount: '', category: Category.MUNICIPAL_TAX });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });

  // Estado combinado para la vista lateral
  const [dayEvents, setDayEvents] = useState<{
    realPayments: Payment[];
    deadlines: (StatutoryDeadline & { amount?: number })[];
    budgets: BudgetEntry[];
  }>({ realPayments: [], deadlines: [], budgets: [] });

  // Helpers de Fecha
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  // Navegación
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Obtener obligaciones para un día específico
  const getDeadlinesForDate = (date: Date): (StatutoryDeadline & { amount?: number })[] => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const lastDayOfMonth = getDaysInMonth(date);

    // Reglas estáticas
    const staticDeadlines = TAX_RULES.filter(rule => {
      if (rule.month !== undefined && rule.month !== month) return false;
      if (rule.day === 'end') return day === lastDayOfMonth;
      return rule.day === day;
    });

    // Obligaciones dinámicas de nómina (del mes anterior)
    const dynamicDeadlines: (StatutoryDeadline & { amount?: number })[] = [];
    
    // El mes anterior en formato YYYY-MM
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Filtrar nóminas del mes anterior
    const prevMonthPayroll = payrollEntries.filter(e => e.month === prevMonthStr);
    
    if (prevMonthPayroll.length > 0) {
      // Sumar pasivos
      let ssoTotal = 0;
      let lphTotal = 0;
      let incesTotal = 0;
      
      prevMonthPayroll.forEach(entry => {
        entry.employerLiabilities.forEach(l => {
          const name = l.name.toLowerCase();
          if (name.includes('sso') || name.includes('seguro social')) ssoTotal += l.amount;
          else if (name.includes('lph') || name.includes('vivienda')) lphTotal += l.amount;
          else if (name.includes('inces')) incesTotal += l.amount;
        });
      });

      if (ssoTotal > 0 && day === 15) {
        dynamicDeadlines.push({
          id: `dyn-sso-${prevMonthStr}`,
          day: 15,
          title: 'Aporte Patronal SSO',
          category: Category.PAYROLL,
          description: `Pago Seguro Social correspondiente a ${prevMonthStr}`,
          frequency: 'Mensual',
          amount: ssoTotal
        });
      }
      
      if (lphTotal > 0 && day === 10) {
        dynamicDeadlines.push({
          id: `dyn-lph-${prevMonthStr}`,
          day: 10,
          title: 'Aporte Patronal LPH',
          category: Category.PAYROLL,
          description: `Pago Ley de Política Habitacional correspondiente a ${prevMonthStr}`,
          frequency: 'Mensual',
          amount: lphTotal
        });
      }
      
      if (incesTotal > 0 && day === 10) {
        dynamicDeadlines.push({
          id: `dyn-inces-${prevMonthStr}`,
          day: 10,
          title: 'Aporte Patronal INCES',
          category: Category.PAYROLL,
          description: `Pago INCES correspondiente a ${prevMonthStr}`,
          frequency: 'Mensual',
          amount: incesTotal
        });
      }
    }

    return [...staticDeadlines, ...dynamicDeadlines];
  };

  // Efecto para actualizar el panel lateral al cambiar fecha
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const real = filteredPayments.filter(p => p.dueDate === localDateString);
    const statutory = getDeadlinesForDate(selectedDate);
    const dayBudgets = filteredBudgets.filter(b => b.date === localDateString);

    setDayEvents({ realPayments: real, deadlines: statutory, budgets: dayBudgets });
  }, [selectedDate, filteredPayments, filteredBudgets]);

  // Cálculo de resumen mensual para comparación de presupuesto
  const monthlyComparison = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Filtrar pagos ejecutados (aprobados o pagados) del mes actual
    const executedPayments = filteredPayments.filter(p => {
      const pDate = new Date(p.paymentDate || p.dueDate);
      return pDate.getFullYear() === year && 
             pDate.getMonth() === month && 
             (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
    });

    // Filtrar presupuestos del mes actual
    const monthBudgets = filteredBudgets.filter(b => {
      const bDate = new Date(b.date);
      return bDate.getFullYear() === year && bDate.getMonth() === month;
    });

    // Agrupar por categoría
    const categories = Object.values(Category);
    return categories.map(cat => {
      const spent = executedPayments
        .filter(p => p.category === cat)
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      const budget = monthBudgets
        .filter(b => b.category === cat)
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      return {
        category: cat,
        spent,
        budget,
        isOver: spent > budget && budget > 0
      };
    }).filter(item => item.spent > 0 || item.budget > 0);
  }, [currentDate, filteredPayments, filteredBudgets]);

  // Manejo de creación de presupuesto
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.title || !newBudget.amount) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const entry: BudgetEntry = {
        id: `BUD-${Math.random().toString(36).substr(2, 9)}`,
        storeId: selectedStoreId,
        date: dateStr,
        title: newBudget.title,
        amount: parseFloat(newBudget.amount),
        category: newBudget.category
    };

    await onAddBudget(entry);
    setIsBudgetModalOpen(false);
    setNewBudget({ title: '', amount: '', category: Category.MUNICIPAL_TAX }); // Reset
  };

  const handleSaveAnnualBudget = async () => {
    const entries: BudgetEntry[] = [];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    for (let i = 0; i < 12; i++) {
      if (annualBudgetForm.amounts[i] > 0) {
        const dateStr = `${annualBudgetForm.year}-${String(i + 1).padStart(2, '0')}-01`;
        entries.push({
          id: `BUD-ANNUAL-${Math.random().toString(36).substr(2, 9)}`,
          storeId: selectedStoreId,
          date: dateStr,
          title: `Presupuesto Anual: ${months[i]}`,
          amount: annualBudgetForm.amounts[i],
          category: annualBudgetForm.category
        });
      }
    }

    // Guardar todos secuencialmente
    for (const entry of entries) {
      await onAddBudget(entry);
    }

    setIsAnnualAssistantOpen(false);
    setAnnualBudgetForm({ ...annualBudgetForm, amounts: Array(12).fill(0) });
  };

  const handleDeleteBudget = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar presupuesto?',
      message: '¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer.',
      onConfirm: () => onDeleteBudget(id)
    });
  };

  // Generación de Grid
  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Padding para días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-transparent border-b border-r border-slate-100 dark:border-slate-800/50"></div>);
    }

    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayString = `${currentDayDate.getFullYear()}-${String(currentDayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const monthStr = `${currentDayDate.getFullYear()}-${String(currentDayDate.getMonth() + 1).padStart(2, '0')}`;
      const lastDay = getDaysInMonth(currentDayDate);
      
      const isSelected = selectedDate.toDateString() === currentDayDate.toDateString();
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      
      // Buscar datos
      const dayPayments = filteredPayments.filter(p => p.dueDate === dayString);
      const dayDeadlines = getDeadlinesForDate(currentDayDate);
      const dayBudgets = filteredBudgets.filter(b => b.date === dayString);
      
      const hasOverdue = dayPayments.some(p => p.status === PaymentStatus.OVERDUE);
      const hasPending = dayPayments.some(p => p.status === PaymentStatus.PENDING);
      const hasActivity = dayPayments.length > 0 || dayDeadlines.length > 0 || dayBudgets.length > 0;

      // Datos de Nómina
      const isPayrollDay = day === 15 || day === lastDay;
      const monthPayroll = payrollEntries.filter(e => e.month === monthStr);
      const payrollStatus = monthPayroll.length > 0 
        ? (monthPayroll.every(e => e.status === 'PROCESADO') ? 'PROCESADO' : 'PENDIENTE')
        : 'PENDIENTE';
      
      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDate(currentDayDate)}
          className={`relative h-24 sm:h-28 border-b border-r border-slate-100 dark:border-slate-800 p-2 transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col justify-between ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : (hasActivity ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800')
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              isToday 
              ? 'bg-blue-600 text-white' 
              : isSelected 
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/50' 
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {day}
            </span>
          </div>

          {/* Indicadores Visuales */}
          <div className="flex flex-col gap-1 mt-1">
            {viewMode === 'fiscal' ? (
              <>
                {/* Indicadores de Pagos Reales & Presupuestos */}
                <div className="flex gap-1 flex-wrap">
                    {hasOverdue && <div className="w-2 h-2 rounded-full bg-red-500" title="Pago Vencido"></div>}
                    {hasPending && <div className="w-2 h-2 rounded-full bg-orange-400" title="Pago Pendiente"></div>}
                    {dayPayments.some(p => p.status === PaymentStatus.PAID) && 
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Pago Realizado"></div>
                    }
                    {dayPayments.some(p => p.status === PaymentStatus.APPROVED) && !dayPayments.some(p => p.status === PaymentStatus.PAID) && !hasOverdue && !hasPending && 
                        <div className="w-2 h-2 rounded-full bg-blue-500" title="Aprobado"></div>
                    }
                    {dayBudgets.length > 0 && <div className="w-2 h-2 rounded-full bg-cyan-400" title="Presupuesto Asignado"></div>}
                </div>

                {/* Indicadores de Reglas Fiscales (Alcaldía y Nómina) */}
                {dayDeadlines.map((rule, idx) => (
                    <div key={idx} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border flex items-center gap-1 ${
                      rule.category === Category.PAYROLL 
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
                    }`}>
                        <Landmark size={8} />
                        {rule.title}
                    </div>
                ))}
                
                {/* Texto de presupuesto si existe y no hay reglas que ocupen espacio */}
                {dayBudgets.length > 0 && dayDeadlines.length === 0 && (
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate font-medium px-1">
                        ${dayBudgets.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} (P)
                    </div>
                )}
              </>
            ) : (
              /* Vista de Nómina */
              <>
                {isPayrollDay && (
                  <div className={`text-[10px] px-1.5 py-1 rounded font-bold border flex items-center gap-1 ${
                    payrollStatus === 'PROCESADO'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50'
                  }`}>
                    {payrollStatus === 'PROCESADO' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {day === 15 ? '1ra Qna' : '2da Qna'}
                  </div>
                )}
                {monthPayroll.length > 0 && isPayrollDay && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 px-1">
                    ${(monthPayroll.reduce((acc, curr) => acc + curr.totalWorkerNet, 0) / 2).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const totalAmountForDay = dayEvents.realPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBudgetForDay = dayEvents.budgets.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="absolute top-4 right-4 z-20">
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          disabled={!!currentUser?.storeIds && currentUser.storeIds.length === 1}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {(!currentUser?.storeIds || currentUser.storeIds.length === 0) && <option value="all">Todas las Tiendas</option>}
          {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>
      
      {/* Modal Asistente Anual */}
      <AnimatePresence>
        {isAnnualAssistantOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20"
            >
              {/* Header Refinado */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-gradient-to-br from-cyan-600 to-blue-700 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Asistente de Presupuesto Anual</h2>
                  </div>
                  <p className="text-cyan-100/80 text-lg font-medium">Proyección estratégica para el ciclo fiscal {annualBudgetForm.year}</p>
                </div>
                
                <button 
                  onClick={() => setIsAnnualAssistantOpen(false)} 
                  className="relative z-10 p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                >
                  <X size={28} />
                </button>

                {/* Decoración de fondo */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl"></div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                  {/* Configuración General */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Tag size={16} /> Configuración de Partida
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">CATEGORÍA FISCAL</label>
                          <select 
                            value={annualBudgetForm.category}
                            onChange={(e) => setAnnualBudgetForm({...annualBudgetForm, category: e.target.value as Category})}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-cyan-500 dark:text-white rounded-2xl outline-none transition-all font-bold"
                          >
                            {Object.values(Category).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">ACCIÓN RÁPIDA (REPETIR MONTO)</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input 
                                type="number" 
                                placeholder="Monto mensual..."
                                className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-cyan-500 dark:text-white rounded-2xl outline-none transition-all font-mono font-bold"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(val)) {
                                      setAnnualBudgetForm({...annualBudgetForm, amounts: Array(12).fill(val)});
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const input = document.querySelector('input[placeholder="Monto mensual..."]') as HTMLInputElement;
                                const val = parseFloat(input.value);
                                if (!isNaN(val)) {
                                  setAnnualBudgetForm({...annualBudgetForm, amounts: Array(12).fill(val)});
                                  input.value = '';
                                }
                              }}
                              className="px-6 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 transition-all active:scale-95 shadow-lg shadow-cyan-200 dark:shadow-none"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Proyección */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">Resumen Anual Proyectado</h3>
                      <div className="space-y-6">
                        <div>
                          <p className="text-slate-400 text-xs font-bold mb-1">TOTAL AÑO {annualBudgetForm.year}</p>
                          <p className="text-4xl font-black tracking-tighter">
                            <span className="text-cyan-500 mr-1">$</span>
                            {annualBudgetForm.amounts.reduce((a, b) => a + b, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">COBERTURA MENSUAL</span>
                            <span className="text-cyan-400">{annualBudgetForm.amounts.filter(a => a > 0).length} / 12 MESES</span>
                          </div>
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(annualBudgetForm.amounts.filter(a => a > 0).length / 12) * 100}%` }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => setAnnualBudgetForm({...annualBudgetForm, amounts: Array(12).fill(0)})}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Limpiar Todo
                        </button>
                      </div>
                    </div>
                    {/* Decoración */}
                    <DollarSign size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                  ].map((month, idx) => (
                    <motion.div 
                      key={month} 
                      whileHover={{ y: -5 }}
                      className={`p-6 rounded-[2rem] border-2 transition-all ${
                        annualBudgetForm.amounts[idx] > 0 
                        ? 'bg-white dark:bg-slate-900 border-cyan-500/30 shadow-xl shadow-cyan-500/5' 
                        : 'bg-white/50 dark:bg-slate-900/50 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-xs font-black uppercase tracking-widest ${annualBudgetForm.amounts[idx] > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                          {month}
                        </span>
                        {annualBudgetForm.amounts[idx] > 0 && (
                          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={annualBudgetForm.amounts[idx] || ''}
                          onChange={(e) => {
                            const newAmounts = [...annualBudgetForm.amounts];
                            newAmounts[idx] = parseFloat(e.target.value) || 0;
                            setAnnualBudgetForm({...annualBudgetForm, amounts: newAmounts});
                          }}
                          className="w-full pl-6 pr-0 py-2 bg-transparent border-none outline-none text-2xl font-black text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 font-mono"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">Se crearán registros individuales para cada mes con monto mayor a cero.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsAnnualAssistantOpen(false)}
                    className="flex-1 sm:flex-none px-8 py-4 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveAnnualBudget}
                    disabled={annualBudgetForm.amounts.every(a => a === 0)}
                    className="flex-1 sm:flex-none px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={22} />
                    Confirmar Proyección
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Modal */}
      {isBudgetModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Target className="text-cyan-500" />
                          Nuevo Presupuesto
                      </h3>
                      <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddBudget} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Fecha Seleccionada</label>
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium flex items-center gap-2">
                              <CalendarIcon size={16} />
                              {formatDate(selectedDate)}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                          <div className="relative">
                            <select 
                                value={newBudget.category}
                                onChange={(e) => setNewBudget({...newBudget, category: e.target.value as Category})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white appearance-none"
                            >
                                {Object.values(Category).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <Tag className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Concepto / Título</label>
                          <input 
                              type="text" 
                              placeholder="Ej. Provisión Impuesto ISLR"
                              value={newBudget.title}
                              onChange={(e) => setNewBudget({...newBudget, title: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
                              autoFocus
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Monto Estimado</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  placeholder="0.00"
                                  value={newBudget.amount}
                                  onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
                              />
                              <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                          <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Calendar Grid Section */}
      <div className="flex-1 p-4 lg:p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario Fiscal</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Cronograma de obligaciones, pagos y presupuestos.</p>
            </div>
            
            {/* Toggle de Vista */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('fiscal')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'fiscal' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Fiscal
              </button>
              <button 
                onClick={() => setViewMode('payroll')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'payroll' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Nómina
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-lg min-w-[140px] text-center text-slate-800 dark:text-white capitalize">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Calendar Grid Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            {daysOfWeek.map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
                {d}
                </div>
            ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1">
            {renderCalendarDays()}
            </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 px-2">
            {viewMode === 'fiscal' ? (
              <>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Pago Vencido</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Pago Pendiente</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Pago Realizado</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Pago Aprobado</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Obligación Alcaldía</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Obligación Nómina</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Presupuesto</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Nómina Procesada</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Nómina Pendiente</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Fecha de Pago (Quincena)</div>
              </>
            )}
        </div>
      </div>

      {/* Details Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-xl z-10 h-[500px] lg:h-auto overflow-hidden">
        <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-500" />
                {formatDate(selectedDate)}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {dayEvents.realPayments.length + dayEvents.deadlines.length + dayEvents.budgets.length} Eventos para hoy
            </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            
            {/* Sección de Nómina (Solo en vista Nómina) */}
            {viewMode === 'payroll' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={12} /> Detalle de Nómina
                </h3>
                {(() => {
                  const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
                  const monthPayroll = payrollEntries.filter(e => e.month === monthStr);
                  const isPayrollDay = selectedDate.getDate() === 15 || selectedDate.getDate() === getDaysInMonth(selectedDate);
                  
                  if (!isPayrollDay && monthPayroll.length === 0) return <p className="text-xs text-slate-400 italic">No hay eventos de nómina para este día.</p>;

                  return (
                    <div className="space-y-3">
                      {isPayrollDay && (
                        <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
                              {selectedDate.getDate() === 15 ? '1ra Quincena' : '2da Quincena'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              monthPayroll.length > 0 && monthPayroll.every(e => e.status === 'PROCESADO')
                                ? 'bg-green-200 text-green-800'
                                : 'bg-orange-200 text-orange-800'
                            }`}>
                              {monthPayroll.length > 0 && monthPayroll.every(e => e.status === 'PROCESADO') ? 'PROCESADO' : 'PENDIENTE'}
                            </span>
                          </div>
                          <div className="text-2xl font-black text-slate-800 dark:text-white">
                            ${(monthPayroll.reduce((acc, curr) => acc + curr.totalWorkerNet, 0) / 2).toLocaleString()}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Monto estimado para {monthPayroll.length} trabajadores</p>
                        </div>
                      )}

                      {monthPayroll.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Trabajadores en Nómina</span>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {monthPayroll.map(emp => (
                              <div key={emp.id} className="p-3 border-b border-slate-50 dark:border-slate-800 last:border-0 flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{emp.employeeName}</p>
                                  <p className="text-[9px] text-slate-400">{emp.employeeId}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-800 dark:text-white">${(emp.totalWorkerNet / 2).toLocaleString()}</p>
                                  <p className={`text-[8px] font-bold ${emp.status === 'PROCESADO' ? 'text-green-500' : 'text-orange-500'}`}>{emp.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Sección de Resumen de Presupuesto Mensual */}
            {monthlyComparison.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <TrendingUp size={12} /> Resumen de Presupuesto ({months[currentDate.getMonth()]})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    <th className="pb-2 font-bold uppercase tracking-tighter">Categoría</th>
                                    <th className="pb-2 font-bold uppercase tracking-tighter text-right">Gastado</th>
                                    <th className="pb-2 font-bold uppercase tracking-tighter text-right">Presup.</th>
                                    <th className="pb-2 font-bold uppercase tracking-tighter text-right">Restante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {monthlyComparison.map((item, idx) => {
                                    const remaining = item.budget - item.spent;
                                    const isOver = remaining < 0;
                                    return (
                                        <tr key={idx} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-2 pr-2 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[80px]" title={item.category}>
                                                {item.category}
                                            </td>
                                            <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                                                ${item.spent.toLocaleString()}
                                            </td>
                                            <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                                                {item.budget > 0 ? `$${item.budget.toLocaleString()}` : <span className="text-slate-300 dark:text-slate-700">N/A</span>}
                                            </td>
                                            <td className={`py-2 text-right font-mono font-bold ${isOver ? 'text-red-500' : 'text-green-500'}`}>
                                                {isOver ? '-' : ''}${Math.abs(remaining).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Totales Rápidos */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Gastado Mes</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            ${monthlyComparison.reduce((acc, curr) => acc + curr.spent, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Sección de Obligaciones Estatutarias y Nómina */}
            {dayEvents.deadlines.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <Landmark size={12} /> Obligaciones y Recordatorios
                    </h3>
                    {dayEvents.deadlines.map((rule, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          rule.category === Category.PAYROLL
                            ? 'border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10'
                            : 'border-purple-100 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10'
                        }`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold text-sm ${
                                  rule.category === Category.PAYROLL ? 'text-orange-700 dark:text-orange-300' : 'text-purple-700 dark:text-purple-300'
                                }`}>{rule.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  rule.category === Category.PAYROLL 
                                    ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                                    : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                                }`}>{rule.frequency}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{rule.description}</p>
                            {rule.amount !== undefined && (
                              <div className="mt-2 text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                                ${rule.amount.toLocaleString()}
                              </div>
                            )}
                            <div className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${
                              rule.category === Category.PAYROLL ? 'text-orange-600 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'
                            }`}>
                                <AlertOctagon size={10} />
                                Fecha Límite Estricta
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Separador */}
            {dayEvents.deadlines.length > 0 && (dayEvents.realPayments.length > 0 || dayEvents.budgets.length > 0) && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
            )}
            
            {/* Sección de Presupuestos Manuales */}
            {dayEvents.budgets.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Target size={12} /> Presupuestos Asignados
                    </h3>
                    {dayEvents.budgets.map((budget) => (
                        <div key={budget.id} className="p-4 rounded-xl border border-cyan-100 dark:border-cyan-900/30 bg-cyan-50 dark:bg-cyan-900/10 group relative">
                            <button 
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                            <div className="flex justify-between items-start mb-1 pr-4">
                                <span className="text-cyan-800 dark:text-cyan-200 font-bold text-sm">{budget.title}</span>
                            </div>
                            <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-2">{budget.category}</p>
                            <div className="font-mono text-lg font-bold text-cyan-700 dark:text-cyan-300">
                                ${budget.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div className="text-right text-xs font-bold text-cyan-700 dark:text-cyan-400">
                        Total Presupuestado: ${totalBudgetForDay.toLocaleString()}
                    </div>
                </div>
            )}

            {/* Separador */}
            {dayEvents.budgets.length > 0 && dayEvents.realPayments.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
            )}

            {/* Sección de Pagos Reales */}
            {dayEvents.realPayments.length > 0 && (
                 <div className="space-y-3">
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={12} /> Pagos Ejecutados
                    </h3>
                    {dayEvents.realPayments.map(payment => (
                        <div key={payment.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                    payment.status === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    payment.status === PaymentStatus.PAID ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    payment.status === PaymentStatus.APPROVED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                    {payment.status === PaymentStatus.PAID ? 'REALIZADO' : payment.status}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">${payment.amount.toLocaleString()}</span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{payment.specificType}</h3>
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="truncate max-w-[150px]">{payment.storeName}</span>
                                {payment.status === PaymentStatus.APPROVED && onUpdatePayment && (
                                    <button 
                                        onClick={() => onUpdatePayment(payment.id)}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-[9px] font-bold hover:bg-green-700 transition-colors"
                                    >
                                        Marcar Realizado
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="text-right text-sm font-bold text-slate-900 dark:text-white pt-2">
                        Total Ejecutado: ${totalAmountForDay.toLocaleString()}
                    </div>
                 </div>
            )}

            {dayEvents.realPayments.length === 0 && dayEvents.deadlines.length === 0 && dayEvents.budgets.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <CheckCircle2 size={48} className="mb-2" />
                    <p className="text-sm">Sin eventos ni presupuestos</p>
                </div>
            )}
        </div>

        <button 
            onClick={() => setIsBudgetModalOpen(true)}
            disabled={currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPER_ADMIN}
            className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30 transition-all active:scale-[0.99]"
        >
            <Plus size={20} />
            Cargar Presupuesto
        </button>

        <button 
            onClick={() => setIsAnnualAssistantOpen(true)}
            disabled={currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPER_ADMIN}
            className="mt-3 w-full py-3 bg-white dark:bg-slate-800 border-2 border-cyan-600 text-cyan-600 dark:text-cyan-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-cyan-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Calendar size={20} />
            Asistente Anual
        </button>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};
