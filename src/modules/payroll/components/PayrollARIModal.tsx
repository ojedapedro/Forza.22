import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  FileSignature, 
  Plus, 
  Calculator 
} from 'lucide-react';
import { Employee } from '../types';

interface PayrollARIModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  ariData: {
    estimatedIncomeBs: number;
    estimatedExpensesBs: number;
    dependents: number;
    taxUnitValueBs: number;
  };
  onAriDataChange: (data: any) => void;
  calculateARI: (data: any) => any;
  exchangeRate: number;
}

export const PayrollARIModal: React.FC<PayrollARIModalProps> = ({
  isOpen,
  onClose,
  employee,
  ariData,
  onAriDataChange,
  calculateARI,
  exchangeRate
}) => {
  if (!employee) return null;

  const result = calculateARI(ariData);

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
            className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                    <FileSignature size={24} />
                  </div>
                  Formulario AR-I (ISLR)
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Cálculo de retención para {employee.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos Estimados (Bs/Año)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-bold">Bs.</span>
                    </div>
                    <input 
                      type="number" 
                      value={ariData.estimatedIncomeBs || ''}
                      onChange={(e) => onAriDataChange({...ariData, estimatedIncomeBs: Number(e.target.value)})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Equivale a ${(ariData.estimatedIncomeBs / exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} USD</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desgravámenes Estimados (Bs/Año)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-bold">Bs.</span>
                    </div>
                    <input 
                      type="number" 
                      value={ariData.estimatedExpensesBs || ''}
                      onChange={(e) => onAriDataChange({...ariData, estimatedExpensesBs: Number(e.target.value)})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargas Familiares</label>
                  <input 
                    type="number" 
                    min="0"
                    value={ariData.dependents}
                    onChange={(e) => onAriDataChange({...ariData, dependents: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor Unidad Tributaria (Bs)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={ariData.taxUnitValueBs}
                    onChange={(e) => onAriDataChange({...ariData, taxUnitValueBs: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Results Section */}
              <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-800/30 border border-slate-700 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calculator size={16} className="text-purple-400" /> Resultados del Cálculo
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Ingresos en UT</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{result.incomeUT.toLocaleString(undefined, {maximumFractionDigits: 2})} UT</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Obligación de Presentar AR-I</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      result.isObligated ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.isObligated ? 'Obligatorio (> 1000 UT)' : 'No Obligatorio'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Impuesto Anual Estimado</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">Bs. {result.totalTaxBs.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <span className="font-bold text-purple-300">Porcentaje de Retención Mensual</span>
                    <span className="text-2xl font-bold text-purple-400">{result.percentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-300 hover:text-slate-900 dark:text-white font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
