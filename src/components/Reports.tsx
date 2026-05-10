
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { Payment, PaymentStatus, User, Role, AuditLog, Category, BudgetEntry, PayrollEntry, Employee, Store } from '../types';
import { formatDate, formatDateTime } from '../utils';
import { Download, Calendar, ArrowUpRight, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, Filter, Wallet, AlertCircle, TrendingDown, AlertTriangle, FileText, FileSpreadsheet, ChevronDown, Users, Briefcase, Calculator, ShieldCheck } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import VenezuelaMap from './VenezuelaMap';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface ReportsProps {
  payments: Payment[];
  budgets: BudgetEntry[];
  payrollEntries: PayrollEntry[];
  employees: Employee[];
  currentUser: User | null;
  stores: Store[];
}

// Configuración simulada de presupuesto mensual (Eliminado: Usando props)
// const MONTHLY_BUDGET_TARGET = 6000; 

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
            <p className="font-bold text-slate-950 dark:text-slate-50 text-sm">{data.name}</p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-mono text-lg text-slate-950 dark:text-slate-50 font-bold">{data.value}</span> Pagos
        </p>
      </div>
    );
  }
  return null;
};

const CustomFinancialTooltip = ({ active, payload, label, exchangeRate }: any) => {
  if (active && payload && payload.length) {
    const approvedEntry = payload.find((p: any) => p.dataKey === 'approved');
    const pendingEntry = payload.find((p: any) => p.dataKey === 'pending');
    
    const approvedValue = approvedEntry?.value || 0;
    const pendingValue = pendingEntry?.value || 0;
    
    // Get budget from payload if available (from annualData)
    const budgetTarget = payload[0]?.payload?.budget || 1; 
    
    const approvedPercent = (approvedValue / budgetTarget) * 100;
    const pendingPercent = (pendingValue / budgetTarget) * 100;
    const totalPercent = ((approvedValue + pendingValue) / budgetTarget) * 100;

    const approvedBs = approvedEntry?.payload?.approvedBs || (approvedValue * exchangeRate);
    const pendingBs = pendingEntry?.payload?.pendingBs || (pendingValue * exchangeRate);
    const totalBs = approvedBs + pendingBs;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95 min-w-[240px] z-50">
        <p className="font-bold text-slate-950 dark:text-slate-50 mb-3 text-sm border-b border-slate-700 pb-2 uppercase tracking-wider">{label}</p>
        
        <div className="space-y-3">
          {/* Gasto Ejecutado */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-slate-500 dark:text-slate-400">Gasto Ejecutado</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-blue-400">
                  ${approvedValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  Bs. {approvedBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mr-2">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(approvedPercent, 100)}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{approvedPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Pendiente */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-slate-500 dark:text-slate-400">Pendiente / En Proceso</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-yellow-400">
                  ${pendingValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  Bs. {pendingBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mr-2">
                <div className="bg-yellow-500 h-full" style={{ width: `${Math.min(pendingPercent, 100)}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{pendingPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Proyectado:</span>
            <div className="text-right">
              <div className={`font-mono font-bold ${totalPercent > 100 ? 'text-red-400' : 'text-slate-200'}`}>
                ${(approvedValue + pendingValue).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">
                Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Utilización Total:</span>
            <span className={`font-bold ${totalPercent > 100 ? 'text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {totalPercent.toFixed(1)}% del presupuesto
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-600">
            <span>Presupuesto Base:</span>
            <span>${budgetTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const Reports: React.FC<ReportsProps> = ({ payments, budgets, payrollEntries, employees, currentUser, stores }) => {
  console.log("Reports received:", { paymentsCount: payments.length, budgetsCount: budgets.length });
  const [activeReport, setActiveReport] = React.useState<'financial' | 'labor' | 'auditor'>('financial');
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  // Date Filter State (Default to current month or most recent payment)
  const [startDate, setStartDate] = React.useState(() => {
    if (payments && payments.length > 0) {
      // Find the most recent payment date
      const dates = payments.map(p => {
        const d = p.submittedDate ? p.submittedDate : p.dueDate;
        return d ? new Date(d.split('T')[0] + 'T12:00:00').getTime() : 0;
      }).filter(t => t > 0);
      
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        return new Date(maxDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      }
    }
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = React.useState(() => {
    if (payments && payments.length > 0) {
      const dates = payments.map(p => {
        const d = p.submittedDate ? p.submittedDate : p.dueDate;
        return d ? new Date(d.split('T')[0] + 'T12:00:00').getTime() : 0;
      }).filter(t => t > 0);
      
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        // Set to end of that year to see the full projection
        return new Date(maxDate.getFullYear(), 11, 31).toISOString().split('T')[0];
      }
    }
    return new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
  });

  const [hasInitializedDates, setHasInitializedDates] = React.useState(false);

  React.useEffect(() => {
    if (payments && payments.length > 0 && !hasInitializedDates) {
      const dates = payments.map(p => {
        const d = p.submittedDate ? p.submittedDate : p.dueDate;
        return d ? new Date(d.split('T')[0] + 'T12:00:00').getTime() : 0;
      }).filter(t => t > 0);
      
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        setStartDate(new Date(maxDate.getFullYear(), 0, 1).toISOString().split('T')[0]);
        setEndDate(new Date(maxDate.getFullYear(), 11, 31).toISOString().split('T')[0]);
        setHasInitializedDates(true);
      }
    }
  }, [payments, hasInitializedDates]);

  // Store and Municipality Filter States
  const [selectedStore, setSelectedStore] = React.useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = React.useState('all');
  const [selectedLiabilityType, setSelectedLiabilityType] = React.useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState('all');
  const [auditSearchTerm, setAuditSearchTerm] = React.useState('');
  const [auditUserFilter, setAuditUserFilter] = React.useState('all');
  const [auditDateFilter, setAuditDateFilter] = React.useState('');
  const { exchangeRate } = useExchangeRate();

  const filteredPayrollEntries = React.useMemo(() => {
    return payrollEntries.filter(entry => {
      const entryDate = entry.month + '-01';
      const isDateInRange = entryDate >= startDate && entryDate <= endDate;
      const employeeMatch = selectedEmployeeId === 'all' || entry.employeeId === selectedEmployeeId;
      const storeMatch = selectedStore === 'all' || entry.storeId === selectedStore;
      
      return isDateInRange && employeeMatch && storeMatch;
    });
  }, [payrollEntries, startDate, endDate, selectedEmployeeId, selectedStore]);

  const liabilityTypes = React.useMemo(() => {
    const types = new Set<string>();
    payrollEntries.forEach(entry => {
      entry.employerLiabilities.forEach(l => types.add(l.name));
    });
    return ['all', ...Array.from(types)];
  }, [payrollEntries]);

  const laborLiabilitiesData = React.useMemo(() => {
    const data: { name: string; amount: number; worker: string; date: string; type: string; storeId: string }[] = [];
    
    filteredPayrollEntries.forEach(entry => {
      entry.employerLiabilities.forEach(liability => {
        if (selectedLiabilityType === 'all' || liability.name === selectedLiabilityType) {
          data.push({
            name: liability.name,
            amount: liability.amount,
            worker: entry.employeeName,
            date: entry.month,
            type: liability.name,
            storeId: entry.storeId
          });
        }
      });
    });
    
    return data;
  }, [filteredPayrollEntries, selectedLiabilityType]);

  const laborIndicators = React.useMemo(() => {
    const totalAmount = laborLiabilitiesData.reduce((sum, item) => sum + item.amount, 0);
    const byType = liabilityTypes.filter(t => t !== 'all').map(type => {
      const amount = laborLiabilitiesData.filter(d => d.type === type).reduce((sum, d) => sum + d.amount, 0);
      return { name: type, value: amount };
    }).filter(t => t.value > 0);

    const byWorker = Array.from(new Set(laborLiabilitiesData.map(d => d.worker))).map(worker => {
      const amount = laborLiabilitiesData.filter(d => d.worker === worker).reduce((sum, d) => sum + d.amount, 0);
      return { name: worker, value: amount };
    }).sort((a, b) => b.value - a.value).slice(0, 10);

    return { totalAmount, byType, byWorker };
  }, [laborLiabilitiesData, liabilityTypes]);

  const municipalities = React.useMemo(() => {
    const userStoreIds = (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds : [];
    const storesToProcess = userStoreIds.length > 0 ? stores.filter(s => userStoreIds.includes(s.id)) : stores;
    const allMunicipalities = storesToProcess.map(s => s.municipality || 'N/A');
    return ['all', ...Array.from(new Set(allMunicipalities))];
  }, [currentUser, stores]);

  // --- PROCESAMIENTO DE DATOS ---

  const filteredPayments = React.useMemo(() => {
    return payments.filter(p => {
      const recordDate = p.submittedDate ? p.submittedDate.split('T')[0] : (p.dueDate ? p.dueDate.split('T')[0] : '');
      const isDateInRange = recordDate >= startDate && recordDate <= endDate;
      const storeMatch = selectedStore === 'all' || p.storeId === selectedStore;
      const storeDetails = stores.find(s => s.id === p.storeId);
      const municipalityMatch = selectedMunicipality === 'all' || (storeDetails && storeDetails.municipality === selectedMunicipality);

      return isDateInRange && storeMatch && municipalityMatch;
    });
  }, [payments, startDate, endDate, selectedStore, selectedMunicipality, stores]);

  // Calcular el estado dinámico de las tiendas para el mapa en el reporte
  const dynamicStores = React.useMemo(() => {
    const userStoreIds = (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds : [];
    const storesToProcess = userStoreIds.length > 0 ? stores.filter(s => userStoreIds.includes(s.id)) : stores;
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

  const monthlyCategoryData = React.useMemo(() => {
    const currentYear = new Date(startDate + 'T12:00:00').getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const categories = Object.values(Category);

    return months.map((monthName, index) => {
      const monthlyPayments = payments.filter(p => {
        const recordDateStr = p.submittedDate ? p.submittedDate : p.dueDate;
        if (!recordDateStr) return false;
        const datePart = recordDateStr.split('T')[0];
        const d = new Date(datePart + 'T12:00:00');
        const isSameMonthYear = d.getMonth() === index && d.getFullYear() === currentYear;
        const storeMatch = selectedStore === 'all' || p.storeId === selectedStore;
        const storeDetails = stores.find(s => s.id === p.storeId);
        const municipalityMatch = selectedMunicipality === 'all' || (storeDetails && storeDetails.municipality === selectedMunicipality);
        
        return isSameMonthYear && storeMatch && municipalityMatch;
      });

      const categoryBreakdown = categories.map(cat => {
        const catPayments = monthlyPayments.filter(p => p.category === cat);
        const approved = catPayments.filter(p => p.status === PaymentStatus.APPROVED).reduce((sum, p) => sum + p.amount, 0);
        const pending = catPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE).reduce((sum, p) => sum + p.amount, 0);
        return { category: cat, approved, pending, total: approved + pending };
      }).filter(item => item.total > 0);

      return {
        month: monthName,
        categories: categoryBreakdown,
        totalApproved: categoryBreakdown.reduce((sum, item) => sum + item.approved, 0),
        totalPending: categoryBreakdown.reduce((sum, item) => sum + item.pending, 0),
      };
    }).filter(monthData => monthData.categories.length > 0);
  }, [payments, startDate, selectedStore, selectedMunicipality, stores]);

  const annualData = React.useMemo(() => {
    const currentYear = new Date(startDate + 'T12:00:00').getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return months.map((monthName, index) => {
        const monthlyPayments = payments.filter(p => {
            const recordDateStr = p.submittedDate ? p.submittedDate : p.dueDate;
            if (!recordDateStr) return false;
            
            const datePart = recordDateStr.split('T')[0];
            const d = new Date(datePart + 'T12:00:00'); 
            const isSameMonthYear = d.getMonth() === index && d.getFullYear() === currentYear;
            const storeMatch = selectedStore === 'all' || p.storeId === selectedStore;
            const storeDetails = stores.find(s => s.id === p.storeId);
            const municipalityMatch = selectedMunicipality === 'all' || (storeDetails && storeDetails.municipality === selectedMunicipality);
            
            return isSameMonthYear && storeMatch && municipalityMatch;
        });

        const approvedAmount = monthlyPayments
            .filter(p => p.status === PaymentStatus.APPROVED)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const approvedAmountBs = monthlyPayments
            .filter(p => p.status === PaymentStatus.APPROVED)
            .reduce((sum, p) => sum + (p.dueDateAmountBs || (p.amount * exchangeRate)), 0);

        const pendingAmount = monthlyPayments
            .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE)
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingAmountBs = monthlyPayments
            .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE)
            .reduce((sum, p) => sum + (p.dueDateAmountBs || (p.amount * exchangeRate)), 0);

        // Calcular presupuesto para este mes específico
        const monthlyBudget = budgets.filter(b => {
            const d = new Date(b.date + 'T12:00:00');
            return d.getMonth() === index && d.getFullYear() === currentYear;
        }).reduce((sum, b) => sum + b.amount, 0);

        return {
            name: monthName,
            approved: approvedAmount,
            approvedBs: approvedAmountBs,
            pending: pendingAmount,
            pendingBs: pendingAmountBs,
            budget: monthlyBudget || 0,
            total: approvedAmount + pendingAmount,
            totalBs: approvedAmountBs + pendingAmountBs
        };
    });
  }, [payments, budgets, startDate, selectedStore, selectedMunicipality, stores]);

  const totalAnnualBudget = annualData.reduce((acc, curr) => acc + curr.budget, 0) || 1;
  const totalYTDExecuted = annualData.reduce((acc, curr) => acc + curr.approved, 0);
  const totalYTDPending = annualData.reduce((acc, curr) => acc + curr.pending, 0);
  const budgetUtilization = (totalYTDExecuted / totalAnnualBudget) * 100;
  const availableBudget = totalAnnualBudget - totalYTDExecuted;

  const approvedPayments = filteredPayments.filter(p => p.status === PaymentStatus.APPROVED);
  const totalApproved = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalApprovedBs = approvedPayments.reduce((acc, curr) => acc + (curr.dueDateAmountBs || (curr.amount * exchangeRate)), 0);

  const rejectedPayments = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED);
  const totalRejectedCount = rejectedPayments.length;
  
  const pendingPayments = filteredPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
  const totalPendingCount = pendingPayments.length;
  const totalPendingBs = pendingPayments.reduce((acc, curr) => acc + (curr.dueDateAmountBs || (curr.amount * exchangeRate)), 0);
  
  // Calculate over-budget sum
  const totalOverBudgetSum = filteredPayments
    .filter(p => p.isOverBudget)
    .reduce((acc, curr) => {
        const extra = curr.originalBudget ? (curr.amount - curr.originalBudget) : 0;
        return acc + Math.max(0, extra);
    }, 0);

  // Flatten all audit logs from filtered payments for the Bitácora
  const allAuditLogs = React.useMemo(() => {
    const logs: (AuditLog & { paymentId: string; storeName: string; specificType: string; amount: number })[] = [];
    filteredPayments.forEach(p => {
        if (p.history && p.history.length > 0) {
            p.history.forEach(h => {
                logs.push({
                    ...h,
                    paymentId: p.id,
                    storeName: p.storeName,
                    specificType: p.specificType,
                    amount: p.amount
                });
            });
        } else {
            // Fallback: create a log entry if no history exists (legacy data)
            logs.push({
                date: p.submittedDate || p.dueDate,
                action: 'CREACION',
                actorName: 'Sistema',
                role: Role.ADMIN,
                note: 'Registro inicial',
                paymentId: p.id,
                storeName: p.storeName,
                specificType: p.specificType,
                amount: p.amount
            });
        }
    });

    // Apply Bitácora-specific filters
    return logs
      .filter(log => {
        const searchMatch = !auditSearchTerm || 
          log.specificType.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
          log.paymentId.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
          log.storeName.toLowerCase().includes(auditSearchTerm.toLowerCase());
        
        const userMatch = auditUserFilter === 'all' || log.actorName === auditUserFilter;
        
        const dateMatch = !auditDateFilter || log.date.split('T')[0] === auditDateFilter;

        return searchMatch && userMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredPayments, auditSearchTerm, auditUserFilter, auditDateFilter]);

  const uniqueAuditUsers = React.useMemo(() => {
    const users = new Set<string>();
    // We use all payments to get all possible users, or just from filtered?
    // Let's use all payments to have a complete list of users who have ever done something.
    payments.forEach(p => {
      p.history?.forEach(h => users.add(h.actorName));
    });
    return ['all', ...Array.from(users)].sort();
  }, [payments]);

  const auditorActivity = React.useMemo(() => {
    return allAuditLogs.filter(log => 
      log.action === 'APROBACION' || 
      log.action === 'RECHAZO' || 
      log.action === 'APROBACION_MASIVA'
    );
  }, [allAuditLogs]);

  const handleDownloadAuditPDF = async () => {
    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 100));

    try {
        const logoData = await getDataUrl(APP_LOGO_URL);
        const doc = new jsPDF();
        
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', 14, 10, 15, 15);
            } catch (e) {
                console.warn("Error adding image to PDF:", e);
            }
        }

        doc.setFontSize(20);
        doc.text("Bitácora de Auditoría Detallada", logoData ? 35 : 14, 20); 
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 30);
        doc.text(`Eventos Totales: ${allAuditLogs.length}`, 14, 35);

        doc.setDrawColor(200, 200, 200);
        doc.line(14, 40, 196, 40);
        
        const tableData = allAuditLogs.map(log => [
            formatDateTime(log.date),
            log.action,
            log.actorName,
            log.role,
            `${log.storeName} - ${log.specificType} ($${log.amount.toLocaleString()})`,
            log.note || '-'
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Fecha/Hora', 'Acción', 'Usuario', 'Rol', 'Referencia', 'Nota']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 40 },
                5: { cellWidth: 'auto' }
            }
        });

        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Forza 22 Audit - Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        }

        doc.save(`Bitacora_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generando PDF de auditoría:", error);
        alert("Ocurrió un error al generar el PDF. Revise la consola.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAuditorActivityPDF = async () => {
    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 100));

    try {
        const logoData = await getDataUrl(APP_LOGO_URL);
        const doc = new jsPDF();
        
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', 14, 10, 15, 15);
            } catch (e) {
                console.warn("Error adding image to PDF:", e);
            }
        }

        doc.setFontSize(20);
        doc.text("Reporte de Actividad de Auditores", logoData ? 35 : 14, 20); 
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 30);
        doc.text(`Acciones Registradas: ${auditorActivity.length}`, 14, 35);

        doc.setDrawColor(200, 200, 200);
        doc.line(14, 40, 196, 40);
        
        const tableData = auditorActivity.map(log => [
            formatDateTime(log.date),
            log.action,
            log.actorName,
            log.role,
            `${log.storeName} - ${log.specificType} ($${log.amount.toLocaleString()})`,
            log.note || '-'
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Fecha/Hora', 'Acción', 'Auditor', 'Rol', 'Referencia', 'Nota']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] }, // Purple for auditor activity
            styles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 40 },
                5: { cellWidth: 'auto' }
            }
        });

        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Forza 22 Audit - Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        }

        doc.save(`Actividad_Auditores_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generando PDF de actividad de auditores:", error);
        alert("Ocurrió un error al generar el PDF. Revise la consola.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAuditorActivityCSV = () => {
    const headers = ['Fecha/Hora', 'Accion', 'Usuario', 'Rol', 'Referencia', 'Monto ($)', 'Nota'];
    const rows = auditorActivity.map(log => [
      formatDateTime(log.date),
      log.action,
      log.actorName,
      log.role,
      `${log.storeName} - ${log.specificType}`,
      log.amount,
      log.note || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Actividad_Auditores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusData = [
    { name: 'Aprobados', value: approvedPayments.length, color: '#22c55e' },
    { name: 'Rechazados', value: rejectedPayments.length, color: '#ef4444' },
    { name: 'Pendientes', value: totalPendingCount, color: '#eab308' },
  ];

  const getDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      
      img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve(""); 
            }
        } catch (e) {
            console.warn("Canvas tainted or error converting image:", e);
            resolve(""); 
        }
      };
      
      img.onerror = () => {
          console.warn("Error cargando logo para PDF (Network Error), continuando sin logo.");
          resolve(""); 
      };
      img.src = url;
    });
  };

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Tienda', 'Concepto', 'Monto', 'Fecha Vencimiento', 'Fecha Pago', 'Estado', 'Notas', 'Presupuesto Original', 'Excede Presupuesto'];
    
    const csvData = filteredPayments.map(p => [
      p.id,
      `"${p.storeName}"`,
      `"${p.specificType}"`,
      p.amount,
      formatDate(p.dueDate),
      formatDate(p.paymentDate || ''),
      p.status,
      `"${p.notes || ''}"`,
      p.originalBudget || '',
      p.isOverBudget ? 'Sí' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Fiscal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleDownloadPDF = async () => {
    setShowExportMenu(false);
    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 100));

    try {
        const logoData = await getDataUrl(APP_LOGO_URL);
        const doc = new jsPDF();
        
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', 14, 10, 15, 15);
            } catch (e) {
                console.warn("Error adding image to PDF:", e);
            }
        }

        doc.setFontSize(20);
        doc.text("Reporte Fiscal Ejecutivo", logoData ? 35 : 14, 20); 
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 30);
        doc.text(`Período: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 35);

        doc.setDrawColor(200, 200, 200);
        doc.line(14, 40, 196, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Resumen del Período", 14, 50);

        const kpiY = 60;
        doc.setFontSize(10);
        
        doc.text(`Total Aprobado: $${totalApproved.toLocaleString()} (Bs. ${totalApprovedBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`, 14, kpiY);
        doc.text(`Pagos Rechazados: ${totalRejectedCount}`, 14, kpiY + 7);
        doc.text(`Pendientes: ${totalPendingCount} (Bs. ${totalPendingBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`, 14, kpiY + 14);

        doc.text("Detalle de Transacciones", 14, 80);
        
        const tableData = filteredPayments
            .map(p => [
                formatDate(p.submittedDate || p.dueDate),
                p.storeName,
                p.specificType,
                `$${p.amount.toLocaleString()}`,
                `Bs. ${(p.dueDateAmountBs || (p.amount * exchangeRate)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
                p.status
            ]);

        autoTable(doc, {
            startY: 85,
            head: [['Fecha', 'Tienda', 'Concepto', 'Monto ($)', 'Monto (Bs.)', 'Estado']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 8 },
        });

        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Forza 22 - Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        }

        doc.save(`Reporte_Fiscal_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Ocurrió un error al generar el PDF. Revise la consola.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleDownloadLaborPDF = async () => {
    setIsGeneratingPdf(true);
    try {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Pasivos Laborales", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 30);
        doc.text(`Período: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 35);

        const tableData = laborLiabilitiesData.map(d => [
            d.date,
            d.worker,
            d.type,
            `$${d.amount.toLocaleString()}`,
            `Bs. ${(d.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            head: [['Fecha', 'Trabajador', 'Tipo de Pasivo', 'Monto ($)', 'Monto (Bs.)']],
            body: tableData,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
        });

        doc.save(`Reporte_Pasivos_Laborales_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleDownloadLaborCSV = () => {
    const headers = ['Fecha', 'Trabajador', 'Tipo de Pasivo', 'Monto ($)', 'Monto (Bs.)'];
    const rows = laborLiabilitiesData.map(d => [
        d.date,
        `"${d.worker}"`,
        `"${d.type}"`,
        d.amount.toFixed(2),
        (d.amount * exchangeRate).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Pasivos_Laborales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 font-sans">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-8"
      >
        <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shadow-inner shadow-blue-500/20">
                <TrendingUp size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {currentUser?.role === Role.ADMIN ? 'Panel de Administración' : 'Panel de Presidencia'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Supervisión en Tiempo Real • Auditoría Fiscal</p>
                </div>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Report specific filters */}
            {activeReport === 'labor' && (
              <div className="flex items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <select 
                    value={selectedLiabilityType} 
                    onChange={e => setSelectedLiabilityType(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer hover:bg-slate-100 dark:bg-slate-800"
                >
                    <option value="all">Todos los Pasivos</option>
                    {liabilityTypes.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select 
                    value={selectedEmployeeId} 
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 ml-1.5 transition-all cursor-pointer hover:bg-slate-100 dark:bg-slate-800"
                >
                    <option value="all">Todos los Trabajadores</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>)}
                </select>
              </div>
            )}

            {/* Store and Municipality Filters */}
            <div className="flex items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <select 
                    value={selectedStore} 
                    onChange={e => setSelectedStore(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-slate-100 dark:bg-slate-800"
                >
                    <option value="all">Todas las Tiendas</option>
                    {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select 
                    value={selectedMunicipality} 
                    onChange={e => setSelectedMunicipality(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 ml-1.5 transition-all cursor-pointer hover:bg-slate-100 dark:bg-slate-800"
                >
                    <option value="all">Todos los Municipios</option>
                    {municipalities.filter(m => m !== 'all').map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Rango</span>
                </div>
                <div className="flex items-center gap-2 px-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-slate-600 font-bold">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark] cursor-pointer"
                    />
                </div>
            </div>

            {/* Export Menu */}
            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isGeneratingPdf}
                    className="flex items-center justify-center gap-2 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 group"
                >
                    {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
                    <span>Exportar Reporte</span>
                    <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {showExportMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-48 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-1">
                                <button 
                                    onClick={activeReport === 'financial' ? handleDownloadPDF : activeReport === 'labor' ? handleDownloadLaborPDF : handleDownloadAuditorActivityPDF}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                                >
                                    <div className={`p-1.5 ${activeReport === 'financial' ? 'bg-red-500/10 text-red-400' : activeReport === 'labor' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'} rounded-lg`}>
                                        <FileText size={16} />
                                    </div>
                                    Exportar como PDF
                                </button>
                                <button 
                                    onClick={activeReport === 'financial' ? handleDownloadCSV : activeReport === 'labor' ? handleDownloadLaborCSV : handleDownloadAuditorActivityCSV}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                                >
                                    <div className={`p-1.5 ${activeReport === 'financial' ? 'bg-emerald-500/10 text-emerald-400' : activeReport === 'labor' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'} rounded-lg`}>
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    Exportar como CSV
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </motion.header>

      {/* Report Type Toggle */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveReport('financial')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeReport === 'financial'
              ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-500/30'
              : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <TrendingUp size={18} />
          <span>Reporte Financiero</span>
        </button>
        <button
          onClick={() => setActiveReport('labor')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeReport === 'labor'
              ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Users size={18} />
          <span>Pasivos Laborales</span>
        </button>
        <button
          onClick={() => setActiveReport('auditor')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            activeReport === 'auditor'
              ? 'bg-purple-600 text-slate-900 dark:text-white shadow-lg shadow-purple-500/30'
              : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Actividad de Auditores</span>
        </button>
      </div>

      {activeReport === 'financial' ? (
        <>
          {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Monto Aprobado', value: `$${totalApproved.toLocaleString()}`, bsValue: `Bs. ${(totalApproved * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CheckCircle2, color: 'emerald', sub: 'En selección' },
            { label: 'Desviación Ppto.', value: `$${totalOverBudgetSum.toLocaleString()}`, bsValue: `Bs. ${(totalOverBudgetSum * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: AlertTriangle, color: 'orange', sub: 'Excedente acumulado' },
            { label: 'Pagos Rechazados', value: totalRejectedCount, icon: XCircle, color: 'red', sub: 'Revisiones fallidas' },
            { label: 'En Espera', value: totalPendingCount, icon: Clock, color: 'yellow', sub: 'Pendientes de firma' }
          ].map((kpi, i) => (
            <motion.div 
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-${kpi.color}-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-${kpi.color}-500/10`}
            >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 bg-${kpi.color}-500/10 rounded-2xl text-${kpi.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                            <kpi.icon size={24} />
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full bg-${kpi.color}-500/10 text-${kpi.color}-500 uppercase tracking-wider`}>
                            Live
                        </div>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide">{kpi.label}</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{kpi.value}</div>
                    {kpi.bsValue && (
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{kpi.bsValue}</div>
                    )}
                    <p className={`text-xs text-${kpi.color}-400/70 mt-3 flex items-center gap-1.5 font-medium`}>
                        <ArrowUpRight size={14} />
                        {kpi.sub}
                    </p>
                </div>
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${kpi.color}-500/5 rounded-full blur-3xl group-hover:bg-${kpi.color}-500/10 transition-all duration-500`}></div>
            </motion.div>
          ))}
      </div>

      {/* Reporte Mensual por Categoría */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mb-8 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                Reporte Mensual por Categoría
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Aprobado
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Pendiente
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {monthlyCategoryData.map((monthData, idx) => (
                <motion.div 
                    key={monthData.month}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (idx * 0.05) }}
                    className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:bg-slate-100 dark:bg-slate-800/50 transition-all group"
                >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                        <span className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{monthData.month}</span>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Total Mes</div>
                            <div className="text-sm font-bold text-blue-400 font-mono">${(monthData.totalApproved + monthData.totalPending).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {monthData.categories.map((catData) => (
                            <div key={`${monthData.month}-${catData.category}`} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{catData.category}</span>
                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white font-mono">${catData.total.toLocaleString()}</span>
                                </div>
                                <div className="flex h-1.5 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full transition-all duration-1000" 
                                        style={{ width: `${(catData.approved / catData.total) * 100}%` }}
                                    />
                                    <div 
                                        className="bg-yellow-500 h-full transition-all duration-1000" 
                                        style={{ width: `${(catData.pending / catData.total) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                                    <span className="text-emerald-500/70">${catData.approved.toLocaleString()}</span>
                                    <span className="text-yellow-500/70">${catData.pending.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Aprobado</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">${monthData.totalApproved.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pendiente</span>
                            <span className="text-sm font-bold text-yellow-400 font-mono">${monthData.totalPending.toLocaleString()}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
         
         {/* Annual Projection (Main Chart) - 8 columns */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
         >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                <div>
                    <h3 className="font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Wallet className="text-blue-500" size={20} />
                        </div>
                        Proyección Financiera Anual
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">Comparativa de Ejecución vs. Presupuesto Base</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-inner">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Presupuesto Anual</span>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">${totalAnnualBudget.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 font-bold">Bs. {(totalAnnualBudget * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                    <div className="px-5 py-3 bg-blue-500/10 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-inner">
                        <span className="text-[10px] text-blue-400 block uppercase font-bold tracking-widest mb-1">Ejecutado YTD</span>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-blue-400 font-mono">${totalYTDExecuted.toLocaleString()}</span>
                          <span className="text-[10px] text-blue-400/70 font-bold">Bs. {(totalYTDExecuted * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="h-[400px] w-full mb-8 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={annualData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 11}} 
                            tickFormatter={(value) => `$${value/1000}k`}
                            dx={-10}
                        />
                        <Tooltip content={<CustomFinancialTooltip exchangeRate={exchangeRate} />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle" 
                            wrapperStyle={{paddingBottom: '30px', fontSize: '12px', fontWeight: 600}} 
                        />
                        
                        <Area type="monotone" dataKey="approved" stroke="none" fill="url(#colorApproved)" />
                        <Area type="monotone" dataKey="pending" stroke="none" fill="url(#colorPending)" />

                        <Bar name="Gasto Ejecutado" dataKey="approved" stackId="a" fill="#3b82f6" barSize={24} radius={[0,0,4,4]} />
                        <Bar name="Pendiente / Proyección" dataKey="pending" stackId="a" fill="#eab308" barSize={24} radius={[6,6,0,0]} />
                        
                        <Line 
                            name="Límite Presupuestario" 
                            type="stepAfter" 
                            dataKey="budget" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            strokeDasharray="8 4" 
                            dot={false}
                            activeDot={{r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2}}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Monthly Trend Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-12 gap-3 relative z-10">
                {annualData.map((month, idx) => {
                    const isOver = month.total > month.budget;
                    const isEmpty = month.total === 0;
                    const percentage = month.budget > 0 ? (month.total / month.budget) * 100 : (month.total > 0 ? 100 : 0);
                    
                    return (
                        <motion.div 
                            key={month.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + (idx * 0.05) }}
                            className={`p-3 rounded-2xl border transition-all duration-300 group cursor-default ${
                            isEmpty 
                            ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-40' 
                            : isOver 
                                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/50' 
                                : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50'
                        }`}>
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{month.name}</span>
                                {!isEmpty && (
                                    isOver ? (
                                        <TrendingUp size={12} className="text-red-500" />
                                    ) : (
                                        <TrendingDown size={12} className="text-emerald-500" />
                                    )
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-xs font-mono font-bold ${isEmpty ? 'text-slate-600' : isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {isEmpty ? '0%' : `${percentage.toFixed(0)}%`}
                                </span>
                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                                        transition={{ duration: 1, delay: 1 }}
                                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
         </motion.div>

         {/* Distribution & Map Section - 4 columns */}
         <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Distribution Chart */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl"
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 self-start flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                    Distribución de Pagos
                </h3>
                <div className="h-[240px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{filteredPayments.length}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 w-full gap-3 mt-8">
                    {statusData.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full shadow-lg" style={{backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40`}}></span>
                                <span className="text-xs font-bold text-slate-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{item.value}</span>
                                <span className="text-[10px] text-slate-500 font-bold">({((item.value / (filteredPayments.length || 1)) * 100).toFixed(0)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Insight Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-slate-900 dark:text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <AlertCircle size={20} />
                        </div>
                        <h4 className="font-bold text-lg">Insight Ejecutivo</h4>
                    </div>
                    <p className="text-blue-50 leading-relaxed text-sm">
                        Se ha ejecutado el <span className="font-bold text-slate-900 dark:text-white underline decoration-white/30 underline-offset-4">{budgetUtilization.toFixed(1)}%</span> del presupuesto anual. 
                        {budgetUtilization > 100 ? ' Se recomienda revisar las desviaciones críticas en los rubros variables.' : ' El flujo de caja se mantiene dentro de los parámetros proyectados.'}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-blue-200 tracking-widest">Disponible</span>
                            <span className="text-xl font-bold font-mono">${availableBudget.toLocaleString()}</span>
                        </div>
                        <button className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all active:scale-95">
                            <ArrowUpRight size={20} />
                        </button>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            </motion.div>
         </div>
      </div>

      {/* Bottom Section: Map & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Venezuela Map - 7 columns */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-7"
          >
             <VenezuelaMap 
                 stores={dynamicStores} 
                 selectedStoreIds={selectedStore !== 'all' ? [selectedStore] : []}
                 onStoreClick={(id) => setSelectedStore(id === selectedStore ? 'all' : id)}
             />
          </motion.div>

          {/* Activity Log - 5 columns */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                    Bitácora de Auditoría
                </h3>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleDownloadAuditPDF}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        Exportar PDF
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 uppercase tracking-widest">
                        {allAuditLogs.length} Eventos
                    </span>
                </div>
            </div>

            {/* Audit Log Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Filter size={14} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar pago o tienda..."
                        value={auditSearchTerm}
                        onChange={(e) => setAuditSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Users size={14} />
                    </div>
                    <select 
                        value={auditUserFilter}
                        onChange={(e) => setAuditUserFilter(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">Todos los usuarios</option>
                        {uniqueAuditUsers.filter(u => u !== 'all').map(user => (
                            <option key={user} value={user}>{user}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown size={14} />
                    </div>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Calendar size={14} />
                    </div>
                    <input 
                        type="date"
                        value={auditDateFilter}
                        onChange={(e) => setAuditDateFilter(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all [color-scheme:dark]"
                    />
                    {auditDateFilter && (
                        <button 
                            onClick={() => setAuditDateFilter('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-red-400 transition-colors"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar space-y-4">
                {allAuditLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
                        <AlertCircle size={40} className="mb-4 opacity-20" />
                        <p className="font-medium">Sin registros en este rango</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {allAuditLogs.map((log, idx) => (
                            <motion.div 
                                key={`${log.paymentId}-${log.date}-${idx}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + (idx * 0.05) }}
                                className={`group flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/50 hover:border-slate-700 hover:bg-slate-100 dark:bg-slate-800/50`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${
                                        log.action === 'APROBACION' || log.action === 'APROBACION_MASIVA'
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : log.action === 'RECHAZO'
                                        ? 'bg-red-500/10 text-red-500'
                                        : log.action === 'CREACION'
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                        {log.action === 'APROBACION' || log.action === 'APROBACION_MASIVA' ? (
                                            <CheckCircle2 size={20} />
                                        ) : log.action === 'RECHAZO' ? (
                                            <XCircle size={20} />
                                        ) : log.action === 'CREACION' ? (
                                            <FileText size={20} />
                                        ) : (
                                            <Clock size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2 group-hover:text-slate-900 dark:text-white transition-colors">
                                            {log.action} por {log.actorName}
                                            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">{log.role}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex flex-col gap-0.5 mt-0.5 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[150px] text-slate-500 dark:text-slate-400">{log.storeName} - {log.specificType}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span>{formatDateTime(log.date)}</span>
                                            </div>
                                            {log.note && (
                                                <div className="text-[10px] italic text-slate-500 mt-1 bg-white dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                                    "{log.note}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                                        ${log.amount.toLocaleString()}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                                        Ref: {log.paymentId.slice(-6)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
          </motion.div>
      </div>
        </>
      ) : activeReport === 'labor' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Labor KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <Calculator size={24} />
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide">Total Pasivos Acumulados</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1 font-mono">${laborIndicators.totalAmount.toLocaleString()}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Bs. {(laborIndicators.totalAmount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Users size={24} />
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide">Trabajadores en Reporte</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{new Set(laborLiabilitiesData.map(d => d.worker)).size}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Personal Activo / Histórico</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                  <Briefcase size={24} />
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide">Tipos de Pasivos</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{laborIndicators.byType.length}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Categorías de Ley</div>
            </motion.div>
          </div>

          {/* Labor Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                Distribución por Tipo de Pasivo
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={laborIndicators.byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {laborIndicators.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                Top 10 Trabajadores por Pasivo
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laborIndicators.byWorker} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Detailed Labor Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                Detalle de Pasivos Laborales
              </h3>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {laborLiabilitiesData.length} Registros Encontrados
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trabajador</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Pasivo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Monto ($)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Monto (Bs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {laborLiabilitiesData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-300">{item.date}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{item.worker}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right font-mono">${item.amount.toLocaleString()}</td>
                      <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 text-right font-mono">Bs. {(item.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {laborLiabilitiesData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-500 italic">
                        No se encontraron registros de pasivos laborales para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Auditor Activity Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                Actividad de Auditores (Aprobaciones y Rechazos)
              </h3>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {auditorActivity.length} Acciones Registradas
              </div>
            </div>

            {/* Auditor Activity Filters */}
            <div className="p-8 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-500 transition-colors">
                            <Filter size={14} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Buscar pago o tienda..."
                            value={auditSearchTerm}
                            onChange={(e) => setAuditSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800/30 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-500 transition-colors">
                            <Users size={14} />
                        </div>
                        <select 
                            value={auditUserFilter}
                            onChange={(e) => setAuditUserFilter(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800/30 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">Todos los auditores</option>
                            {uniqueAuditUsers.filter(u => u !== 'all').map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-500 transition-colors">
                            <Calendar size={14} />
                        </div>
                        <input 
                            type="date"
                            value={auditDateFilter}
                            onChange={(e) => setAuditDateFilter(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800/30 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all [color-scheme:dark]"
                        />
                        {auditDateFilter && (
                            <button 
                                onClick={() => setAuditDateFilter('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Auditor</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acción</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pago / Tienda</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Monto ($)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditorActivity.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-300">{formatDateTime(log.date)}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{log.role}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          log.action === 'RECHAZO' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{log.specificType}</div>
                        <div className="text-xs text-slate-500">{log.storeName} ({log.paymentId})</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right font-mono">${log.amount.toLocaleString()}</td>
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400 italic max-w-xs truncate" title={log.note}>
                        {log.note || '-'}
                      </td>
                    </tr>
                  ))}
                  {auditorActivity.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-slate-500 italic">
                        No se encontraron acciones de auditoría para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
