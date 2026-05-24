import React from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  HandCoins, 
  Landmark, 
  FileSignature, 
  ShieldCheck, 
  FileText, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX,
  RefreshCw
} from 'lucide-react';
import { Employee } from '../types';
import { Store } from '../../../types';

interface PayrollEmployeesTableProps {
  employees: Employee[];
  stores: Store[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAddEmployee: () => void;
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSolicitarAnticipo: (emp: Employee) => void;
  onCalcularPrestaciones: (emp: Employee) => void;
  onCalcularARI: (emp: Employee) => void;
  onGestionarPPE: (emp: Employee) => void;
  hasMoreEmployees: boolean;
  onLoadMoreEmployees?: () => Promise<void>;
}

export const PayrollEmployeesTable: React.FC<PayrollEmployeesTableProps> = ({
  employees,
  stores,
  searchTerm,
  onSearchChange,
  onAddEmployee,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onSolicitarAnticipo,
  onCalcularPrestaciones,
  onCalcularARI,
  onGestionarPPE,
  hasMoreEmployees,
  onLoadMoreEmployees
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar empleados por nombre, ID o tienda..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
        <button 
          onClick={onAddEmployee} 
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
        >
          <UserPlus size={20} />
          Nuevo Expediente
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda / Cargo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sueldo Base</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ingreso</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Controles LOTT / ISLR / EPP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <Users size={48} className="opacity-20" />
                    <p>No se encontraron expedientes de empleados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors capitalize">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{emp.name} {emp.lastName}</div>
                        <div className="text-xs text-slate-500 font-mono">{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 dark:text-white font-medium text-sm">
                      {stores.find(s => s.id === emp.storeId)?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{emp.position || 'Colaborador'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">${emp.baseSalary.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Salario Mensual</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{emp.hireDate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      emp.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {emp.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      {emp.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-100 transition-all">
                      <button 
                        onClick={() => onSolicitarAnticipo(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                        title="Solicitar Anticipo (75%)"
                      >
                        <HandCoins size={18} />
                      </button>
                      <button 
                        onClick={() => onCalcularPrestaciones(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
                        title="Calcular Prestaciones (LOTTT)"
                      >
                        <Landmark size={18} />
                      </button>
                      <button 
                        onClick={() => onCalcularARI(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg"
                        title="Calcular AR-I (ISLR)"
                      >
                        <FileSignature size={18} />
                      </button>
                      <button 
                        onClick={() => onGestionarPPE(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                        title="Seguridad Industrial (EPP)"
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button 
                        onClick={() => onViewEmployee(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                        title="Ver Expediente"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => onEditEmployee(emp)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"
                        title="Editar Expediente"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteEmployee(emp.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                        title="Eliminar Expediente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {hasMoreEmployees && onLoadMoreEmployees && (
          <div className="p-4 flex justify-center border-t border-slate-800">
            <button 
              onClick={onLoadMoreEmployees}
              className="px-6 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-indigo-400 transition-all flex items-center gap-2 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Cargar más empleados
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
