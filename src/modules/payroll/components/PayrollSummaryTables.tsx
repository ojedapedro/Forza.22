import React from 'react';
import { Building2, Calendar, ShieldCheck } from 'lucide-react';
import { Store } from '../../../types';
import { useExchangeRate } from '../../../contexts/ExchangeRateContext';

interface PayrollSummaryTablesProps {
  sortedStoreMonth: any[];
  sortedMonths: any[];
  stores: Store[];
}

export const PayrollSummaryTables: React.FC<PayrollSummaryTablesProps> = ({
  sortedStoreMonth,
  sortedMonths,
  stores
}) => {
  const { exchangeRate } = useExchangeRate();

  return (
    <>
      {/* Resumen por Tienda y Mes */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-blue-500" size={20} />
            Resumen por Tienda y Mes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Empleados</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajadores</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pasivos Laborales</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Total Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedStoreMonth.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay nóminas procesadas por tienda y mes.
                  </td>
                </tr>
              ) : (
                sortedStoreMonth.map((s) => (
                  <tr key={`${s.month}-${s.storeId}`} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{s.month}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{stores.find(st => st.id === s.storeId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center text-slate-300">
                      <span className="bg-blue-500/10 text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                        {s.entriesCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-emerald-400">${s.totalWorkerNet.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(s.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-orange-400">${s.totalStateLiabilities.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(s.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-blue-400">${s.totalEmployerCost.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(s.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen Mensual */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            Resumen por Mes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Empleados Procesados</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajadores</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pasivos Laborales</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Total Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedMonths.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay nóminas procesadas.
                  </td>
                </tr>
              ) : (
                sortedMonths.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{m.month}</td>
                    <td className="px-6 py-4 text-center text-slate-300">
                      <span className="bg-blue-500/10 text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                        {m.entriesCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-emerald-400">${m.totalWorkerNet.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-orange-400">${m.totalStateLiabilities.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-blue-400">${m.totalEmployerCost.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desglose de Pasivos Laborales */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={20} />
            Desglose de Pasivos Laborales
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">SSO</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">LPH</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">INCES</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Pasivos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedMonths.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay pasivos registrados.
                  </td>
                </tr>
              ) : (
                sortedMonths.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{m.month}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-slate-300">${m.ssoTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.ssoTotal * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-slate-300">${m.lphTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.lphTotal * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-slate-300">${m.incesTotal.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.incesTotal * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-orange-400">${m.totalStateLiabilities.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(m.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
