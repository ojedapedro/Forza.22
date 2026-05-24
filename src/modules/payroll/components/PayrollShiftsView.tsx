import React from 'react';
import { 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  Sun, 
  Moon, 
  Briefcase, 
  Users 
} from 'lucide-react';
import { Employee, ShiftGroup } from '../types';
import { Store } from '../../../types';

interface PayrollShiftsViewProps {
  employees: Employee[];
  stores: Store[];
  onRotateShifts: () => void;
  rotationOffset: number;
  getShiftForGroup: (group: ShiftGroup) => { name: string; startTime: string; endTime: string; nightHoursPerDay: number } | null;
  onConfigureWebhook: () => void;
}

export const PayrollShiftsView: React.FC<PayrollShiftsViewProps> = ({
  employees,
  stores,
  onRotateShifts,
  rotationOffset,
  getShiftForGroup,
  onConfigureWebhook
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20 text-white">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gestión de Horarios Rotativos</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configuración de turnos y grupos de trabajo</p>
            </div>
          </div>
          <button 
            onClick={onRotateShifts}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
          >
            <RefreshCw size={18} className="animate-spin-slow" />
            Rotar Turnos Semanal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { group: ShiftGroup.GROUP_A, color: 'bg-emerald-500', icon: TrendingUp },
            { group: ShiftGroup.GROUP_B, color: 'bg-blue-500', icon: Sun },
            { group: ShiftGroup.GROUP_C, color: 'bg-indigo-500', icon: Moon },
            { group: ShiftGroup.ADMINISTRATIVE, color: 'bg-slate-500', icon: Briefcase }
          ].map((item, idx) => {
            const shift = getShiftForGroup(item.group);
            if (!shift) return null;
            return (
              <div key={idx} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500 transition-all">
                <div className={`absolute top-0 right-0 w-24 h-24 ${item.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`} />
                <div className="relative z-10">
                  <div className={`${item.color}/10 ${item.color.replace('bg-', 'text-')} p-2 rounded-lg w-fit mb-4`}>
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.group}</h4>
                  <p className="text-indigo-400 text-sm font-bold mt-1 uppercase tracking-tighter">{shift.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-0.5">{shift.startTime} - {shift.endTime}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Colaboradores</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      {employees.filter(e => e.shiftGroup === item.group).length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-900/20">
          <RefreshCw size={32} className="animate-spin-slow" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-blue-400">Integración de Control de Acceso</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sección preparada para el enlace con hardware y software de control de asistencia. El sistema está listo para recibir eventos de entrada y salida vía API / Webhooks.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onConfigureWebhook}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all active:scale-95 text-sm"
          >
            Configurar Webhook
          </button>
          <button className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold transition-all active:scale-95 text-sm border border-slate-200 dark:border-slate-700">
            Documentación API
          </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-400" size={20} />
            Listado de Colaboradores por Turno
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo de Horario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay empleados registrados.</td>
                </tr>
              ) : (
                employees.filter(e => e.isActive).map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{emp.name} {emp.lastName}</div>
                      <div className="text-xs text-slate-500 font-mono">{emp.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-300">
                      {stores.find(s => s.id === emp.storeId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          emp.shiftGroup === ShiftGroup.GROUP_A ? 'bg-emerald-500/10 text-emerald-500' :
                          emp.shiftGroup === ShiftGroup.GROUP_B ? 'bg-blue-500/10 text-blue-500' :
                          emp.shiftGroup === ShiftGroup.GROUP_C ? 'bg-indigo-500/10 text-indigo-500' :
                          emp.shiftGroup === ShiftGroup.ADMINISTRATIVE ? 'bg-slate-500/10 text-slate-400' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {emp.shiftGroup || 'Sin Asignar'}
                        </span>
                        {emp.shiftGroup && emp.shiftGroup !== ShiftGroup.NONE && (
                          <span className="text-[10px] text-indigo-400/80 font-mono mt-1 px-1">
                            {getShiftForGroup(emp.shiftGroup)?.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                         <span className="text-xs text-slate-500 font-medium">Sin registro de hardware</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
