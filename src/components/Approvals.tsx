
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, PaymentStatus, Role, User } from '../types';
import { formatDate, formatDateTime } from '../utils';
import { 
  CheckCircle2, 
  XCircle, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Calendar, 
  Receipt, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  CheckSquare,
  ChevronDown,
  FileText,
  ExternalLink,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Target,
  DollarSign,
  Building2,
  User as UserIcon,
  History,
  ShieldCheck,
  RefreshCw,
  Download,
  Plus,
  Check
} from 'lucide-react';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface ApprovalsProps {
  payments: Payment[];
  onApprove: (id: string, newDueDate?: string, newBudgetAmount?: number, checklist?: Payment['checklist']) => void;
  onReject: (id: string, reason: string, newDueDate?: string, newBudgetAmount?: number, checklist?: Payment['checklist']) => void;
  onUpdatePayment?: (payment: Payment) => void;
  currentUser?: User;
  onApproveAll: () => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

type SortOption = 'urgency' | 'date_desc' | 'amount_desc' | 'amount_asc';

export const Approvals: React.FC<ApprovalsProps> = ({ 
  payments, 
  onApprove, 
  onReject, 
  onUpdatePayment,
  currentUser, 
  onApproveAll,
  onLoadMore,
  hasMore = false
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortOption, setSortOption] = React.useState<SortOption>('urgency');
  const [isImageFullscreen, setIsImageFullscreen] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { exchangeRate } = useExchangeRate();
  
  // --- Checklist State ---
  const [checklist, setChecklist] = React.useState({
    receiptValid: false,
    stampLegible: false,
    storeConceptMatch: false,
    datesApproved: false,
    proposedDatesApproved: false,
    amountsApproved: false,
    proposedAmountApproved: false,
    observationsApproved: false
  });

  const isChecklistComplete = Object.values(checklist).every(val => val === true);

  const [approvedPaymentId, setApprovedPaymentId] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownloadAuditPDF = async (payment: Payment) => {
    if (!payment.history) return;
    setIsExporting(true);
    
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Historial de Auditoría - Pago #${payment.id.slice(-6)}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Tienda: ${payment.storeName}`, 14, 30);
        doc.text(`Concepto: ${payment.specificType}`, 14, 35);
        doc.text(`Monto: $${payment.amount.toLocaleString()}`, 14, 40);
        doc.text(`Fecha de Generación: ${formatDateTime(new Date())}`, 14, 45);

        const tableData = payment.history.map(log => [
            formatDateTime(log.date),
            log.action,
            log.actorName,
            log.role,
            log.note || '-'
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Fecha/Hora', 'Acción', 'Usuario', 'Rol', 'Observación']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 8 },
        });

        doc.save(`Auditoria_Pago_${payment.id.slice(-6)}.pdf`);
    } catch (error) {
        console.error("Error generating audit PDF:", error);
        alert("Error al generar el PDF de auditoría.");
    } finally {
        setIsExporting(false);
    }
  };

  // Filtrado y Ordenamiento
  const processedPayments = React.useMemo(() => {
    let filtered = payments.filter(p => 
      (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE) &&
      (p.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.specificType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'urgency': 
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'date_desc': 
            return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        default: return 0;
      }
    });
  }, [payments, searchTerm, sortOption]);

  const selectedPayment = payments.find(p => p.id === selectedId);

  React.useEffect(() => {
    setRejectionNote('');
    setIsRejecting(false);
    setIsImageFullscreen(false);
    setImageError(false);
    
    if (selectedPayment && selectedPayment.checklist) {
      setChecklist({
        receiptValid: selectedPayment.checklist.receiptValid || false,
        stampLegible: selectedPayment.checklist.stampLegible || false,
        storeConceptMatch: selectedPayment.checklist.storeConceptMatch || false,
        datesApproved: selectedPayment.checklist.datesApproved || false,
        proposedDatesApproved: selectedPayment.checklist.proposedDatesApproved || false,
        amountsApproved: selectedPayment.checklist.amountsApproved || false,
        proposedAmountApproved: selectedPayment.checklist.proposedAmountApproved || false,
        observationsApproved: selectedPayment.checklist.observationsApproved || false
      });
    } else {
      setChecklist({
        receiptValid: false,
        stampLegible: false,
        storeConceptMatch: false,
        datesApproved: false,
        proposedDatesApproved: false,
        amountsApproved: false,
        proposedAmountApproved: false,
        observationsApproved: false
      });
    }
  }, [selectedId, selectedPayment]);

  const handleCheckItem = (item: keyof typeof checklist) => {
    const newValue = !checklist[item];
    const newChecklist = { ...checklist, [item]: newValue };
    setChecklist(newChecklist);

    if (selectedPayment && onUpdatePayment) {
        let updatedPayment = { ...selectedPayment, checklist: newChecklist };
        let changed = false;

        if (item === 'proposedDatesApproved') {
            if (newValue && selectedPayment.proposedDueDate) {
                updatedPayment.previousDueDate = selectedPayment.dueDate;
                updatedPayment.dueDate = selectedPayment.proposedDueDate;
                
                // Recalcular daysToExpire
                if (updatedPayment.paymentDate) {
                    const d1 = new Date(updatedPayment.paymentDate);
                    const d2 = new Date(updatedPayment.dueDate);
                    const diffTime = d2.getTime() - d1.getTime();
                    updatedPayment.daysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                changed = true;
            } else if (!newValue && selectedPayment.previousDueDate) {
                updatedPayment.dueDate = selectedPayment.previousDueDate;
                updatedPayment.previousDueDate = undefined;

                // Recalcular daysToExpire
                if (updatedPayment.paymentDate) {
                    const d1 = new Date(updatedPayment.paymentDate);
                    const d2 = new Date(updatedPayment.dueDate);
                    const diffTime = d2.getTime() - d1.getTime();
                    updatedPayment.daysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                changed = true;
            }
        }

        if (item === 'proposedAmountApproved') {
            if (newValue && selectedPayment.proposedAmount !== undefined) {
                updatedPayment.previousAmount = selectedPayment.amount;
                updatedPayment.amount = selectedPayment.proposedAmount;
                
                // Actualizar isOverBudget
                if (updatedPayment.originalBudget !== undefined) {
                    updatedPayment.isOverBudget = updatedPayment.amount > updatedPayment.originalBudget;
                }
                changed = true;
            } else if (!newValue && selectedPayment.previousAmount !== undefined) {
                updatedPayment.amount = selectedPayment.previousAmount;
                updatedPayment.previousAmount = undefined;

                // Actualizar isOverBudget
                if (updatedPayment.originalBudget !== undefined) {
                    updatedPayment.isOverBudget = updatedPayment.amount > updatedPayment.originalBudget;
                }
                changed = true;
            }
        }

        // Siempre actualizamos el checklist en la DB para persistir el estado de la revisión
        onUpdatePayment(updatedPayment);
    }
  };

  const handleRejectClick = () => {
    if (!isRejecting) {
        setIsRejecting(true);
    } else {
        if (selectedId && rejectionNote.trim() && !isSubmitting) {
            setIsSubmitting(true);
            onReject(
                selectedId, 
                rejectionNote, 
                undefined,
                undefined,
                checklist
            );
            setSelectedId(null);
            setIsRejecting(false);
            setRejectionNote('');
            setIsSubmitting(false);
        }
    }
  };

  const handleApproveClick = () => {
      if (selectedId && selectedPayment && !isSubmitting) {
          setIsSubmitting(true);
          setApprovedPaymentId(selectedId);
          
          setTimeout(() => {
              onApprove(selectedId, undefined, undefined);
              setSelectedId(null);
              setApprovedPaymentId(null);
              setIsSubmitting(false);
          }, 1500);
      }
  };

  const isPdf = (url?: string) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      // Verificación robusta para data URIs y URLs normales
      return lowerUrl.includes('application/pdf') || lowerUrl.endsWith('.pdf') || lowerUrl.includes('type=pdf');
  };

  const openInNewTab = (url: string) => {
    const win = window.open();
    if (win) {
        // Usar iframe para PDF suele forzar el visor nativo del navegador
        const isPDF = isPdf(url);
        const content = isPDF 
            ? `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`
            : `<img src="${url}" style="max-width:100%; margin:auto; display:block;" />`;
            
        win.document.write(`
            <html>
                <head><title>Visor de Documento - Forza 22</title></head>
                <body style="margin:0; background-color:#1e293b; height:100vh; display:flex;">
                    ${content}
                </body>
            </html>
        `);
    }
  };

  const getUrgencyDetails = (dueDateStr: string, status?: PaymentStatus) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(dueDateStr + 'T00:00:00');
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = diffDays < 0 || status === PaymentStatus.OVERDUE;

      if (isOverdue) {
          return { 
              label: `Vencido (${Math.abs(diffDays)}d)`, 
              colorClass: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400',
              borderClass: 'border-l-4 border-l-red-600',
              textClass: 'text-red-600 dark:text-red-400',
              cardBg: 'bg-red-50/50 dark:bg-red-900/10',
              badge: <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter animate-pulse shadow-sm">Crítico</span>,
              icon: <AlertTriangle size={14} className="animate-bounce" />
          };
      } else if (diffDays === 0) {
          return { 
              label: 'Vence Hoy', 
              colorClass: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400',
              borderClass: 'border-l-4 border-l-orange-500',
              textClass: 'text-orange-600 dark:text-orange-400',
              icon: <Clock size={14} />
          };
      } else if (diffDays <= 3) {
          return { 
              label: `${diffDays} días`, 
              colorClass: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400',
              borderClass: 'border-l-4 border-l-yellow-500',
              textClass: 'text-yellow-600 dark:text-yellow-400',
              icon: <Clock size={14} />
          };
      } else {
          return { 
              label: 'A tiempo', 
              colorClass: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400',
              borderClass: 'border-l-4 border-l-emerald-500',
              textClass: 'text-emerald-600 dark:text-emerald-400',
              icon: <Calendar size={14} />
          };
      }
  };

  const budgetAnalysis = React.useMemo(() => {
      if (!selectedPayment) return null;
      
      // Lógica solicitada:
      // Presupuesto = Monto de detalle financiero (selectedPayment.amount)
      // Pago = Monto del documento cargado (selectedPayment.documentAmount)
      
      const budget = Number(selectedPayment.amount);
      const actual = Number(selectedPayment.documentAmount || selectedPayment.amount);

      if (!budget || isNaN(budget) || budget === 0) return null;

      const excess = actual - budget;
      const percent = (excess / budget) * 100;
      const excessBs = excess * exchangeRate;
      
      return {
          budget,
          actual,
          excess,
          excessBs,
          percent,
          isOver: excess > 0.01
      };
  }, [selectedPayment, exchangeRate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
      
      {/* LEFT PANEL: List & Filters */}
      <div className={`w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="text-blue-600 dark:text-blue-400" />
                    Auditoría
                </h1>
                <div className="flex items-center gap-2">
                    {(currentUser?.role === Role.PRESIDENT || currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.AUDITOR) && (
                        <button 
                            onClick={onApproveAll}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                            <CheckCircle2 size={14} />
                            Aprobar Todo
                        </button>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
                        {processedPayments.length}
                    </span>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1 group">
                    <input 
                        type="text" 
                        placeholder="Buscar ID, Tienda, Concepto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-all shadow-sm"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
                <div className="relative group">
                    <button className="h-full px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-xs font-black uppercase tracking-tight transition-all shadow-sm group-hover:shadow-md">
                        <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 group-hover:text-blue-500 transition-colors">
                            <ArrowUpDown size={14} />
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Ordenar por</span>
                            <span className="hidden sm:inline">
                                {sortOption === 'urgency' && 'Urgencia'}
                                {sortOption === 'date_desc' && 'Recientes'}
                                {sortOption === 'amount_desc' && 'Mayor Monto'}
                                {sortOption === 'amount_asc' && 'Menor Monto'}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2 transform origin-top-right scale-95 group-hover:scale-100">
                        <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Criterios de Orden</span>
                        </div>
                        
                        <button 
                            onClick={() => setSortOption('urgency')} 
                            className={`w-full text-left px-3 py-2.5 text-[11px] rounded-xl flex items-center gap-3 transition-all ${
                                sortOption === 'urgency' 
                                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                            }`}
                        >
                            <Clock size={14} className={sortOption === 'urgency' ? 'text-white' : 'text-slate-400'} />
                            <span className="flex-1">Por Urgencia (Vencimiento)</span>
                            {sortOption === 'urgency' && <Check size={14} strokeWidth={3} />}
                        </button>

                        <button 
                            onClick={() => setSortOption('date_desc')} 
                            className={`w-full text-left px-3 py-2.5 text-[11px] rounded-xl flex items-center gap-3 mt-1 transition-all ${
                                sortOption === 'date_desc' 
                                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                            }`}
                        >
                            <History size={14} className={sortOption === 'date_desc' ? 'text-white' : 'text-slate-400'} />
                            <span className="flex-1">Más Recientes (Carga)</span>
                            {sortOption === 'date_desc' && <Check size={14} strokeWidth={3} />}
                        </button>

                        <button 
                            onClick={() => setSortOption('amount_desc')} 
                            className={`w-full text-left px-3 py-2.5 text-[11px] rounded-xl flex items-center gap-3 mt-1 transition-all ${
                                sortOption === 'amount_desc' 
                                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                            }`}
                        >
                            <TrendingUp size={14} className={sortOption === 'amount_desc' ? 'text-white' : 'text-slate-400'} />
                            <span className="flex-1">Mayor Monto</span>
                            {sortOption === 'amount_desc' && <Check size={14} strokeWidth={3} />}
                        </button>

                        <button 
                            onClick={() => setSortOption('amount_asc')} 
                            className={`w-full text-left px-3 py-2.5 text-[11px] rounded-xl flex items-center gap-3 mt-1 transition-all ${
                                sortOption === 'amount_asc' 
                                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                            }`}
                        >
                            <DollarSign size={14} className={sortOption === 'amount_asc' ? 'text-white' : 'text-slate-400'} />
                            <span className="flex-1">Menor Monto</span>
                            {sortOption === 'amount_asc' && <Check size={14} strokeWidth={3} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
            {processedPayments.length > 0 && (
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-t-xl rounded-br-xl shadow-lg shadow-blue-500/20 animate-in slide-in-from-left-2 duration-300">
                        {sortOption === 'urgency' && <Clock size={12} strokeWidth={3} />}
                        {sortOption === 'date_desc' && <History size={12} strokeWidth={3} />}
                        {sortOption === 'amount_desc' && <TrendingUp size={12} strokeWidth={3} />}
                        {sortOption === 'amount_asc' && <DollarSign size={12} strokeWidth={3} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {sortOption === 'urgency' && 'Por Urgencia'}
                            {sortOption === 'date_desc' && 'Por Recientes'}
                            {sortOption === 'amount_desc' && 'Por Mayor Monto'}
                            {sortOption === 'amount_asc' && 'Por Menor Monto'}
                        </span>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {processedPayments.length} Resultados
                    </div>
                </div>
            )}
            
            {processedPayments.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-slate-300 dark:text-slate-500" size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cola vacía</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">No hay pagos pendientes para revisar.</p>
                 </div>
            ) : (
                processedPayments.map(payment => {
                    const urgency = getUrgencyDetails(payment.dueDate, payment.status);
                    
                    return (
                        <div 
                            key={payment.id}
                            onClick={() => setSelectedId(payment.id)}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${urgency.borderClass} ${urgency.cardBg || ''} ${
                                selectedId === payment.id 
                                ? 'bg-white dark:bg-slate-800 border-blue-500/50 shadow-md ring-1 ring-blue-500/20 z-10' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-col min-w-0 pr-2">
                                     <div className="flex items-center gap-1.5 mb-0.5">
                                         <span className="text-[10px] font-mono font-bold text-slate-400">{payment.id}</span>
                                         {payment.status === PaymentStatus.UPLOADED ? (
                                             <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1 rounded uppercase font-bold tracking-tight">Nuevo</span>
                                         ) : payment.status === PaymentStatus.OVERDUE ? (
                                             urgency.badge || <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded uppercase font-bold tracking-tight">Vencido</span>
                                         ) : (
                                             <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded uppercase font-bold tracking-tight">Pendiente</span>
                                         )}
                                     </div>
                                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                                        {payment.storeName}
                                     </h3>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                                            ${payment.amount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            Bs. {(payment.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {payment.isOverBudget && (
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-red-500 font-bold mt-0.5">
                                            <AlertTriangle size={10} />
                                            <span>Excede</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{payment.specificType}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${urgency.textClass}`}>
                                    {urgency.icon}
                                    <span>{urgency.label}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                    Vence: {formatDate(payment.dueDate)}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            
            {hasMore && onLoadMore && (
                <div className="pt-4 pb-8 flex justify-center">
                    <button 
                        onClick={onLoadMore}
                        className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 group"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Cargar más pagos
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* RIGHT PANEL: Detail View */}
      <div className={`flex-1 bg-gray-100 dark:bg-gray-800 relative flex flex-col h-full ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedPayment ? (
            <>
                {/* Overlay de Aprobación Animado */}
                {approvedPaymentId === selectedPayment.id && (
                    <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle2 className="text-green-500 dark:text-green-400" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pago Aprobado!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">El pago ha sido validado correctamente.</p>
                    </div>
                )}

                {/* Detail Header */}
                <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedId(null)} className="lg:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                            <ArrowUpDown className="rotate-90" size={20} />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Building2 size={16} className="text-blue-500" />
                                {selectedPayment.storeName}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span>Ref: {selectedPayment.id}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                {selectedPayment.status === PaymentStatus.OVERDUE || (new Date(selectedPayment.dueDate + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0)) ? (
                                    <span className="text-red-600 dark:text-red-400 font-black uppercase animate-pulse flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        Pago Vencido - Crítico
                                    </span>
                                ) : (
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Verificando Pago</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Fecha de Carga</p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {formatDateTime(selectedPayment.submittedDate)}
                            </p>
                         </div>
                    </div>
                </div>

                {/* Banner de Urgencia Crítica */}
                {(selectedPayment.status === PaymentStatus.OVERDUE || (new Date(selectedPayment.dueDate + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0))) && (
                    <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between shadow-lg z-10">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                            <AlertTriangle size={18} className="animate-bounce" />
                            <span className="tracking-wide">ATENCIÓN: ESTE PAGO ESTÁ VENCIDO Y REQUIERE ACCIÓN INMEDIATA</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded border border-white/30">Prioridad Máxima</span>
                        </div>
                    </div>
                )}

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-white dark:bg-slate-900">
                    <div className="max-w-[1200px] mx-auto">
                        {/* Header: SOLO PARA AUDITOR */}
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                    <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Terminal de Auditoría v2.0</span>
                                </div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    Panel de <span className="text-blue-600">Control</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
                                    Revisión técnica de cumplimiento fiscal y administrativo para la validación de egresos corporativos.
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado del Protocolo</p>
                                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all ${
                                        isChecklistComplete 
                                        ? 'bg-emerald-50 border-emerald-500/30 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                        : 'bg-amber-50 border-amber-500/30 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                    }`}>
                                        <div className={`h-2.5 w-2.5 rounded-full ${isChecklistComplete ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                                        <span className="text-xs font-black uppercase tracking-wider">{isChecklistComplete ? 'Validación Lista' : 'Revisión Pendiente'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-12">
                            
                            {/* LEFT COLUMN: Document & Checklist */}
                            <div className="space-y-10">
                                {/* CARGA DE DOCUMENTOS */}
                                <div className="flex flex-col h-full min-h-[650px]">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-4 flex flex-col h-full shadow-sm">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documento de Soporte</div>
                                            <div className="flex gap-2">
                                                {selectedPayment.receiptUrl && (
                                                    <>
                                                        <button 
                                                            onClick={() => openInNewTab(selectedPayment.receiptUrl!)}
                                                            className="p-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                                            title="Abrir en pestaña nueva"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsImageFullscreen(true)}
                                                            className="p-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                                            title="Pantalla completa"
                                                        >
                                                            <Maximize2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl relative overflow-hidden group border border-slate-100 dark:border-slate-800 shadow-inner flex flex-col gap-6 p-4 overflow-y-auto">
                                            {((selectedPayment.attachments && selectedPayment.attachments.length > 0) 
                                                ? selectedPayment.attachments 
                                                : [selectedPayment.receiptUrl, selectedPayment.receiptUrl2].filter(Boolean)
                                            ).map((url, idx) => (
                                                <div key={`attachment-${idx}`} className="w-full min-h-[400px] flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800 rounded-xl relative bg-slate-50/50 dark:bg-slate-950/20">
                                                    <div className="absolute top-2 left-2 bg-slate-900/60 text-white text-[8px] px-2 py-1 rounded-lg uppercase font-black tracking-widest z-10 backdrop-blur-md border border-white/10">
                                                        Soporte #{idx + 1} {idx === 0 ? '(Principal)' : ''}
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                                                        <button 
                                                            onClick={() => openInNewTab(url!)}
                                                            className="p-1.5 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white transition-colors shadow-sm"
                                                            title="Ver Pantalla Completa"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </div>
                                                    {isPdf(url) ? (
                                                        <embed
                                                            src={url}
                                                            type="application/pdf"
                                                            className="w-full h-[600px] rounded-lg"
                                                        />
                                                    ) : (
                                                        <img 
                                                            src={url} 
                                                            alt={`Soporte ${idx + 1}`} 
                                                            className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                                                            onError={() => setImageError(true)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {!(selectedPayment.attachments?.length) && !selectedPayment.receiptUrl && (
                                                <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                    <FileText size={48} strokeWidth={1} className="text-slate-200 dark:text-slate-800 mb-4" />
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sin Comprobantes Disponibles</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CHECKLIST: APROBADA */}
                                    <div className="mt-10">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Protocolo de Validación</div>
                                            </div>
                                            <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/50">
                                                {Object.values(checklist).filter(Boolean).length} / 8
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {[
                                                { id: 'receiptValid', label: 'Comprobantes y soportes legibles' },
                                                { id: 'stampLegible', label: 'Sellos y firmas identificables' },
                                                { id: 'storeConceptMatch', label: 'Coincidencia de Tienda y Concepto' }
                                            ].map((item) => (
                                                <div key={item.id} className="flex group transition-all duration-300">
                                                    <button 
                                                        onClick={() => handleCheckItem(item.id as keyof typeof checklist)}
                                                        className={`w-14 h-14 border-r border-slate-100 dark:border-slate-800/50 flex items-center justify-center transition-all duration-300 ${
                                                            checklist[item.id as keyof typeof checklist] 
                                                            ? 'bg-blue-600 text-white shadow-inner' 
                                                            : 'bg-white dark:bg-slate-900 text-slate-200 dark:text-slate-700 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 group-hover:text-slate-400'
                                                        }`}
                                                    >
                                                        {checklist[item.id as keyof typeof checklist] 
                                                            ? <Check size={22} strokeWidth={4} /> 
                                                            : <div className="w-6 h-6 border-2 border-current rounded-lg transition-transform group-hover:scale-110"></div>
                                                        }
                                                    </button>
                                                    <div className={`flex-1 px-5 flex items-center text-xs font-bold uppercase tracking-tight transition-colors duration-300 ${
                                                        checklist[item.id as keyof typeof checklist] 
                                                        ? 'text-slate-900 dark:text-white' 
                                                        : 'text-slate-400 dark:text-slate-600'
                                                    }`}>
                                                        {item.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Tables & Data */}
                            <div className="space-y-8">
                                {/* CONCEPTO DE PAGO */}
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-150"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Identificador de Transacción</div>
                                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
                                                    <span className="text-blue-600">#</span>{selectedPayment.id.slice(-8).toUpperCase()}
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span className="text-slate-500 dark:text-slate-400">{selectedPayment.specificType}</span>
                                                </h2>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <Building2 size={14} className="text-blue-500" />
                                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{selectedPayment.storeName}</span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">{selectedPayment.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right self-end md:self-start">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Monto de Operación</div>
                                            <div className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                                ${selectedPayment.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRID DE TABLAS TÉCNICAS Y OBSERVACIONES */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* COLUMNA IZQUIERDA */}
                                    <div className="flex flex-col gap-6">
                                        {/* TABLE 1: CRONOGRAMA */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cronograma</div>
                                                <button 
                                                    onClick={() => handleCheckItem('datesApproved')}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                                                        checklist.datesApproved 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase">Validar</span>
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Alerta</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Vencimiento</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase">Fecha de documento</div>
                                                </div>
                                                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">{formatDate(selectedPayment.paymentDate)}</div>
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">{formatDate(selectedPayment.dueDate)}</div>
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">{selectedPayment.documentDate ? formatDate(selectedPayment.documentDate) : '—'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TABLE 3: PROPUESTA DE EXTENSION */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Propuesta de Nueva Fecha</div>
                                                <button 
                                                    onClick={() => handleCheckItem('proposedDatesApproved')}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                                                        checklist.proposedDatesApproved 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase">Validar</span>
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Alerta</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Días</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase">Vencimiento</div>
                                                </div>
                                                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                                                    <div className="text-center py-4 font-bold text-blue-600 dark:text-blue-400">{selectedPayment.proposedPaymentDate ? formatDate(selectedPayment.proposedPaymentDate) : formatDate(selectedPayment.paymentDate)}</div>
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">{selectedPayment.proposedDaysToExpire ?? (selectedPayment.daysToExpire || '0')}</div>
                                                    <div className="text-center py-4 font-bold text-blue-600 dark:text-blue-400">{selectedPayment.proposedDueDate ? formatDate(selectedPayment.proposedDueDate) : formatDate(selectedPayment.dueDate)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* OBSERVACIONES (Notas del Pago) */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas del Pago</div>
                                                <button 
                                                    onClick={() => handleCheckItem('observationsApproved')}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                                                        checklist.observationsApproved 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase">Validar</span>
                                                </button>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-h-[120px] shadow-inner">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                                    {selectedPayment.notes || "Sin observaciones registradas por el administrador."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA */}
                                    <div className="flex flex-col gap-6">
                                        {/* TABLE 2: ANALISIS PRESUPUESTARIO */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desviacion de presupuesto</div>
                                                <button 
                                                    onClick={() => handleCheckItem('amountsApproved')}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                                                        checklist.amountsApproved 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase">Validar</span>
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                                <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Presupuesto</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase border-r border-slate-200 dark:border-slate-700">Monto Documento</div>
                                                    <div className="text-[9px] font-black text-slate-400 text-center py-2 uppercase">Desviación</div>
                                                </div>
                                                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">${(selectedPayment.originalBudget || selectedPayment.amount || 0).toLocaleString()}</div>
                                                    <div className="text-center py-4 font-bold text-slate-700 dark:text-slate-300">${(selectedPayment.documentAmount || selectedPayment.amount).toLocaleString()}</div>
                                                    <div className={`text-center py-4 font-black ${budgetAnalysis && budgetAnalysis.percent > 0.01 ? 'text-red-600' : budgetAnalysis && budgetAnalysis.percent < -0.01 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                        {budgetAnalysis ? `${budgetAnalysis.percent > 0.01 ? '+' : ''}${budgetAnalysis.percent.toFixed(1)}%` : '0%'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TABLE 4: MONTO DE LA PROPUESTA */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto de la Propuesta</div>
                                                <button 
                                                    onClick={() => handleCheckItem('proposedAmountApproved')}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                                                        checklist.proposedAmountApproved 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase">Validar</span>
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col items-center justify-center py-4 h-[68px]">
                                                <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                                    ${(selectedPayment.proposedAmount ?? selectedPayment.amount).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* HISTORIAL DE CAMBIOS (TRAZABILIDAD) */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <div className="flex items-center gap-2">
                                                    <History size={14} className="text-slate-400" />
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Historial de Cambios</div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDownloadAuditPDF(selectedPayment)}
                                                    disabled={isExporting}
                                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                                                >
                                                    <Download size={10} />
                                                    {isExporting ? 'Exportando...' : 'Exportar PDF'}
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-h-[150px] max-h-[400px] overflow-y-auto shadow-sm space-y-4 custom-scrollbar">
                                                {selectedPayment.history && selectedPayment.history.length > 0 ? (
                                                    [...selectedPayment.history].reverse().map((log, idx) => (
                                                        <div key={idx} className="flex items-start gap-4 border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0 group/log">
                                                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 border-2 border-white dark:border-slate-900 shadow-sm ${
                                                                log.action === 'CREACION' ? 'bg-blue-500' :
                                                                log.action === 'APROBACION' || log.action === 'APROBACION_MASIVA' ? 'bg-emerald-500' :
                                                                log.action === 'RECHAZO' ? 'bg-red-500' :
                                                                'bg-amber-500'
                                                            }`}></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                                                                        {log.action === 'CREACION' ? 'Creación de Pago' :
                                                                         log.action === 'APROBACION' ? 'Pago Aprobado' :
                                                                         log.action === 'RECHAZO' ? 'Pago Devuelto/Rechazado' :
                                                                         log.action === 'ACTUALIZACION' ? 'Actualización de Datos' :
                                                                         log.action === 'CORRECCION' ? 'Corrección Enviada' :
                                                                         log.action}
                                                                    </p>
                                                                    <span className="text-[9px] font-mono font-bold text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                        {formatDateTime(log.date)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                        <UserIcon size={10} />
                                                                        <span>{log.actorName}</span>
                                                                    </div>
                                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                                                        {log.role}
                                                                    </span>
                                                                </div>
                                                                {log.note && (
                                                                    <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700"></div>
                                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed pl-1">
                                                                            {log.note}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                        <History size={32} strokeWidth={1} className="mb-3 opacity-10" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sin Trazabilidad</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN */}
                                <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex-1 w-full space-y-2">
                                            <button 
                                                onClick={handleRejectClick}
                                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-3 ${
                                                    isRejecting 
                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                                                    : 'bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900'
                                                }`}
                                            >
                                                <XCircle size={20} />
                                                Devolver Pago
                                            </button>
                                            <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                                                Se activará el flujo de corrección y se notificará al administrador.
                                            </p>
                                        </div>
                                        
                                        <div className="flex-1 w-full space-y-2">
                                            <button 
                                                onClick={handleApproveClick}
                                                disabled={!isChecklistComplete || isSubmitting}
                                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-3 shadow-2xl ${
                                                    isChecklistComplete 
                                                    ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed grayscale'
                                                }`}
                                            >
                                                <CheckCircle2 size={20} />
                                                Validar y Aprobar
                                            </button>
                                            <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                                                {isChecklistComplete 
                                                    ? 'Protocolo validado. Listo para aprobar.' 
                                                    : 'Requiere la validación de los 8 puntos del protocolo de auditoría.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rejection Note Area (Inline) */}
                                    {isRejecting && (
                                        <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertCircle size={16} className="text-red-600" />
                                                <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">Motivo de Devolución para el Administrador</div>
                                            </div>
                                            <textarea 
                                                value={rejectionNote}
                                                onChange={(e) => setRejectionNote(e.target.value)}
                                                placeholder="Escriba detalladamente las correcciones necesarias..."
                                                className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-800 rounded-2xl text-sm mb-4 focus:border-red-500 outline-none transition-all min-h-[120px] shadow-inner"
                                                autoFocus
                                            ></textarea>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => setIsRejecting(false)}
                                                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={handleRejectClick}
                                                    disabled={!rejectionNote.trim()}
                                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                                                >
                                                    Confirmar Devolución
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <Search size={48} className="text-slate-200 dark:text-slate-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Seleccione un pago</h2>
                <p className="max-w-md mx-auto text-slate-500 dark:text-slate-500">
                    Haga clic en cualquier elemento de la lista izquierda para ver sus detalles, comprobar el recibo y realizar la auditoría.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
