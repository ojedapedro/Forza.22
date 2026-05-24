import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Landmark, 
  Plus, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  FileText, 
  HandCoins 
} from 'lucide-react';
import { Employee } from '../types';

interface PayrollPrestacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  endDate: string;
  onEndDateChange: (date: string) => void;
  calculatePrestaciones: () => any;
  exchangeRate: number;
  onSolicitarAnticipo: (employee: Employee, amount: number) => void;
}

export const PayrollPrestacionesModal: React.FC<PayrollPrestacionesModalProps> = ({
  isOpen,
  onClose,
  employee,
  endDate,
  onEndDateChange,
  calculatePrestaciones,
  exchangeRate,
  onSolicitarAnticipo
}) => {
  if (!employee) return null;

  const result = calculatePrestaciones();

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
            className="relative w-full max-w-4xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                    <Landmark size={24} />
                  </div>
                  Cálculo de Prestaciones Sociales (LOTTT)
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Liquidación estimativa para {employee.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Ingreso</div>
                  <div className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
                    {employee.hireDate}
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Cálculo</div>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none font-medium"
                  />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Salario Integral Diario</div>
                  {result ? (
                    <div>
                      <div className="text-slate-900 dark:text-white font-bold font-mono text-lg">${result.dailyIntegralSalary.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                      <div className="text-xs text-slate-500">Bs. {(result.dailyIntegralSalary * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                    </div>
                  ) : <div className="text-slate-500">Fecha inválida</div>}
                </div>
              </div>

              {!result ? (
                <div className="text-center text-red-400 py-8">La fecha de cálculo debe ser posterior a la fecha de ingreso.</div>
              ) : (
                <div className="space-y-8">
                  {/* Tiempo de Servicio */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" /> Tiempo de Servicio
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-blue-400">{result.years}</div>
                        <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Años</div>
                      </div>
                      <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-blue-400">{result.months}</div>
                        <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Meses</div>
                      </div>
                      <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-bold text-blue-400">{result.days}</div>
                        <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Días</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Garantía Trimestral */}
                    <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" /> 1. Garantía Trimestral (Art. 142 a, b)
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Trimestres Completos</span>
                          <span className="font-bold text-slate-900 dark:text-white">{result.quarters}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Días Base (15 x Trimestre)</span>
                          <span className="font-bold text-slate-900 dark:text-white">{result.baseDaysQuarterly} días</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Días Adicionales (Antigüedad)</span>
                          <span className="font-bold text-slate-900 dark:text-white">{result.additionalDays} días</span>
                        </div>
                        <div className="pt-4 border-t border-slate-700/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-emerald-400">Total Días Acumulados</span>
                            <span className="font-bold text-emerald-400">{result.totalGuaranteeDays} días</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Monto Estimado</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">${result.totalGuaranteeAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cálculo Literal C */}
                    <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-orange-400" /> 2. Cálculo Retroactivo (Art. 142 c)
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Años a considerar (&gt; 6 meses = 1 año)</span>
                          <span className="font-bold text-slate-900 dark:text-white">{result.literalCYears} años</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Días (30 x Año)</span>
                          <span className="font-bold text-slate-900 dark:text-white">{result.literalCDays} días</span>
                        </div>
                        <div className="pt-4 border-t border-slate-700/50 mt-auto">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-orange-400">Total Días Retroactivos</span>
                            <span className="font-bold text-orange-400">{result.literalCDays} días</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Monto Estimado</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">${result.literalCAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resultado Final */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-amber-400 mb-1">Monto a Pagar (El Mayor)</h3>
                      <p className="text-sm text-amber-400/70">
                        Según la LOTTT, el trabajador recibe el monto que resulte mayor entre la Garantía Trimestral y el Cálculo Retroactivo.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">${result.finalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Bs. {(result.finalAmount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              {result && (
                <button 
                  type="button"
                  onClick={() => onSolicitarAnticipo(employee, result.finalAmount)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold rounded-2xl transition-all flex items-center gap-2"
                >
                  <HandCoins size={18} />
                  Solicitar Anticipo (75%)
                </button>
              )}
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
