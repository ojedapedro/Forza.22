import React from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Briefcase, 
  AlertTriangle, 
  Mail, 
  Trash2, 
  RefreshCw as SyncIcon,
  CheckCircle2,
  Clock,
  FileText,
  Eye
} from 'lucide-react';
import { PayrollEntry, Employee } from '../types';
import { Store } from '../../../types';
import { hasParafiscalDiscrepancies } from '../utils/lotttCalculations';
import { useExchangeRate } from '../../../contexts/ExchangeRateContext';

interface PayrollHistoryTableProps {
  entries: PayrollEntry[];
  employees: Employee[];
  stores: Store[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onExportCSV: () => void;
  onSyncAll: () => Promise<void>;
  onSyncSingle?: (entry: PayrollEntry) => Promise<void>;
  onViewEmployee: (emp: Employee) => void;
  onViewDetails?: (entry: PayrollEntry) => void;
  onGeneratePDF?: (entry: PayrollEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSendEmail: (entry: PayrollEntry, employee: Employee) => Promise<void>;
  hasMorePayroll: boolean;
  onLoadMorePayroll?: () => Promise<void>;
}

export const PayrollHistoryTable: React.FC<PayrollHistoryTableProps> = ({
  entries,
  employees,
  stores,
  searchTerm,
  onSearchChange,
  onExportCSV,
  onSyncAll,
  onSyncSingle,
  onViewEmployee,
  onViewDetails,
  onGeneratePDF,
  onDeleteEntry,
  onSendEmail,
  hasMorePayroll,
  onLoadMorePayroll
}) => {
  const { exchangeRate } = useExchangeRate();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await onSyncAll();
    setIsSyncing(false);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm mt-6">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar en histórico detallado..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExportCSV}
            disabled={entries.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={handleSync}
            disabled={entries.length === 0 || isSyncing}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Sincroniza todos los registros visibles con los datos actuales de sus expedientes"
          >
            <SyncIcon size={18} className={isSyncing ? 'animate-spin' : ''} />
            Sincronizar Todo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajador</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sueldo Base</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajador</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <Briefcase size={48} className="opacity-20" />
                    <p>No se encontraron registros de nómina.</p>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const emp = employees.find(e => e.id === entry.employeeId);
                return (
                  <tr key={entry.id} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => {
                          if (emp) onViewEmployee(emp);
                        }}
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 font-bold group-hover/name:bg-blue-500 group-hover/name:text-white transition-colors">
                          {entry.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-slate-900 dark:text-white group-hover/name:text-blue-400 transition-colors">{entry.employeeName}</div>
                            {hasParafiscalDiscrepancies(entry) && (
                              <div className="group/warn relative">
                                <AlertTriangle size={14} className="text-orange-500 animate-pulse" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/warn:block w-48 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-300 z-50">
                                  Discrepancia detectada entre aportes manuales y cálculos de ley.
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{entry.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {stores.find(s => s.id === entry.storeId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{entry.month}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white font-bold">${entry.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-emerald-500 dark:text-emerald-400">${entry.totalWorkerNet.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(entry.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-blue-500 dark:text-blue-400">${entry.totalEmployerCost.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(entry.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.status === 'PROCESADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {entry.status === 'PROCESADO' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => emp && onSendEmail(entry, emp)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                          title="Volver a enviar recibo"
                        >
                          <Mail size={18} />
                        </button>
                        <button 
                          onClick={() => onGeneratePDF && onGeneratePDF(entry)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                          title="Generar Recibo PDF"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => onSyncSingle && onSyncSingle(entry)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                          title="Sincronizar con Expediente"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => onViewDetails && onViewDetails(entry)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                          title="Ver Detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          title="Eliminar Registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {hasMorePayroll && onLoadMorePayroll && (
          <div className="p-4 flex justify-center border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={onLoadMorePayroll}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-500 dark:text-blue-400 transition-all flex items-center gap-2 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Cargar más registros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
