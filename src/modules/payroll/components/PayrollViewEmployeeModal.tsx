import React from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Plus, 
  ShieldCheck, 
  Landmark, 
  FileSignature, 
  Calculator, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { Employee } from '../types';

interface PayrollViewEmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  exchangeRate: number;
  onOpenPPE: (employee: Employee) => void;
  onOpenPrestaciones: (employee: Employee) => void;
  onOpenARI: (employee: Employee) => void;
  formatDate: (date: string) => string;
}

export const PayrollViewEmployeeModal: React.FC<PayrollViewEmployeeModalProps> = ({
  employee,
  onClose,
  exchangeRate,
  onOpenPPE,
  onOpenPrestaciones,
  onOpenARI,
  formatDate
}) => {
  if (!employee) return null;

  return (
    <AnimatePresence>
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
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold text-2xl">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{employee.name} {employee.lastName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">{employee.id}</span>
                  <span className="text-slate-600">•</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    employee.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
            <button 
              onClick={() => onOpenPPE(employee)}
              className="px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <ShieldCheck size={16} />
              Seguridad Industrial (EPP)
            </button>
            <button 
              onClick={() => onOpenPrestaciones(employee)}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <Landmark size={16} />
              Calcular Prestaciones
            </button>
            <button 
              onClick={() => onOpenARI(employee)}
              className="px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <FileSignature size={16} />
              Calcular AR-I
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Código', value: employee.code, mono: true },
                { label: 'Cédula / ID', value: employee.id, mono: true },
                { label: 'Nacionalidad', value: employee.nationality },
                { label: 'Nombres', value: employee.name },
                { label: 'Apellidos', value: employee.lastName },
                { label: 'Edad', value: employee.age },
                { label: 'Grado de Instrucción', value: employee.educationLevel },
                { label: 'Cargo', value: employee.position },
                { label: 'Departamento', value: employee.department },
                { label: 'Grupo de Horario', value: employee.shiftGroup || 'Sin Asignar' },
                { label: 'Descripción del Cargo', value: employee.positionDescription },
                { label: 'Fecha de Ingreso', value: employee.hireDate },
                { label: 'Fecha Prestaciones Sociales', value: employee.socialBenefitsDate },
                { label: 'Fecha Egreso Proyectada', value: employee.projectedExitDate },
                { label: 'Correo Electrónico', value: employee.email },
                { label: 'Dirección del Proyecto', value: employee.projectAddress },
                { label: 'Teléfono Directo', value: employee.directPhone, mono: true },
                { label: 'Teléfono de Emergencia', value: employee.emergencyPhone, mono: true },
                { label: 'Dirección Habitación', value: employee.homeAddress, span: 2 },
                { label: 'Sexo', value: employee.gender === 'M' ? 'Masculino' : employee.gender === 'F' ? 'Femenino' : 'N/A' },
                { label: 'Usa Lentes', value: employee.wearsGlasses },
                { label: 'Persona con Condición', value: employee.hasCondition },
                { label: 'Estatura', value: employee.height, mono: true },
              ].map((item, idx) => (
                <div key={idx} className={`bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 ${item.span ? 'md:col-span-2' : ''}`}>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className={`text-slate-900 dark:text-white font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value || 'N/A'}</div>
                </div>
              ))}
              <div className="bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sueldo Base</div>
                <div className="text-slate-900 dark:text-white font-bold font-mono text-lg">${employee.baseSalary.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Bs. {(employee.baseSalary * exchangeRate).toLocaleString()}</div>
              </div>
            </div>

            {/* Configuración de Nómina */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Calculator size={16} className="text-indigo-400" /> Configuración de Nómina
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bonos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} /> Bonos Fijos
                  </h4>
                  {employee.defaultBonuses.length > 0 ? (
                    <div className="space-y-2">
                      {employee.defaultBonuses.map((b, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                          <span className="text-sm text-slate-300">{b.name}</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">+${b.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">No hay bonos configurados</div>
                  )}
                </div>

                {/* Deducciones */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown size={14} /> Deducciones Fijas
                  </h4>
                  {employee.defaultDeductions.length > 0 ? (
                    <div className="space-y-2">
                      {employee.defaultDeductions.map((d, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                          <span className="text-sm text-slate-300">{d.name}</span>
                          <span className="text-sm font-bold text-red-400 font-mono">-${d.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">No hay deducciones configuradas</div>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de EPP */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ShieldCheck size={16} className="text-amber-500" /> Historial de Seguridad Industrial (EPP)
              </h3>
              
              {employee.ppeAssignments && employee.ppeAssignments.length > 0 ? (
                <div className="space-y-4">
                  {employee.ppeAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Asignación del {formatDate(assignment.date)}
                        </div>
                        <div className="text-sm font-mono font-bold text-amber-400">
                          Total: ${assignment.totalCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assignment.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                              <div className="text-xs font-bold text-slate-300">{item.name}</div>
                              <div className="text-[10px] text-slate-500">Talla: {item.talla || 'N/A'} | Frecuencia: {item.frecuencia}</div>
                            </div>
                            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {item.cantidad} x ${item.precio.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">No hay registros de entrega de EPP para este trabajador.</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
