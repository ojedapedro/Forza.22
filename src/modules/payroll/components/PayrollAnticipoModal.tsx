import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  HandCoins, 
  Plus, 
  DollarSign, 
  AlertCircle, 
  Download 
} from 'lucide-react';
import { Employee } from '../types';

interface PayrollAnticipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  accumulatedPrestaciones: number;
  maxAnticipo: number;
  anticipoAmount: number;
  onAnticipoAmountChange: (amount: number) => void;
  anticipoReason: string;
  onAnticipoReasonChange: (reason: string) => void;
  onGenerateReceipt: () => void;
  exchangeRate: number;
}

export const PayrollAnticipoModal: React.FC<PayrollAnticipoModalProps> = ({
  isOpen,
  onClose,
  employee,
  accumulatedPrestaciones,
  maxAnticipo,
  anticipoAmount,
  onAnticipoAmountChange,
  anticipoReason,
  onAnticipoReasonChange,
  onGenerateReceipt,
  exchangeRate
}) => {
  if (!employee) return null;

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
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <HandCoins size={24} />
                  </div>
                  Solicitud de Anticipo (Art. 144 LOTTT)
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Solicitud para {employee.name} {employee.lastName}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Acumulado Garantía</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">${accumulatedPrestaciones.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Máximo Anticipo (75%)</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">${maxAnticipo.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Monto a Solicitar ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="number"
                      value={anticipoAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onAnticipoAmountChange(Math.min(val, maxAnticipo));
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Equivalente a Bs. {(anticipoAmount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Motivo de la Solicitud</label>
                  <textarea 
                    value={anticipoReason}
                    onChange={(e) => onAnticipoReasonChange(e.target.value)}
                    placeholder="Ej: Gastos médicos, educación, vivienda..."
                    className="w-full p-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-32 resize-none"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="text-blue-400 shrink-0" size={20} />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                  Al procesar esta solicitud, se generará un documento PDF que sirve como constancia legal del anticipo otorgado, el cual debe ser firmado por ambas partes.
                </p>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-300 hover:text-slate-900 dark:text-white font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={onGenerateReceipt}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Generar Recibo y Procesar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
