import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Landmark, 
  Plus, 
  Calendar, 
  RefreshCw, 
  FileStack 
} from 'lucide-react';
import { PayrollEntry } from '../types';

interface PayrollFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: PayrollEntry[];
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  exchangeRate: number;
  onUploadComprobante: (file: File) => Promise<void>;
  isUploading: boolean;
  comprobanteUrl: string | null;
  onSave: () => void;
}

export const PayrollFinanceModal: React.FC<PayrollFinanceModalProps> = ({
  isOpen,
  onClose,
  entries,
  dateFilter,
  onDateFilterChange,
  exchangeRate,
  onUploadComprobante,
  isUploading,
  comprobanteUrl,
  onSave
}) => {
  const totalNet = entries.reduce((acc, e) => acc + e.totalWorkerNet, 0);
  const totalEmployerCost = entries.reduce((acc, e) => acc + e.totalEmployerCost, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                    <Landmark size={24} />
                  </div>
                  Módulo de Finanzas - Pago de Nómina
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Registro de comprobantes de pago de nómina</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Resumen de Nómina</h3>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    <input 
                      type="month"
                      value={dateFilter || new Date().toISOString().slice(0, 7)}
                      onChange={(e) => onDateFilterChange(e.target.value)}
                      className="bg-transparent text-slate-900 dark:text-white font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Neto a Pagar</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                      ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Bs. {(totalNet * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Costo Empresa</div>
                    <div className="text-2xl font-bold text-blue-500 font-mono">
                      ${totalEmployerCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Bs. {(totalEmployerCost * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comprobante de Pago de Nómina</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await onUploadComprobante(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800/20 group-hover:bg-slate-800/40 transition-all">
                    {isUploading ? (
                      <RefreshCw className="text-blue-500 animate-spin" size={40} />
                    ) : (
                      <FileStack className="text-slate-500" size={40} />
                    )}
                    <div className="text-center">
                      <p className="text-slate-900 dark:text-white font-bold truncate max-w-xs">
                        {comprobanteUrl ? `Comprobante Cargado: ${comprobanteUrl.split('/').pop()?.split('_').slice(1).join('_') || 'Ver Archivo'}` : 'Haz clic o arrastra el comprobante de pago'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">Formatos: PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-colors"
              >
                Cerrar
              </button>
              <button 
                disabled={!comprobanteUrl || isUploading}
                onClick={onSave}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 transition-all"
              >
                Guardar Registro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
