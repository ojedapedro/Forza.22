import React from 'react';
import { TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';
import { useExchangeRate } from '../../../contexts/ExchangeRateContext';

interface PayrollStatsGridProps {
  totalPayrollCost: number;
  totalWorkerPayments: number;
  totalStateLiabilities: number;
}

export const PayrollStatsGrid: React.FC<PayrollStatsGridProps> = ({
  totalPayrollCost,
  totalWorkerPayments,
  totalStateLiabilities
}) => {
  const { exchangeRate } = useExchangeRate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
            <TrendingUp size={20} />
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Costo Total Empresa</span>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">${totalPayrollCost.toLocaleString()}</div>
        <div className="text-sm text-slate-500 mt-1">Bs. {(totalPayrollCost * exchangeRate).toLocaleString()}</div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
            <DollarSign size={20} />
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Neto a Trabajadores</span>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">${totalWorkerPayments.toLocaleString()}</div>
        <div className="text-sm text-slate-500 mt-1">Bs. {(totalWorkerPayments * exchangeRate).toLocaleString()}</div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
            <ShieldCheck size={20} />
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Pasivos al Estado</span>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">${totalStateLiabilities.toLocaleString()}</div>
        <div className="text-sm text-slate-500 mt-1">Bs. {(totalStateLiabilities * exchangeRate).toLocaleString()}</div>
      </div>
    </div>
  );
};
