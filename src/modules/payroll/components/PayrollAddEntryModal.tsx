import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Plus, 
  Users, 
  Calculator, 
  Moon, 
  Sun, 
  Clock, 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Wand2 
} from 'lucide-react';
import { Store } from '../../../types';
import { Employee, ShiftGroup } from '../types';
import { 
  calculateLOTTTExtras, 
  calculateTotals, 
  calculateParafiscales, 
  getParafiscalDiff 
} from '../utils/lotttCalculations';

interface PayrollAddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  payrollFormData: any;
  setPayrollFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  getShiftForGroup: (group: ShiftGroup) => any;
  calculateTotals: (data: any) => any;
  calculateLOTTTExtras: (baseSalary: number, nightHours: number, sundays: number, overtime: number) => any;
  calculateParafiscales: (baseSalary: number, bonuses: any[]) => any;
  getParafiscalDiff: (name: string, amount: number, baseSalary: number, bonuses: any[]) => any;
  applyLawCalculationsToPayroll: () => void;
  stores: Store[];
  currentUser: any;
  exchangeRate: number;
}

export const PayrollAddEntryModal: React.FC<PayrollAddEntryModalProps> = ({
  isOpen,
  onClose,
  employees,
  payrollFormData,
  setPayrollFormData,
  onSubmit,
  getShiftForGroup,
  calculateTotals,
  calculateLOTTTExtras,
  calculateParafiscales,
  getParafiscalDiff,
  applyLawCalculationsToPayroll,
  stores,
  currentUser,
  exchangeRate
}) => {
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
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <Plus className="text-slate-900 dark:text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Carga de Nómina</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Complete los datos del trabajador y pasivos</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Employee Selector */}
              <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} />
                    Vincular con Expediente
                  </h3>
                  <span className="text-[10px] text-slate-500 italic">Auto-completa datos desde el expediente</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seleccionar Trabajador</label>
                    <select 
                      onChange={(e) => {
                        const empId = e.target.value;
                        if (!empId) return;
                        const emp = employees.find(e => e.id === empId);
                        if (emp) {
                          const shift = getShiftForGroup(emp.shiftGroup as ShiftGroup);
                          let estNightHours = 0;
                          if (shift) {
                             estNightHours = shift.nightHoursPerDay * 22; // 22 working days
                          }

                          const extras = calculateLOTTTExtras(emp.baseSalary, estNightHours, 0, 0);

                          setPayrollFormData({
                            ...payrollFormData,
                            employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
                            employeeId: emp.id,
                            storeId: emp.storeId,
                            baseSalary: emp.baseSalary,
                            bonuses: emp.defaultBonuses,
                            deductions: emp.defaultDeductions,
                            employerLiabilities: emp.defaultEmployerLiabilities,
                            nightHoursWorked: estNightHours,
                            sundaysHolidaysWorked: 0,
                            overtimeHoursWorked: 0,
                            ...extras
                          });
                        }
                      }}
                      className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">-- Seleccionar de la lista --</option>
                      {employees.filter(e => e.isActive).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName} ({emp.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <p className="text-xs text-slate-500">
                      Al seleccionar un trabajador, se cargarán automáticamente su sueldo base, bonos y deducciones configurados en su expediente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Automated LOTTT Components */}
              <div className="bg-slate-950/20 border border-slate-800/50 p-6 rounded-3xl space-y-6">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={18} />
                  Componentes Automáticos (LOTTT)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <Moon size={12} className="text-indigo-400" /> Horas Nocturnas (Mes)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={payrollFormData.nightHoursWorked}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newFormData = { ...payrollFormData, nightHoursWorked: val };
                          const totals = calculateTotals(newFormData);
                          setPayrollFormData({ ...newFormData, ...totals });
                        }}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        placeholder="0"
                      />
                      <div className="w-24 px-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-800 rounded-xl text-indigo-400 text-sm font-bold flex items-center justify-end">
                        ${payrollFormData.bonoNocturnoAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <Sun size={12} className="text-orange-400" /> Domingos / Feriados (Días)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={payrollFormData.sundaysHolidaysWorked}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newFormData = { ...payrollFormData, sundaysHolidaysWorked: val };
                          const totals = calculateTotals(newFormData);
                          setPayrollFormData({ ...newFormData, ...totals });
                        }}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        placeholder="0"
                      />
                      <div className="w-24 px-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-800 rounded-xl text-orange-400 text-sm font-bold flex items-center justify-end">
                        ${payrollFormData.sundaysHolidaysAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <Clock size={12} className="text-emerald-400" /> Horas Extra (Sencillas)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={payrollFormData.overtimeHoursWorked}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const newFormData = { ...payrollFormData, overtimeHoursWorked: val };
                          const totals = calculateTotals(newFormData);
                          setPayrollFormData({ ...newFormData, ...totals });
                        }}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        placeholder="0"
                      />
                      <div className="w-24 px-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-800 rounded-xl text-emerald-400 text-sm font-bold flex items-center justify-end">
                        ${payrollFormData.overtimeAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center italic">Calculado según Art. 117, 118 y 120 de la LOTTT</p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Trabajador</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      required
                      type="text"
                      value={payrollFormData.employeeName}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeName: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cédula / ID</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      required
                      type="text"
                      value={payrollFormData.employeeId}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeId: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      placeholder="Ej. V-12345678"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tienda Asignada</label>
                  <select 
                    required
                    value={payrollFormData.storeId}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, storeId: e.target.value })}
                    disabled={!!currentUser?.storeIds && currentUser.storeIds.length === 1}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccionar tienda...</option>
                    {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mes de Nómina</label>
                  <input 
                    required
                    type="month"
                    value={payrollFormData.month}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, month: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sueldo Básico ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={payrollFormData.baseSalary || ''}
                      onChange={(e) => {
                      const baseSalary = parseFloat(e.target.value) || 0;
                      const { deductions, liabilities } = calculateParafiscales(baseSalary, payrollFormData.bonuses);
                      setPayrollFormData({ 
                        ...payrollFormData, 
                        baseSalary,
                        deductions,
                        employerLiabilities: liabilities
                      });
                    }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Sections (Bonuses, Deductions, Liabilities) */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={applyLawCalculationsToPayroll}
                  className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Calculator size={16} />
                  Calcular Aportes de Ley Automáticamente
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bonuses */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <TrendingUp size={18} /> Bonos Adicionales
                    </h3>
                    <button 
                       type="button"
                       onClick={() => setPayrollFormData({ ...payrollFormData, bonuses: [...payrollFormData.bonuses, { name: '', amount: 0 }] })}
                       className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {payrollFormData.bonuses.map((bonus: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Nombre del bono"
                          value={bonus.name}
                          onChange={(e) => {
                            const newBonuses = [...payrollFormData.bonuses];
                            newBonuses[idx].name = e.target.value;
                            setPayrollFormData({ ...payrollFormData, bonuses: newBonuses });
                          }}
                          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={bonus.amount || ''}
                          onChange={(e) => {
                            const newBonuses = [...payrollFormData.bonuses];
                            newBonuses[idx].amount = parseFloat(e.target.value) || 0;
                            const { deductions, liabilities } = calculateParafiscales(payrollFormData.baseSalary, newBonuses);
                            setPayrollFormData({ 
                              ...payrollFormData, 
                              bonuses: newBonuses,
                              deductions,
                              employerLiabilities: liabilities
                            });
                          }}
                          className="w-24 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <TrendingDown size={18} /> Deducciones Trabajador
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setPayrollFormData({ ...payrollFormData, deductions: [...payrollFormData.deductions, { name: '', amount: 0 }] })}
                      className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {payrollFormData.deductions.map((deduction: any, idx: number) => {
                      const { theoretical, hasDiff } = getParafiscalDiff(deduction.name, deduction.amount, payrollFormData.baseSalary, payrollFormData.bonuses);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Nombre deducción"
                              value={deduction.name}
                              onChange={(e) => {
                                const newDeductions = [...payrollFormData.deductions];
                                newDeductions[idx].name = e.target.value;
                                setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                              }}
                              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <div className="relative">
                              <input 
                                type="number"
                                placeholder="0.00"
                                value={deduction.amount || ''}
                                onChange={(e) => {
                                  const newDeductions = [...payrollFormData.deductions];
                                  newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                                  setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                                }}
                                className={`w-24 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-red-500 font-mono`}
                              />
                              {hasDiff && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDeductions = [...payrollFormData.deductions];
                                    newDeductions[idx].amount = theoretical;
                                    setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                                  }}
                                  className="absolute -top-2 -right-2 bg-orange-500 text-slate-900 dark:text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                  title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                >
                                  <Wand2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                          {hasDiff && (
                            <div className="flex justify-between px-1">
                              <span className="text-[9px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                              <span className="text-[9px] text-slate-500">Dif: ${(deduction.amount - theoretical).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Employer Liabilities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                      <ShieldCheck size={18} /> Pasivos Patronales
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setPayrollFormData({ ...payrollFormData, employerLiabilities: [...payrollFormData.employerLiabilities, { name: '', amount: 0 }] })}
                      className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg hover:bg-orange-500/20 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {payrollFormData.employerLiabilities.map((liability: any, idx: number) => {
                      const { theoretical, hasDiff } = getParafiscalDiff(liability.name, liability.amount, payrollFormData.baseSalary, payrollFormData.bonuses);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Nombre pasivo"
                              value={liability.name}
                              onChange={(e) => {
                                const newLiabilities = [...payrollFormData.employerLiabilities];
                                newLiabilities[idx].name = e.target.value;
                                setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                              }}
                              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <div className="relative">
                              <input 
                                type="number"
                                placeholder="0.00"
                                value={liability.amount || ''}
                                onChange={(e) => {
                                  const newLiabilities = [...payrollFormData.employerLiabilities];
                                  newLiabilities[idx].amount = parseFloat(e.target.value) || 0;
                                  setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                                }}
                                className={`w-24 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-orange-500 font-mono`}
                              />
                              {hasDiff && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newLiabilities = [...payrollFormData.employerLiabilities];
                                    newLiabilities[idx].amount = theoretical;
                                    setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                                  }}
                                  className="absolute -top-2 -right-2 bg-orange-500 text-slate-900 dark:text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                  title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                >
                                  <Wand2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                          {hasDiff && (
                            <div className="flex justify-between px-1">
                              <span className="text-[9px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                              <span className="text-[9px] text-slate-500">Dif: ${(liability.amount - theoretical).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Summary Preview */}
              <div className="bg-white/50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Neto Trabajador</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">${calculateTotals(payrollFormData).totalWorkerNet.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Bs. {(calculateTotals(payrollFormData).totalWorkerNet * exchangeRate).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Costo Total Empresa</span>
                  <div className="text-2xl font-bold text-blue-400 font-mono">${calculateTotals(payrollFormData).totalEmployerCost.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Bs. {(calculateTotals(payrollFormData).totalEmployerCost * exchangeRate).toLocaleString()}</div>
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/30 flex items-center gap-2"
                  >
                    <Calculator size={20} />
                    Procesar Nómina
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
