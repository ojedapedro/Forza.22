import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  X, 
  FileText, 
  TrendingDown, 
  ShieldCheck, 
  Calculator, 
  Wand2 
} from 'lucide-react';
import { PayrollEntry, Employee } from '../types';
import { Store } from '../../../types';

interface PayrollViewEntryModalProps {
  entry: PayrollEntry | null;
  onClose: () => void;
  stores: Store[];
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getParafiscalDiff: (name: string, amount: number, baseSalary: number, bonuses: any[]) => any;
  onAdjustParafiscal?: (entry: PayrollEntry, name: string, type: 'deduction' | 'liability') => void;
  onUpdateEntry?: (entry: PayrollEntry) => Promise<void>;
}

export const PayrollViewEntryModal: React.FC<PayrollViewEntryModalProps> = ({
  entry,
  onClose,
  stores,
  formatDate,
  formatTime,
  getParafiscalDiff,
  onAdjustParafiscal
}) => {
  if (!entry) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-950 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl custom-scrollbar"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detalle de Nómina</h2>
                  <p className="text-slate-500 font-mono text-sm">{entry.id} • {entry.month}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empleado</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{entry.employeeName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.employeeId}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tienda</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stores.find(s => s.id === entry.storeId)?.name || 'N/A'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID: {entry.storeId}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Registro</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatDate(entry.submittedDate)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatTime(entry.submittedDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deducciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="text-red-400" size={20} />
                  Deducciones del Trabajador
                </h3>
                <div className="space-y-3">
                  {entry.deductions.map((d, idx) => {
                    const { theoretical, diff, hasDiff } = getParafiscalDiff(d.name, d.amount, entry.baseSalary, entry.bonuses);
                    return (
                      <div key={idx} className={`p-4 rounded-xl border transition-all ${
                        hasDiff ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-slate-300">{d.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-900 dark:text-white font-bold">${d.amount.toLocaleString()}</span>
                            {hasDiff && onAdjustParafiscal && (
                              <button
                                onClick={() => onAdjustParafiscal(entry, d.name, 'deduction')}
                                className="p-1.5 bg-orange-500 text-slate-900 dark:text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                title="Ajustar a Ley"
                              >
                                <Wand2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {hasDiff && (
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">LEY: ${theoretical.toLocaleString()}</span>
                            <span className={diff > 0 ? 'text-red-400' : 'text-green-400'}>
                              DIF: {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pasivos Patronales */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-blue-400" size={20} />
                  Pasivos Patronales
                </h3>
                <div className="space-y-3">
                  {entry.employerLiabilities.map((l, idx) => {
                    const { theoretical, diff, hasDiff } = getParafiscalDiff(l.name, l.amount, entry.baseSalary, entry.bonuses);
                    return (
                      <div key={idx} className={`p-4 rounded-xl border transition-all ${
                        hasDiff ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-slate-300">{l.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-900 dark:text-white font-bold">${l.amount.toLocaleString()}</span>
                            {hasDiff && onAdjustParafiscal && (
                              <button
                                onClick={() => onAdjustParafiscal(entry, l.name, 'liability')}
                                className="p-1.5 bg-orange-500 text-slate-900 dark:text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                title="Ajustar a Ley"
                              >
                                <Wand2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {hasDiff && (
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">LEY: ${theoretical.toLocaleString()}</span>
                            <span className={diff > 0 ? 'text-red-400' : 'text-green-400'}>
                              DIF: {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
              <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sueldo Base</p>
                <p className="text-2xl font-mono font-bold text-blue-400">${entry.baseSalary.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Neto Trabajador</p>
                <p className="text-2xl font-mono font-bold text-emerald-400">${entry.totalWorkerNet.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/20">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Costo Empresa</p>
                <p className="text-2xl font-mono font-bold text-orange-400">${entry.totalEmployerCost.toLocaleString()}</p>
              </div>
            </div>

            {/* LOTTT Components Detail */}
            {(entry.bonoNocturnoAmount || entry.sundaysHolidaysAmount || entry.overtimeAmount) && (
              <div className="mb-8 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Calculator size={16} /> Detalle de Componentes LOTTT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {entry.bonoNocturnoAmount ? (
                    <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Bono Nocturno</p>
                        <p className="text-xs text-slate-300">{entry.nightHoursWorked} horas</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-white">${entry.bonoNocturnoAmount.toLocaleString()}</p>
                    </div>
                  ) : null}
                  {entry.sundaysHolidaysAmount ? (
                    <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Feriados / Domingos</p>
                        <p className="text-xs text-slate-300">{entry.sundaysHolidaysWorked} días</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-white">${entry.sundaysHolidaysAmount.toLocaleString()}</p>
                    </div>
                  ) : null}
                  {entry.overtimeAmount ? (
                    <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Horas Extra</p>
                        <p className="text-xs text-slate-300">{entry.overtimeHoursWorked} horas</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-white">${entry.overtimeAmount.toLocaleString()}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
