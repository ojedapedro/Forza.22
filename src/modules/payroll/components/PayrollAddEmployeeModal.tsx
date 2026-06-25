import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Plus, 
  Contact, 
  Calculator, 
  Wand2 
} from 'lucide-react';
import { Store } from '../../../types';
import { Employee, ShiftGroup } from '../types';
import { calculateParafiscales, getParafiscalDiff } from '../utils/lotttCalculations';

interface PayrollAddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmployee: Employee | null;
  employeeFormData: any;
  setEmployeeFormData: (data: any) => void;
  employeeIdInput: string;
  setEmployeeIdInput: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  calculateParafiscales: (baseSalary: number, bonuses: any[]) => any;
  getParafiscalDiff: (name: string, amount: number, baseSalary: number, bonuses: any[]) => any;
  applyLawCalculationsToEmployee: () => void;
  stores: Store[];
  currentUser: any;
}

export const PayrollAddEmployeeModal: React.FC<PayrollAddEmployeeModalProps> = ({
  isOpen,
  onClose,
  editingEmployee,
  employeeFormData,
  setEmployeeFormData,
  employeeIdInput,
  setEmployeeIdInput,
  onSubmit,
  calculateParafiscales,
  getParafiscalDiff,
  applyLawCalculationsToEmployee,
  stores,
  currentUser
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
                <div className="p-3 bg-indigo-600 rounded-2xl">
                  <Contact className="text-slate-900 dark:text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editingEmployee ? 'Editar Expediente' : 'Nuevo Expediente de Empleado'}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Información base para generación automática de nómina</p>
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
              {/* Employee Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Código (Asignado)</label>
                  <input 
                    readOnly
                    type="text"
                    value={employeeFormData.code}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed font-mono"
                    placeholder="Ej. 0001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cédula / ID (Opcional)</label>
                  <input 
                    disabled={!!editingEmployee}
                    type="text"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono disabled:opacity-50"
                    placeholder="Ej. V-12345678"
                  />
                  <p className="text-[10px] text-slate-500 ml-1">Si se deja vacío, se usará el Código como ID.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nacionalidad</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.nationality}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, nationality: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. VENEZOLANO"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombres</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. Juan Alberto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Apellidos</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.lastName}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, lastName: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Edad</label>
                  <input 
                    required
                    type="number"
                    value={employeeFormData.age || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="Ej. 30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Grado de Instrucción</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.educationLevel}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, educationLevel: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. TSU"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cargo</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.position}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. Gerente de Tienda"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Departamento</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. Operaciones"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Grupo de Horario (Turno)</label>
                  <select 
                    value={employeeFormData.shiftGroup || ShiftGroup.NONE}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, shiftGroup: e.target.value as ShiftGroup })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {Object.values(ShiftGroup).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción del Cargo</label>
                  <input 
                    type="text"
                    value={employeeFormData.positionDescription}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, positionDescription: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. CEO"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Ingreso</label>
                  <input 
                    required
                    type="date"
                    value={employeeFormData.hireDate}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Prestaciones Sociales al Día</label>
                  <input 
                    type="date"
                    value={employeeFormData.socialBenefitsDate || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, socialBenefitsDate: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Egreso Proyectada</label>
                  <input 
                    type="date"
                    value={employeeFormData.projectedExitDate || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, projectedExitDate: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electrónico</label>
                  <input 
                    type="email"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Dirección del Proyecto</label>
                  <input 
                    type="text"
                    value={employeeFormData.projectAddress || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, projectAddress: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. PEQUIVEN MORON"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Teléfono Directo</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.directPhone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, directPhone: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="Ej. 0424-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Teléfono de Emergencia</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.emergencyPhone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, emergencyPhone: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="Ej. 0424-1234567"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Dirección Habitación</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.homeAddress}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, homeAddress: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Ej. MORRO II SAN DIEGO"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sexo</label>
                  <select 
                    required
                    value={employeeFormData.gender}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, gender: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usa Lentes</label>
                  <select 
                    required
                    value={employeeFormData.wearsGlasses}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, wearsGlasses: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="SI">SÍ</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Persona con Condición</label>
                  <select 
                    required
                    value={employeeFormData.hasCondition}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, hasCondition: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="SI">SÍ</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Estatura</label>
                  <input 
                    required
                    type="text"
                    value={employeeFormData.height}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, height: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="Ej. 1,70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tienda Asignada</label>
                  <select 
                    required
                    value={employeeFormData.storeId}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, storeId: e.target.value })}
                    disabled={!!currentUser?.storeIds && currentUser.storeIds.length === 1}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccionar tienda...</option>
                    {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sueldo Base Mensual ($)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={employeeFormData.baseSalary || ''}
                    onChange={(e) => {
                      const baseSalary = parseFloat(e.target.value) || 0;
                      const { deductions, liabilities } = calculateParafiscales(baseSalary, employeeFormData.defaultBonuses);
                      setEmployeeFormData({ 
                        ...employeeFormData, 
                        baseSalary,
                        defaultDeductions: deductions,
                        defaultEmployerLiabilities: liabilities
                      });
                    }}
                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Default Payroll Config */}
              <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calculator size={20} className="text-indigo-400" /> Configuración de Nómina Predeterminada
                  </h3>
                  <button
                    type="button"
                    onClick={applyLawCalculationsToEmployee}
                    className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Calculator size={16} />
                    Calcular Aportes de Ley
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Default Bonuses */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bonos Fijos</h4>
                      <button 
                        type="button"
                        onClick={() => setEmployeeFormData({ ...employeeFormData, defaultBonuses: [...employeeFormData.defaultBonuses, { name: '', amount: 0 }] })}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {employeeFormData.defaultBonuses.map((bonus: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Nombre bono"
                            value={bonus.name}
                            onChange={(e) => {
                              const newBonuses = [...employeeFormData.defaultBonuses];
                              newBonuses[idx].name = e.target.value;
                              setEmployeeFormData({ ...employeeFormData, defaultBonuses: newBonuses });
                            }}
                            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={bonus.amount || ''}
                            onChange={(e) => {
                              const newBonuses = [...employeeFormData.defaultBonuses];
                              newBonuses[idx].amount = parseFloat(e.target.value) || 0;
                              const { deductions, liabilities } = calculateParafiscales(employeeFormData.baseSalary, newBonuses);
                              setEmployeeFormData({ 
                                ...employeeFormData, 
                                defaultBonuses: newBonuses,
                                defaultDeductions: deductions,
                                defaultEmployerLiabilities: liabilities
                              });
                            }}
                            className="w-20 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Default Deductions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deducciones Fijas</h4>
                      <button 
                        type="button"
                        onClick={() => setEmployeeFormData({ ...employeeFormData, defaultDeductions: [...employeeFormData.defaultDeductions, { name: '', amount: 0 }] })}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {employeeFormData.defaultDeductions.map((deduction: any, idx: number) => {
                        const { theoretical, hasDiff } = getParafiscalDiff(deduction.name, deduction.amount, employeeFormData.baseSalary, employeeFormData.defaultBonuses);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Nombre deducción"
                                value={deduction.name}
                                onChange={(e) => {
                                  const newDeductions = [...employeeFormData.defaultDeductions];
                                  newDeductions[idx].name = e.target.value;
                                  setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <div className="relative">
                                <input 
                                  type="number"
                                  placeholder="0.00"
                                  value={deduction.amount || ''}
                                  onChange={(e) => {
                                    const newDeductions = [...employeeFormData.defaultDeductions];
                                    newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                                    setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                                  }}
                                  className={`w-20 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono`}
                                />
                                {hasDiff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDeductions = [...employeeFormData.defaultDeductions];
                                      newDeductions[idx].amount = theoretical;
                                      setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                                    }}
                                    className="absolute -top-2 -right-2 bg-orange-500 text-slate-900 dark:text-white p-0.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                  >
                                    <Wand2 size={8} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between px-1">
                                <span className="text-[8px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                <span className="text-[8px] text-slate-500">Dif: ${(deduction.amount - theoretical).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Employer Liabilities */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasivos Patronales</h4>
                      <button 
                        type="button"
                        onClick={() => setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: [...employeeFormData.defaultEmployerLiabilities, { name: '', amount: 0 }] })}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {employeeFormData.defaultEmployerLiabilities.map((liability: any, idx: number) => {
                        const { theoretical, hasDiff } = getParafiscalDiff(liability.name, liability.amount, employeeFormData.baseSalary, employeeFormData.defaultBonuses);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Nombre pasivo"
                                value={liability.name}
                                onChange={(e) => {
                                  const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                  newLiabilities[idx].name = e.target.value;
                                  setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <div className="relative">
                                <input 
                                  type="number"
                                  placeholder="0.00"
                                  value={liability.amount || ''}
                                  onChange={(e) => {
                                    const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                    newLiabilities[idx].amount = parseFloat(e.target.value) || 0;
                                    setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                  }}
                                  className={`w-20 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono`}
                                />
                                {hasDiff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                      newLiabilities[idx].amount = theoretical;
                                      setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                    }}
                                    className="absolute -top-2 -right-2 bg-orange-500 text-slate-900 dark:text-white p-0.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                  >
                                    <Wand2 size={8} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between px-1">
                                <span className="text-[8px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                <span className="text-[8px] text-slate-500">Dif: ${(liability.amount - theoretical).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={employeeFormData.isActive}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, isActive: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-sm font-bold text-slate-300">Empleado Activo</span>
                  </label>
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-900/30"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Crear Expediente'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
