import React from 'react';
import { 
  Users, 
  Briefcase, 
  Plus, 
  Search, 
  DollarSign, 
  FileText, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ShieldCheck, 
  Contact, 
  Trash2,
  ChevronRight,
  UserPlus,
  LayoutGrid,
  List,
  Edit3,
  UserCheck,
  UserX,
  Wand2,
  Download,
  FileSignature,
  FileStack,
  CheckCircle2,
  Clock,
  Landmark,
  Building2,
  AlertCircle,
  AlertTriangle,
  Eye,
  X,
  History,
  HandCoins,
  RefreshCw,
  Mail,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollEntry, Employee, PPEAssignment, ShiftGroup, ShiftSlot } from './types';
import { PAYROLL_FACTORS } from './constants/payrollConstants';
import { formatDate, formatTime } from './utils';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { PPEModal } from './components/PPEModal';
import { PayrollStatsGrid } from './components/PayrollStatsGrid';
import { PayrollSummaryTables } from './components/PayrollSummaryTables';
import { PayrollHistoryTable } from './components/PayrollHistoryTable';
import { PayrollEmployeesTable } from './components/PayrollEmployeesTable';
import { PayrollPPEHistoryTable } from './components/PayrollPPEHistoryTable';
import { PayrollShiftsView } from './components/PayrollShiftsView';
import { PayrollWebhookModal } from './components/PayrollWebhookModal';
import { PayrollARIModal } from './components/PayrollARIModal';
import { PayrollViewEmployeeModal } from './components/PayrollViewEmployeeModal';
import { PayrollViewEntryModal } from './components/PayrollViewEntryModal';
import { PayrollAddEntryModal } from './components/PayrollAddEntryModal';
import { PayrollAddEmployeeModal } from './components/PayrollAddEmployeeModal';
import { PayrollPrestacionesModal } from './components/PayrollPrestacionesModal';
import { PayrollAnticipoModal } from './components/PayrollAnticipoModal';
import { PayrollFinanceModal } from './components/PayrollFinanceModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { 
  calculateParafiscales, 
  hasParafiscalDiscrepancies, 
  calculateTotals,
  calculatePrestacionesForEmployee,
  calculateARI,
  calculateLOTTTExtras,
  getParafiscalDiff
} from './utils/lotttCalculations';
import { payrollService as service } from './services';
import { PayrollAttendanceView } from './components/PayrollAttendanceView';
import { PayrollDailyView } from './components/PayrollDailyView';

import { User, SystemSettings, Store } from '../../types';

interface PayrollModuleProps {
  entries: PayrollEntry[];
  employees: Employee[];
  onAddEntry: (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>) => Promise<PayrollEntry | void>;
  onUpdateEntry?: (entry: PayrollEntry) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddEmployee: (employee: Employee) => Promise<void>;
  onUpdateEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  currentUser?: User | null;
  settings?: SystemSettings | null;
  onRefreshData: () => Promise<void>;
  onLoadMorePayroll?: () => Promise<void>;
  hasMorePayroll?: boolean;
  onLoadMoreEmployees?: () => Promise<void>;
  hasMoreEmployees?: boolean;
  stores: Store[];
}

type TabType = 'payroll' | 'employees' | 'ppe-history' | 'shifts' | 'attendance' | 'daily-payroll';

export const PayrollModule: React.FC<PayrollModuleProps> = ({ 
  entries, 
  employees, 
  onAddEntry, 
  onUpdateEntry,
  onDeleteEntry,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currentUser,
  settings,
  onRefreshData,
  onLoadMorePayroll,
  hasMorePayroll = false,
  onLoadMoreEmployees,
  hasMoreEmployees = false,
  stores
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('payroll');
  const [isAddingEntry, setIsAddingEntry] = React.useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const [viewingEntry, setViewingEntry] = React.useState<PayrollEntry | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = React.useState(false);
  const [isPPEModalOpen, setIsPPEModalOpen] = React.useState(false);
  const [ppeEmployee, setPpeEmployee] = React.useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [ppeSearchTerm, setPpeSearchTerm] = React.useState('');
  const [ppeStoreFilter, setPpeStoreFilter] = React.useState('');
  const [ppeDateFilter, setPpeDateFilter] = React.useState('');
  const [confirmModal, setConfirmModal] = React.useState<{
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
  const [notification, setNotification] = React.useState<string | null>(null);
  const [payrollIdFilter, setPayrollIdFilter] = React.useState('');
  const [payrollDateFilter, setPayrollDateFilter] = React.useState('');
  const [isSendingEmails, setIsSendingEmails] = React.useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = React.useState(false);
  const [financeComprobante, setFinanceComprobante] = React.useState<string | null>(null);
  const [isUploadingFinance, setIsUploadingFinance] = React.useState(false);
  const { exchangeRate } = useExchangeRate();

  const [rotationOffset, setRotationOffset] = React.useState(0);

  const SHIFT_SLOTS: ShiftSlot[] = [
    { name: 'Turno Mañana', startTime: '6:00 AM', endTime: '2:00 PM', nightHoursPerDay: 0 },
    { name: 'Turno Tarde', startTime: '2:00 PM', endTime: '10:00 PM', nightHoursPerDay: 3 },
    { name: 'Turno Noche', startTime: '10:00 PM', endTime: '6:00 AM', nightHoursPerDay: 7 },
  ];

  const getShiftForGroup = (group: ShiftGroup) => {
    if (group === ShiftGroup.ADMINISTRATIVE) {
      return { name: 'Administrativo', startTime: '8:00 AM', endTime: '5:00 PM', nightHoursPerDay: 0 };
    }
    if (group === ShiftGroup.NONE) return null;
    
    const groups = [ShiftGroup.GROUP_A, ShiftGroup.GROUP_B, ShiftGroup.GROUP_C];
    const groupIdx = groups.indexOf(group);
    if (groupIdx === -1) return null;
    
    const slotIdx = (groupIdx + rotationOffset) % 3;
    return SHIFT_SLOTS[slotIdx];
  };

  const handleRotateShifts = () => {
    setRotationOffset(prev => (prev + 1) % 3);
    setNotification('🔄 Turnos rotados exitosamente');
    setTimeout(() => setNotification(null), 3000);
  };

  React.useEffect(() => {
    if (viewingEmployee) {
      const updated = employees.find(e => e.id === viewingEmployee.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewingEmployee)) {
        setViewingEmployee(updated);
      }
    }
  }, [employees, viewingEmployee]);

  const hasParafiscalDiscrepanciesLocal = (entry: PayrollEntry) => hasParafiscalDiscrepancies(entry);

  // --- Payroll Entry Form State ---
  const [payrollFormData, setPayrollFormData] = React.useState({
    employeeName: '',
    employeeId: '',
    storeId: (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds[0] : '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    deductions: [
      { name: 'SSO (4%)', amount: 0 }, 
      { name: 'RPE (0.5%)', amount: 0 }, 
      { name: 'FAOV / LPH (1%)', amount: 0 }
    ],
    employerLiabilities: [
      { name: 'SSO Patronal (9%)', amount: 0 }, 
      { name: 'RPE Patronal (2%)', amount: 0 }, 
      { name: 'FAOV Patronal (2%)', amount: 0 }, 
      { name: 'INCES Patronal (2%)', amount: 0 },
      { name: 'Fondo de Pensiones (9%)', amount: 0 },
      { name: 'Provisión Prestaciones (16.66%)', amount: 0 },
      { name: 'Provisión Vacaciones (8.33%)', amount: 0 },
      { name: 'Provisión Utilidades (8.33%)', amount: 0 }
    ],
    nightHoursWorked: 0,
    sundaysHolidaysWorked: 0,
    overtimeHoursWorked: 0,
    bonoNocturnoAmount: 0,
    sundaysHolidaysAmount: 0,
    overtimeAmount: 0
  });

  // --- Employee Form State ---
  const [employeeFormData, setEmployeeFormData] = React.useState<Omit<Employee, 'id'>>({
    code: '',
    nationality: 'VENEZOLANO',
    name: '',
    lastName: '',
    age: 0,
    educationLevel: '',
    position: '',
    department: '',
    positionDescription: '',
    hireDate: new Date().toISOString().split('T')[0],
    socialBenefitsDate: '',
    projectedExitDate: '',
    email: '',
    projectAddress: '',
    directPhone: '',
    emergencyPhone: '',
    homeAddress: '',
    gender: 'M',
    wearsGlasses: 'NO',
    hasCondition: 'NO',
    height: '',
    storeId: (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds[0] : '',
    baseSalary: 0,
    isActive: true,
    bankAccount: '',
    defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    defaultDeductions: [
      { name: 'SSO (4%)', amount: 0 }, 
      { name: 'RPE (0.5%)', amount: 0 }, 
      { name: 'FAOV / LPH (1%)', amount: 0 }
    ],
    defaultEmployerLiabilities: [
      { name: 'SSO Patronal (9%)', amount: 0 }, 
      { name: 'RPE Patronal (2%)', amount: 0 }, 
      { name: 'FAOV Patronal (2%)', amount: 0 }, 
      { name: 'INCES Patronal (2%)', amount: 0 },
      { name: 'Fondo de Pensiones (9%)', amount: 0 },
      { name: 'Provisión Prestaciones (16.66%)', amount: 0 },
      { name: 'Provisión Vacaciones (8.33%)', amount: 0 },
      { name: 'Provisión Utilidades (8.33%)', amount: 0 }
    ],
    shiftGroup: ShiftGroup.NONE
  });
  const [employeeIdInput, setEmployeeIdInput] = React.useState('');

  // --- AR-I Form State ---
  const [isAriModalOpen, setIsAriModalOpen] = React.useState(false);
  const [ariEmployee, setAriEmployee] = React.useState<Employee | null>(null);
  const [ariData, setAriData] = React.useState({
    estimatedIncomeBs: 0,
    estimatedExpensesBs: 0,
    dependents: 0,
    taxUnitValueBs: 9.00
  });

  const calculateARILocal = () => {
    return calculateARI(ariData);
  };

  // --- Prestaciones Sociales State ---
  const [isPrestacionesModalOpen, setIsPrestacionesModalOpen] = React.useState(false);
  const [prestacionesEmployee, setPrestacionesEmployee] = React.useState<Employee | null>(null);
  const [prestacionesEndDate, setPrestacionesEndDate] = React.useState(new Date().toISOString().split('T')[0]);

  // --- Anticipo de Prestaciones State ---
  const [isAnticipoModalOpen, setIsAnticipoModalOpen] = React.useState(false);
  const [anticipoEmployee, setAnticipoEmployee] = React.useState<Employee | null>(null);
  const [anticipoAmount, setAnticipoAmount] = React.useState<number>(0);
  const [anticipoReason, setAnticipoReason] = React.useState<string>('');
  const [maxAnticipo, setMaxAnticipo] = React.useState<number>(0);
  const [accumulatedPrestaciones, setAccumulatedPrestaciones] = React.useState<number>(0);

  const calculatePrestaciones = () => {
    if (!prestacionesEmployee) return null;
    return calculatePrestacionesForEmployee(prestacionesEmployee, prestacionesEndDate);
  };

  const applyLawCalculationsToPayroll = () => {
    const totals = calculateTotals(payrollFormData);
    setPayrollFormData(prev => ({
      ...prev,
      ...totals
    }));
  };

  const applyLawCalculationsToEmployee = () => {
    const { deductions, liabilities } = calculateParafiscales(employeeFormData.baseSalary, employeeFormData.defaultBonuses);
    setEmployeeFormData(prev => ({
      ...prev,
      defaultDeductions: deductions,
      defaultEmployerLiabilities: liabilities
    }));
  };

  const exportToCSV = () => {
    // Define headers
    const headers = [
      'Trabajador',
      'Cédula/ID',
      'Mes',
      'Sueldo Base ($)',
      'Total Bonos ($)',
      'Total Deducciones ($)',
      'Total Pasivos Empresa ($)',
      'Neto Trabajador ($)',
      'Costo Total Empresa ($)',
      'Estado',
      'Fecha Registro'
    ];

    // Map data to rows
    const rows = filteredEntries.map(entry => {
      const totalBonuses = entry.bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = entry.deductions.reduce((sum, d) => sum + d.amount, 0);
      const totalLiabilities = entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
      
      return [
        `"${entry.employeeName}"`,
        `"${entry.employeeId}"`,
        `"${entry.month}"`,
        entry.baseSalary.toFixed(2),
        totalBonuses.toFixed(2),
        totalDeductions.toFixed(2),
        totalLiabilities.toFixed(2),
        entry.totalWorkerNet.toFixed(2),
        entry.totalEmployerCost.toFixed(2),
        `"${entry.status}"`,
        `"${formatDate(entry.submittedDate)}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_nomina_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotalsLocal = (data: any) => {
    return calculateTotals(data);
  };

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotalsLocal(payrollFormData);
    const entry: Omit<PayrollEntry, 'id' | 'submittedDate'> = {
      ...payrollFormData,
      ...totals,
      status: 'PROCESADO'
    };
    await onAddEntry(entry);
    
    setIsAddingEntry(false);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      await onUpdateEmployee({ ...employeeFormData, id: editingEmployee.id } as Employee);
    } else {
      const finalId = employeeIdInput.trim() || employeeFormData.code;
      await onAddEmployee({ ...employeeFormData, id: finalId } as Employee);
    }
    setIsAddingEmployee(false);
    setEditingEmployee(null);
  };

  const handleAdjustParafiscal = async (entry: PayrollEntry, fieldName: string, type: 'deduction' | 'liability') => {
    if (!onUpdateEntry) return;

    const { deductions, liabilities } = calculateParafiscales(entry.baseSalary, entry.bonuses);
    const theoreticalValue = (type === 'deduction' ? deductions : liabilities).find(i => i.name === fieldName)?.amount || 0;

    const updatedEntry = {
      ...entry,
      deductions: type === 'deduction' 
        ? entry.deductions.map(d => d.name === fieldName ? { ...d, amount: theoreticalValue } : d)
        : entry.deductions,
      employerLiabilities: type === 'liability'
        ? entry.employerLiabilities.map(l => l.name === fieldName ? { ...l, amount: theoreticalValue } : l)
        : entry.employerLiabilities
    };

    // Recalcular totales
    const totalBonuses = updatedEntry.bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalDeductions = updatedEntry.deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalLiabilities = updatedEntry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    
    updatedEntry.totalWorkerNet = updatedEntry.baseSalary + totalBonuses - totalDeductions;
    updatedEntry.totalEmployerCost = updatedEntry.baseSalary + totalBonuses + totalLiabilities;

    await onUpdateEntry(updatedEntry);
    setViewingEntry(updatedEntry);
  };

  const handleAutoGeneratePayroll = async () => {
    const activeEmployees = employees.filter(e => e.isActive);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newEntries: PayrollEntry[] = [];
    
    for (const emp of activeEmployees) {
      // Estimate night hours based on current rotation slot
      const shift = getShiftForGroup(emp.shiftGroup as ShiftGroup);
      let estNightHours = 0;
      if (shift) {
        estNightHours = shift.nightHoursPerDay * 22;
      }

      // For auto-generation, we assume 0 sundays and 0 overtime unless specified otherwise
      // but the logic is ready to handle them if we add parameters to this function later
      
      const combinedData = {
        baseSalary: emp.baseSalary,
        bonuses: emp.defaultBonuses,
        deductions: emp.defaultDeductions,
        employerLiabilities: emp.defaultEmployerLiabilities,
        nightHoursWorked: estNightHours,
        sundaysHolidaysWorked: 0,
        overtimeHoursWorked: 0
      };

      const totals = calculateTotals(combinedData);
      const entry: Omit<PayrollEntry, 'id' | 'submittedDate'> = {
        employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
        employeeId: emp.id,
        storeId: emp.storeId,
        month: currentMonth,
        baseSalary: emp.baseSalary,
        bonuses: emp.defaultBonuses,
        deductions: emp.defaultDeductions,
        employerLiabilities: emp.defaultEmployerLiabilities,
        nightHoursWorked: estNightHours,
        sundaysHolidaysWorked: 0,
        overtimeHoursWorked: 0,
        ...totals,
        status: 'PROCESADO'
      };
      const createdEntry = await onAddEntry(entry);
      if (createdEntry) {
        newEntries.push(createdEntry as PayrollEntry);
      } else {
        const fullEntry = { ...entry, id: Math.random().toString(), submittedDate: new Date().toISOString() } as PayrollEntry;
        newEntries.push(fullEntry);
      }
    }

    if (newEntries.length > 0) {
      generateConsolidatedPayrollPDF(newEntries);
      generateBulkPaymentReceiptsPDF(newEntries);
      setNotification('✅ Nómina automática generada (Recibos y PDF Consolidado)');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesId = e.employeeId.toLowerCase().includes(payrollIdFilter.toLowerCase());
    const matchesDate = payrollDateFilter ? e.month === payrollDateFilter : true;
    return matchesId && matchesDate;
  });

  const filteredEmployees = employees.filter(e => 
    `${e.name} ${e.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayrollCost = entries.reduce((acc, e) => acc + e.totalEmployerCost, 0);
  const totalWorkerPayments = entries.reduce((acc, e) => acc + e.totalWorkerNet, 0);
  const totalStateLiabilities = entries.reduce((acc, e) => {
    const liabilitiesSum = e.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    return acc + liabilitiesSum;
  }, 0);

  const payrollByStoreMonth = entries.reduce((acc, entry) => {
    const key = `${entry.month}-${entry.storeId}`;
    if (!acc[key]) {
      acc[key] = {
        month: entry.month,
        storeId: entry.storeId,
        totalWorkerNet: 0,
        totalEmployerCost: 0,
        totalStateLiabilities: 0,
        entriesCount: 0
      };
    }
    acc[key].totalWorkerNet += entry.totalWorkerNet;
    acc[key].totalEmployerCost += entry.totalEmployerCost;
    acc[key].totalStateLiabilities += entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    acc[key].entriesCount += 1;
    return acc;
  }, {} as Record<string, { month: string, storeId: string, totalWorkerNet: number, totalEmployerCost: number, totalStateLiabilities: number, entriesCount: number }>);

  const sortedStoreMonth = Object.values(payrollByStoreMonth).sort((a, b) => b.month.localeCompare(a.month));

  const payrollByMonth = entries.reduce((acc, entry) => {
    if (!acc[entry.month]) {
      acc[entry.month] = {
        month: entry.month,
        totalWorkerNet: 0,
        totalEmployerCost: 0,
        totalStateLiabilities: 0,
        entriesCount: 0,
        ssoTotal: 0,
        lphTotal: 0,
        incesTotal: 0
      };
    }
    acc[entry.month].totalWorkerNet += entry.totalWorkerNet;
    acc[entry.month].totalEmployerCost += entry.totalEmployerCost;
    acc[entry.month].totalStateLiabilities += entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    acc[entry.month].entriesCount += 1;
    
    entry.employerLiabilities.forEach(l => {
      const name = l.name.toLowerCase();
      if (name.includes('sso') || name.includes('seguro social')) acc[entry.month].ssoTotal += l.amount;
      else if (name.includes('lph') || name.includes('vivienda')) acc[entry.month].lphTotal += l.amount;
      else if (name.includes('inces')) acc[entry.month].incesTotal += l.amount;
    });

    return acc;
  }, {} as Record<string, { month: string, totalWorkerNet: number, totalEmployerCost: number, totalStateLiabilities: number, entriesCount: number, ssoTotal: number, lphTotal: number, incesTotal: number }>);

  const sortedMonths = Object.values(payrollByMonth).sort((a, b) => b.month.localeCompare(a.month));

  const allPpeAssignments = React.useMemo(() => {
    const assignments: { 
      employeeName: string; 
      employeeId: string; 
      storeId: string; 
      assignment: PPEAssignment 
    }[] = [];

    employees.forEach(emp => {
      if (emp.ppeAssignments) {
        emp.ppeAssignments.forEach(ass => {
          assignments.push({
            employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
            employeeId: emp.id,
            storeId: emp.storeId,
            assignment: ass
          });
        });
      }
    });

    return assignments.filter(item => {
      const matchesSearch = item.employeeName.toLowerCase().includes(ppeSearchTerm.toLowerCase()) || 
                            item.employeeId.toLowerCase().includes(ppeSearchTerm.toLowerCase());
      const matchesStore = ppeStoreFilter ? item.storeId === ppeStoreFilter : true;
      const matchesDate = ppeDateFilter ? item.assignment.date.startsWith(ppeDateFilter) : true;
      return matchesSearch && matchesStore && matchesDate;
    }).sort((a, b) => new Date(b.assignment.date).getTime() - new Date(a.assignment.date).getTime());
  }, [employees, ppeSearchTerm, ppeStoreFilter, ppeDateFilter]);

  const handleExportPpeCSV = () => {
    const data = allPpeAssignments.map(item => ({
      Fecha: formatDate(item.assignment.date),
      Trabajador: item.employeeName,
      ID: item.employeeId,
      Tienda: stores.find(s => s.id === item.storeId)?.name || 'N/A',
      Equipos: item.assignment.items.map(ppe => `${ppe.cantidad}x ${ppe.name}`).join('; '),
      'Costo Total ($)': item.assignment.totalCost,
      'Costo Total (Bs)': item.assignment.totalCost * exchangeRate
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial EPP");
    XLSX.writeFile(wb, `Historial_EPP_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPpePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Historial de Entrega de EPP', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de reporte: ${formatDate(new Date())}`, 14, 30);
    
    const tableData = allPpeAssignments.map(item => [
      formatDate(item.assignment.date),
      item.employeeName,
      stores.find(s => s.id === item.storeId)?.name || 'N/A',
      item.assignment.items.map(ppe => `${ppe.cantidad}x ${ppe.name}`).join(', '),
      `$${item.assignment.totalCost.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Fecha', 'Trabajador', 'Tienda', 'Equipos', 'Costo ($)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Historial_EPP_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generatePaymentReceiptPDF = (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>, doc?: jsPDF) => {
    const isBulk = !!doc;
    const currentDoc = doc || new jsPDF();
    const store = stores.find(s => s.id === entry.storeId);
    
    // Header
    currentDoc.setFontSize(20);
    currentDoc.setTextColor(37, 99, 235);
    currentDoc.text('RECIBO DE PAGO', 105, 20, { align: 'center' });
    
    currentDoc.setFontSize(12);
    currentDoc.setTextColor(100);
    currentDoc.text('Forza 22 - Gestión de Nómina', 105, 28, { align: 'center' });
    
    // Employee Info
    currentDoc.setDrawColor(200);
    currentDoc.line(14, 35, 196, 35);
    
    currentDoc.setFontSize(10);
    currentDoc.setTextColor(0);
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text('DATOS DEL TRABAJADOR', 14, 45);
    
    currentDoc.setFont('helvetica', 'normal');
    currentDoc.text(`Nombre: ${entry.employeeName}`, 14, 52);
    currentDoc.text(`Cédula/ID: ${entry.employeeId}`, 14, 57);
    currentDoc.text(`Tienda: ${store?.name || 'N/A'}`, 14, 62);
    currentDoc.text(`Periodo: ${entry.month}`, 14, 67);
    
    // Financial Details
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text('DETALLE DE PAGO', 14, 80);
    
    const tableData: any[][] = [
      ['Concepto', 'Asignaciones ($)', 'Deducciones ($)']
    ];
    
    tableData.push(['Sueldo Base', `$${entry.baseSalary.toLocaleString()}`, '']);
    
    if (entry.bonoNocturnoAmount && entry.bonoNocturnoAmount > 0) {
      tableData.push([`Bono Nocturno (${entry.nightHoursWorked}h)`, `$${entry.bonoNocturnoAmount.toLocaleString()}`, '']);
    }
    if (entry.sundaysHolidaysAmount && entry.sundaysHolidaysAmount > 0) {
      tableData.push([`Feriados / Domingos (${entry.sundaysHolidaysWorked}d)`, `$${entry.sundaysHolidaysAmount.toLocaleString()}`, '']);
    }
    if (entry.overtimeAmount && entry.overtimeAmount > 0) {
      tableData.push([`Horas Extra (${entry.overtimeHoursWorked}h)`, `$${entry.overtimeAmount.toLocaleString()}`, '']);
    }

    entry.bonuses.forEach(b => {
      tableData.push([b.name, `$${b.amount.toLocaleString()}`, '']);
    });
    
    entry.deductions.forEach(d => {
      tableData.push([d.name, '', `$${d.amount.toLocaleString()}`]);
    });
    
    autoTable(currentDoc, {
      startY: 85,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      foot: [['TOTAL NETO', `$${entry.totalWorkerNet.toLocaleString()}`, '']],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    const finalY = (currentDoc as any).lastAutoTable.finalY + 10;
    
    // Totals in Local Currency
    currentDoc.setFontSize(11);
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text(`Total a Pagar: $${entry.totalWorkerNet.toLocaleString()}`, 14, finalY);
    currentDoc.text(`Equivalente en Bs (Tasa ${exchangeRate}): Bs. ${(entry.totalWorkerNet * exchangeRate).toLocaleString()}`, 14, finalY + 7);
    
    // Signature area
    currentDoc.line(14, finalY + 40, 80, finalY + 40);
    currentDoc.text('Firma del Trabajador', 14, finalY + 45);
    
    currentDoc.line(130, finalY + 40, 196, finalY + 40);
    currentDoc.text('Sello y Firma Patrono', 130, finalY + 45);
    
    if (!isBulk) {
      currentDoc.save(`Recibo_${entry.employeeName.replace(/ /g, '_')}_${entry.month}.pdf`);
    }
  };

  const generateBulkPaymentReceiptsPDF = (entries: PayrollEntry[]) => {
    if (entries.length === 0) return;
    const doc = new jsPDF();
    entries.forEach((entry, index) => {
      if (index > 0) doc.addPage();
      generatePaymentReceiptPDF(entry, doc);
    });
    doc.save(`Recibos_Nomina_Masivo_${entries[0]?.month || 'Reporte'}.pdf`);
  };

  const handleSendBulkEmails = async () => {
    if (filteredEntries.length === 0) return;
    setIsSendingEmails(true);
    try {
      const result = await service.notifications.notifyBulkPayrollReceipts(
        filteredEntries, 
        employees, 
        settings || null
      );
      setNotification(result.message);
    } catch (error) {
      console.error('Error sending emails:', error);
      setNotification(`❌ Error: ${error instanceof Error ? error.message : 'Error de conexión al servidor'}`);
    } finally {
      setIsSendingEmails(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const generateAnticipoReceiptPDF = (employee: Employee, amount: number, accumulated: number, reason: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('RECIBO DE ANTICIPO DE PRESTACIONES', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Forza 22 - Gestión de Nómina', 105, 28, { align: 'center' });
    
    // Employee Info
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL TRABAJADOR', 14, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${employee.name} ${employee.lastName}`, 14, 52);
    doc.text(`Cédula/ID: ${employee.id}`, 14, 57);
    doc.text(`Cargo: ${employee.position}`, 14, 62);
    doc.text(`Fecha de Ingreso: ${employee.hireDate}`, 14, 67);
    
    // Advance Details
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL ANTICIPO (Art. 144 LOTTT)', 14, 80);
    
    const tableData: any[][] = [
      ['Concepto', 'Monto ($)', 'Monto (Bs.)']
    ];
    
    tableData.push(['Fondo de Garantía Acumulado', `$${accumulated.toLocaleString(undefined, {minimumFractionDigits: 2})}`, `Bs. ${(accumulated * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}`]);
    tableData.push(['Monto Solicitado (Anticipo)', `$${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, `Bs. ${(amount * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}`]);
    
    autoTable(doc, {
      startY: 85,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Reason
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo de la Solicitud:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    const splitReason = doc.splitTextToSize(reason || 'No especificado', 180);
    doc.text(splitReason, 14, finalY + 7);
    
    // Legal Note
    doc.setFontSize(8);
    doc.setTextColor(100);
    const legalText = "De conformidad con el Artículo 144 de la LOTTT, el trabajador tiene derecho a un anticipo de hasta el 75% de lo acreditado en su Fondo de Garantía de Prestaciones Sociales para satisfacer obligaciones derivadas de vivienda, educación, salud o pensiones alimenticias.";
    const splitLegal = doc.splitTextToSize(legalText, 180);
    doc.text(splitLegal, 14, finalY + 25);
    
    // Signature area
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.line(14, finalY + 60, 80, finalY + 60);
    doc.text('Firma del Trabajador', 14, finalY + 65);
    
    doc.line(130, finalY + 60, 196, finalY + 60);
    doc.text('Sello y Firma Patrono', 130, finalY + 65);
    
    doc.save(`Anticipo_${employee.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateConsolidatedPayrollPDF = (entries: PayrollEntry[]) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Consolidado de Nómina', 14, 22);
    doc.setFontSize(11);
    doc.text(`Periodo: ${entries[0]?.month || 'N/A'}`, 14, 30);
    doc.text(`Fecha de reporte: ${formatDate(new Date())}`, 14, 35);

    const tableData = entries.map(entry => [
      entry.employeeName,
      entry.employeeId,
      stores.find(s => s.id === entry.storeId)?.name || 'N/A',
      `$${entry.baseSalary.toLocaleString()}`,
      `$${entry.bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}`,
      `$${entry.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`,
      `$${entry.totalWorkerNet.toLocaleString()}`,
      `$${entry.totalEmployerCost.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Trabajador', 'ID', 'Tienda', 'Sueldo Base', 'Bonos', 'Deducciones', 'Neto', 'Costo Empresa']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Consolidado_Nomina_${entries[0]?.month || 'Reporte'}.pdf`);
  };

  const generatePayrollTXT = (entries: PayrollEntry[]) => {
    const lines = entries.map(entry => {
      const employee = employees.find(e => e.id === entry.employeeId);
      return `${entry.employeeId};${entry.employeeName};${entry.totalWorkerNet.toFixed(2)};${employee?.bankAccount || 'N/A'}`;
    });
    
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nomina_${entries[0]?.month || 'Reporte'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-24 lg:pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20">
              <Users className="text-slate-900 dark:text-white" size={24} />
            </div>
            Gestión de Nómina
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Control de expedientes, pasivos laborales y salarios</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {activeTab === 'payroll' ? (
            <>
              <div className="flex flex-wrap gap-2 items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Cédula de Identidad"
                    value={payrollIdFilter}
                    onChange={(e) => setPayrollIdFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-44 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="month"
                    value={payrollDateFilter}
                    onChange={(e) => setPayrollDateFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-44 text-slate-900 dark:text-white"
                  />
                </div>
                <button 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 text-sm"
                >
                  <Search size={16} />
                  Filtrar
                </button>
              </div>
              <button 
                onClick={handleAutoGeneratePayroll}
                disabled={employees.filter(e => e.isActive).length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Wand2 size={20} />
                Generar Nómina Automática
              </button>
              <button 
                onClick={() => generatePayrollTXT(filteredEntries)}
                disabled={filteredEntries.length === 0}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <FileText size={20} />
                Generar Archivo TXT
              </button>
              <button 
                onClick={() => setIsFinanceModalOpen(true)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
              >
                <Landmark size={20} />
                Finanzas
              </button>
              <button 
                onClick={handleSendBulkEmails}
                disabled={filteredEntries.length === 0 || isSendingEmails}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                {isSendingEmails ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Mail size={20} />
                )}
                {isSendingEmails ? 'Enviando...' : 'Enviar Recibos por Correo'}
              </button>
              {activeTab === 'payroll' && (
                <p className="text-[10px] text-gray-400 mt-1 text-center w-full block">
                  * Nota: Si usas el modo de prueba de Resend, solo podrás enviar correos a tu propia dirección verificada.
                </p>
              )}
            </>
          ) : activeTab === 'employees' ? (
            <button 
              onClick={() => {
                const nextCode = (() => {
                  if (employees.length === 0) return 'EMP-0001';
                  const codes = employees
                    .map(e => {
                      const match = e.code.match(/\d+/);
                      return match ? parseInt(match[0], 10) : 0;
                    })
                    .filter(n => !isNaN(n));
                  const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
                  return `EMP-${(maxCode + 1).toString().padStart(4, '0')}`;
                })();

                setEditingEmployee(null);
                setEmployeeIdInput('');
                setEmployeeFormData({
                  code: nextCode,
                  nationality: 'VENEZOLANO',
                  name: '',
                  lastName: '',
                  age: 0,
                  educationLevel: '',
                  position: '',
                  department: '',
                  positionDescription: '',
                  hireDate: new Date().toISOString().split('T')[0],
                  socialBenefitsDate: '',
                  projectedExitDate: '',
                  email: '',
                  projectAddress: '',
                  directPhone: '',
                  emergencyPhone: '',
                  homeAddress: '',
                  gender: 'M',
                  wearsGlasses: 'NO',
                  hasCondition: 'NO',
                  height: '',
                  storeId: (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds[0] : '',
                  baseSalary: 0,
                  isActive: true,
                  bankAccount: '',
                  defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
                  defaultDeductions: [
                    { name: 'SSO (4%)', amount: 0 }, 
                    { name: 'RPE (0.5%)', amount: 0 }, 
                    { name: 'FAOV / LPH (1%)', amount: 0 }
                  ],
                  defaultEmployerLiabilities: [
                    { name: 'SSO Patronal (9%)', amount: 0 }, 
                    { name: 'RPE Patronal (2%)', amount: 0 }, 
                    { name: 'FAOV Patronal (2%)', amount: 0 }, 
                    { name: 'INCES Patronal (2%)', amount: 0 },
                    { name: 'Fondo de Pensiones (9%)', amount: 0 },
                    { name: 'Provisión Prestaciones (16.66%)', amount: 0 },
                    { name: 'Provisión Vacaciones (8.33%)', amount: 0 },
                    { name: 'Provisión Utilidades (8.33%)', amount: 0 }
                  ],
                  ppeAssignments: [],
                  shiftGroup: ShiftGroup.NONE
                });
                setIsAddingEmployee(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <UserPlus size={20} />
              Nuevo Expediente
            </button>
          ) : (
            <button 
              onClick={() => {
                setActiveTab('employees');
                setNotification('Seleccione un trabajador para realizar una entrega de EPP');
              }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
            >
              <ShieldCheck size={20} />
              Nueva Entrega de EPP
            </button>
          )}
        </div>
      </div>

      {/* Verification Banner */}
      {activeTab === 'payroll' && filteredEntries.some(hasParafiscalDiscrepancies) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-2xl text-slate-900 dark:text-white shadow-lg shadow-orange-500/20">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-400">Discrepancias de Ley Detectadas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Se han encontrado diferencias entre los aportes manuales y los cálculos teóricos de SSO, RPE, FAOV e INCES.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
            {filteredEntries.filter(hasParafiscalDiscrepancies).length} REGISTROS AFECTADOS
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payroll' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <Calculator size={18} />
          Histórico de Nómina
        </button>
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'employees' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <Contact size={18} />
          Expedientes de Empleados
        </button>
        <button 
          onClick={() => setActiveTab('ppe-history')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ppe-history' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <History size={18} />
          Historial EPP
        </button>
        <button 
          onClick={() => setActiveTab('shifts')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'shifts' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <Clock size={18} />
          Horarios Rotativos
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'attendance' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <UserCheck size={18} />
          Asistencia Diaria
        </button>
        <button 
          onClick={() => setActiveTab('daily-payroll')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'daily-payroll' ? 'bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
          }`}
        >
          <DollarSign size={18} />
          Nómina Diaria
        </button>
      </div>

      {activeTab === 'payroll' ? (
        <>
          {/* Stats Grid */}
          <PayrollStatsGrid 
            totalPayrollCost={totalPayrollCost}
            totalWorkerPayments={totalWorkerPayments}
            totalStateLiabilities={totalStateLiabilities}
          />

          {/* Summary Tables */}
          <PayrollSummaryTables 
            sortedStoreMonth={sortedStoreMonth}
            sortedMonths={sortedMonths}
            stores={stores}
          />

          {/* Payroll Table */}
          <PayrollHistoryTable 
            entries={filteredEntries}
            employees={employees}
            stores={stores}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExportCSV={exportToCSV}
            onSyncAll={async () => {
              let syncCount = 0;
              if (!onUpdateEntry) return;
              
              for (const entry of filteredEntries) {
                const emp = employees.find(e => e.id === entry.employeeId);
                if (emp) {
                  const totals = calculateTotals({
                    baseSalary: emp.baseSalary,
                    bonuses: emp.defaultBonuses,
                    deductions: emp.defaultDeductions,
                    employerLiabilities: emp.defaultEmployerLiabilities
                  });
                  
                  const updatedEntry = {
                    ...entry,
                    employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
                    baseSalary: emp.baseSalary,
                    bonuses: emp.defaultBonuses,
                    deductions: emp.defaultDeductions,
                    employerLiabilities: emp.defaultEmployerLiabilities,
                    ...totals
                  };
                  await onUpdateEntry(updatedEntry);
                  syncCount++;
                }
              }
              
              if (syncCount > 0) {
                setNotification(`🔄 ${syncCount} registros sincronizados con sus expedientes`);
              } else {
                setNotification('⚠️ No se encontraron trabajadores para sincronizar');
              }
              setTimeout(() => setNotification(null), 3000);
            }}
            onSyncSingle={async (entry) => {
              const emp = employees.find(e => e.id === entry.employeeId);
              if (emp && onUpdateEntry) {
                const totals = calculateTotals({
                  baseSalary: emp.baseSalary,
                  bonuses: emp.defaultBonuses,
                  deductions: emp.defaultDeductions,
                  employerLiabilities: emp.defaultEmployerLiabilities
                });
                
                const updatedEntry = {
                  ...entry,
                  employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
                  baseSalary: emp.baseSalary,
                  bonuses: emp.defaultBonuses,
                  deductions: emp.defaultDeductions,
                  employerLiabilities: emp.defaultEmployerLiabilities,
                  ...totals
                };
                await onUpdateEntry(updatedEntry);
                setNotification('🔄 Registro sincronizado con expediente');
                setTimeout(() => setNotification(null), 3000);
              } else {
                setNotification('⚠️ No se encontró el trabajador en el expediente');
                setTimeout(() => setNotification(null), 3000);
              }
            }}
            onViewEmployee={setViewingEmployee}
            onViewDetails={setViewingEntry}
            onGeneratePDF={generatePaymentReceiptPDF}
            onDeleteEntry={(id) => {
              const entry = entries.find(e => e.id === id);
              setConfirmModal({
                isOpen: true,
                title: '¿Eliminar registro de nómina?',
                message: `¿Estás seguro de que deseas eliminar el registro de nómina de ${entry?.employeeName || 'este trabajador'}? Esta acción no se puede deshacer.`,
                onConfirm: () => onDeleteEntry(id)
              });
            }}
            onSendEmail={async (entry, emp) => {
              setNotification(`📧 Enviando recibo a ${emp.email}...`);
              await service.notifications.notifyPayrollReceipt(entry, emp, settings || null);
              setNotification('✅ Recibo enviado correctamente');
              setTimeout(() => setNotification(null), 3000);
            }}
            hasMorePayroll={hasMorePayroll}
            onLoadMorePayroll={onLoadMorePayroll}
          />
        </>
      ) : activeTab === 'employees' ? (
        <PayrollEmployeesTable 
          employees={employees}
          stores={stores}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddEmployee={() => {
            setEditingEmployee(null);
            setEmployeeIdInput('');
            setEmployeeFormData({
              code: '',
              nationality: 'VENEZOLANO',
              name: '',
              lastName: '',
              age: 0,
              educationLevel: '',
              position: '',
              department: '',
              positionDescription: '',
              hireDate: new Date().toISOString().split('T')[0],
              socialBenefitsDate: '',
              projectedExitDate: '',
              email: '',
              projectAddress: '',
              directPhone: '',
              emergencyPhone: '',
              homeAddress: '',
              gender: 'M',
              wearsGlasses: 'NO',
              hasCondition: 'NO',
              height: '',
              storeId: (currentUser?.storeIds && currentUser.storeIds.length > 0) ? currentUser.storeIds[0] : '',
              baseSalary: 0,
              isActive: true,
              bankAccount: '',
              defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
              defaultDeductions: [
                { name: 'SSO (4%)', amount: 0 }, 
                { name: 'RPE (0.5%)', amount: 0 }, 
                { name: 'FAOV / LPH (1%)', amount: 0 }
              ],
              defaultEmployerLiabilities: [
                { name: 'SSO Patronal (9%)', amount: 0 }, 
                { name: 'RPE Patronal (2%)', amount: 0 }, 
                { name: 'FAOV Patronal (2%)', amount: 0 }, 
                { name: 'INCES Patronal (2%)', amount: 0 },
                { name: 'Fondo de Pensiones (9%)', amount: 0 },
                { name: 'Provisión Prestaciones (16.66%)', amount: 0 },
                { name: 'Provisión Vacaciones (8.33%)', amount: 0 },
                { name: 'Provisión Utilidades (8.33%)', amount: 0 }
              ],
              shiftGroup: ShiftGroup.NONE
            });
            setIsAddingEmployee(true);
          }}
          onViewEmployee={setViewingEmployee}
          onEditEmployee={(emp) => {
            setEditingEmployee(emp);
            setEmployeeIdInput(emp.id);
            setEmployeeFormData({ ...emp });
            setIsAddingEmployee(true);
          }}
          onDeleteEmployee={(id) => {
            const emp = employees.find(e => e.id === id);
            setConfirmModal({
              isOpen: true,
              title: '¿Eliminar expediente de empleado?',
              message: `¿Estás seguro de que deseas eliminar el expediente de ${emp?.name} ${emp?.lastName || ''}? Se perderán todos sus datos históricos. Esta acción no se puede deshacer.`,
              onConfirm: () => onDeleteEmployee(id)
            });
          }}
          onSolicitarAnticipo={(emp) => {
            const result = calculatePrestacionesForEmployee(emp);
            if (result) {
              setAnticipoEmployee(emp);
              setAccumulatedPrestaciones(result.finalAmount);
              setMaxAnticipo(result.finalAmount * 0.75);
              setAnticipoAmount(result.finalAmount * 0.75);
              setIsAnticipoModalOpen(true);
            }
          }}
          onCalcularPrestaciones={(emp) => {
            setPrestacionesEmployee(emp);
            setPrestacionesEndDate(new Date().toISOString().split('T')[0]);
            setIsPrestacionesModalOpen(true);
          }}
          onCalcularARI={(emp) => {
            setAriEmployee(emp);
            setAriData({
              estimatedIncomeBs: (emp.baseSalary * exchangeRate) * 12,
              estimatedExpensesBs: 0,
              dependents: 0,
              taxUnitValueBs: 9.00
            });
            setIsAriModalOpen(true);
          }}
          onGestionarPPE={(emp) => {
            setPpeEmployee(emp);
            setIsPPEModalOpen(true);
          }}
          hasMoreEmployees={hasMoreEmployees}
          onLoadMoreEmployees={onLoadMoreEmployees}
        />
      ) : activeTab === 'shifts' ? (
        <PayrollShiftsView 
          employees={employees}
          stores={stores}
          onRotateShifts={handleRotateShifts}
          rotationOffset={rotationOffset}
          getShiftForGroup={getShiftForGroup}
          onConfigureWebhook={() => setIsWebhookModalOpen(true)}
        />
      ) : activeTab === 'attendance' ? (
        <PayrollAttendanceView employees={employees} />
      ) : activeTab === 'daily-payroll' ? (
        <PayrollDailyView employees={employees} />
      ) : (
        <PayrollPPEHistoryTable 
          assignments={allPpeAssignments}
          employees={employees}
          stores={stores}
          searchTerm={ppeSearchTerm}
          onSearchChange={setPpeSearchTerm}
          storeFilter={ppeStoreFilter}
          onStoreFilterChange={setPpeStoreFilter}
          dateFilter={ppeDateFilter}
          onDateFilterChange={setPpeDateFilter}
          onExportCSV={handleExportPpeCSV}
          onExportPDF={handleExportPpePDF}
          onViewEmployee={setViewingEmployee}
          exchangeRate={exchangeRate}
        />
      )}

      {/* Add Payroll Entry Modal */}
      <PayrollAddEntryModal 
        isOpen={isAddingEntry}
        onClose={() => setIsAddingEntry(false)}
        employees={employees}
        payrollFormData={payrollFormData}
        setPayrollFormData={setPayrollFormData}
        onSubmit={handlePayrollSubmit}
        getShiftForGroup={getShiftForGroup}
        calculateTotals={calculateTotals}
        calculateLOTTTExtras={calculateLOTTTExtras}
        calculateParafiscales={calculateParafiscales}
        getParafiscalDiff={getParafiscalDiff}
        currentUser={currentUser}
        stores={stores}
        exchangeRate={exchangeRate}
        applyLawCalculationsToPayroll={applyLawCalculationsToPayroll}
      />

      {/* Add Employee Modal */}
      <PayrollAddEmployeeModal
        isOpen={isAddingEmployee}
        onClose={() => setIsAddingEmployee(false)}
        editingEmployee={editingEmployee}
        employeeFormData={employeeFormData}
        setEmployeeFormData={setEmployeeFormData}
        employeeIdInput={employeeIdInput}
        setEmployeeIdInput={setEmployeeIdInput}
        onSubmit={handleEmployeeSubmit}
        calculateParafiscales={calculateParafiscales}
        getParafiscalDiff={getParafiscalDiff}
        currentUser={currentUser}
        stores={stores}
        applyLawCalculationsToEmployee={applyLawCalculationsToEmployee}
      />

      {/* Modals */}
      <AnimatePresence>
        {isPPEModalOpen && ppeEmployee && (
          <PPEModal 
            employee={ppeEmployee} 
            onClose={() => {
              setIsPPEModalOpen(false);
              setPpeEmployee(null);
            }} 
            onSave={onUpdateEmployee}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* View Employee Detail Modal */}
      <PayrollViewEmployeeModal
        employee={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        exchangeRate={exchangeRate}
        onOpenPPE={() => {
          setPpeEmployee(viewingEmployee);
          setIsPPEModalOpen(true);
        }}
        onOpenPrestaciones={() => {
          setPrestacionesEmployee(viewingEmployee);
          setPrestacionesEndDate(new Date().toISOString().split('T')[0]);
          setIsPrestacionesModalOpen(true);
        }}
        onOpenARI={() => {
          setAriEmployee(viewingEmployee);
          setAriData({
            estimatedIncomeBs: (viewingEmployee!.baseSalary * exchangeRate) * 12,
            estimatedExpensesBs: 0,
            dependents: 0,
            taxUnitValueBs: 9.00
          });
          setIsAriModalOpen(true);
        }}
        formatDate={formatDate}
      />

      {/* View Payroll Entry Detail Modal */}
      <PayrollViewEntryModal
        entry={viewingEntry}
        onClose={() => setViewingEntry(null)}
        stores={stores}
        formatDate={formatDate}
        formatTime={formatTime}
        getParafiscalDiff={getParafiscalDiff}
        onUpdateEntry={onUpdateEntry}
        onAdjustParafiscal={handleAdjustParafiscal}
      />

      {/* AR-I Calculator Modal */}
      <PayrollARIModal
        isOpen={isAriModalOpen}
        onClose={() => setIsAriModalOpen(false)}
        employee={ariEmployee}
        ariData={ariData}
        onAriDataChange={setAriData}
        calculateARI={calculateARI}
        exchangeRate={exchangeRate}
      />

      {/* Prestaciones Sociales (LOTTT) Modal */}
      <PayrollPrestacionesModal
        isOpen={isPrestacionesModalOpen}
        onClose={() => setIsPrestacionesModalOpen(false)}
        employee={prestacionesEmployee}
        endDate={prestacionesEndDate}
        onEndDateChange={setPrestacionesEndDate}
        exchangeRate={exchangeRate}
        calculatePrestaciones={calculatePrestaciones}
        onSolicitarAnticipo={(employee, amount) => {
          const res = calculatePrestaciones();
          setAnticipoEmployee(employee);
          setAccumulatedPrestaciones(amount);
          setMaxAnticipo(res?.maxAnticipo || amount * 0.75);
          setAnticipoAmount(0);
          setIsAnticipoModalOpen(true);
          setIsPrestacionesModalOpen(false);
        }}
      />
      {/* Anticipo de Prestaciones Modal */}
      <PayrollAnticipoModal
        isOpen={isAnticipoModalOpen}
        onClose={() => setIsAnticipoModalOpen(false)}
        employee={anticipoEmployee}
        accumulatedPrestaciones={accumulatedPrestaciones}
        maxAnticipo={maxAnticipo}
        anticipoAmount={anticipoAmount}
        onAnticipoAmountChange={setAnticipoAmount}
        anticipoReason={anticipoReason}
        onAnticipoReasonChange={setAnticipoReason}
        exchangeRate={exchangeRate}
        onGenerateReceipt={() => {
          if (anticipoEmployee) {
            generateAnticipoReceiptPDF(anticipoEmployee, anticipoAmount, accumulatedPrestaciones, anticipoReason);
          }
        }}
      />

      {/* Finance Module - Payroll Payment Modal */}
      <PayrollFinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        entries={filteredEntries}
        dateFilter={payrollDateFilter}
        onDateFilterChange={setPayrollDateFilter}
        exchangeRate={exchangeRate}
        isUploading={isUploadingFinance}
        comprobanteUrl={financeComprobante}
        onUploadComprobante={async (file) => {
          setIsUploadingFinance(true);
          try {
            const path = `payroll/finance/${Date.now()}_${file.name}`;
            const url = await service.uploadFile(file, path);
            setFinanceComprobante(url);
            setNotification(`✅ Comprobante subido exitosamente`);
          } catch (err) {
            setNotification(`❌ Error al subir comprobante`);
          } finally {
            setIsUploadingFinance(false);
          }
        }}
        onSave={() => {
          setNotification(`✅ Registro de pago guardado exitosamente`);
          setIsFinanceModalOpen(false);
        }}
      />

      {isWebhookModalOpen && (
        <PayrollWebhookModal onClose={() => setIsWebhookModalOpen(false)} />
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100] px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
              <AlertCircle size={18} />
            </div>
            <span className="text-slate-900 dark:text-white font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
