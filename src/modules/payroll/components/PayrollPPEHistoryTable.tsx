import React from 'react';
import { 
  History, 
  Download, 
  FileText, 
  Search, 
  Building2, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';
import { PPEAssignment, Employee } from '../types';
import { Store } from '../../../types';
import { formatDate } from '../utils';

interface PayrollPPEHistoryTableProps {
  assignments: { 
    employeeName: string; 
    employeeId: string; 
    storeId: string; 
    assignment: PPEAssignment 
  }[];
  employees: Employee[];
  stores: Store[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  storeFilter: string;
  onStoreFilterChange: (val: string) => void;
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onViewEmployee: (emp: Employee) => void;
  exchangeRate: number;
}

export const PayrollPPEHistoryTable: React.FC<PayrollPPEHistoryTableProps> = ({
  assignments,
  employees,
  stores,
  searchTerm,
  onSearchChange,
  storeFilter,
  onStoreFilterChange,
  dateFilter,
  onDateFilterChange,
  onExportCSV,
  onExportPDF,
  onViewEmployee,
  exchangeRate
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="text-blue-400" size={20} />
            Historial de Entregas de EPP
          </h3>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={onExportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-xl hover:bg-emerald-600/30 transition-all font-bold text-sm"
            >
              <Download size={16} />
              Excel/CSV
            </button>
            <button 
              onClick={onExportPDF}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-600/30 transition-all font-bold text-sm"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              value={storeFilter}
              onChange={(e) => onStoreFilterChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="">Todas las tiendas</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Equipos Entregados</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={48} className="opacity-20" />
                      <p>No se encontraron registros de entrega de EPP.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.assignment.id} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium text-sm">
                      {formatDate(item.assignment.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium text-sm">
                      {stores.find(s => s.id === item.storeId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.assignment.items.map((ppe, idx) => (
                          <span key={idx} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            {ppe.cantidad}x {ppe.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">${item.assignment.totalCost.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(item.assignment.totalCost * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          const emp = employees.find(e => e.id === item.employeeId);
                          if (emp) onViewEmployee(emp);
                        }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                        title="Ver Expediente"
                      >
                        <FileText size={18} />
                      </button>
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
