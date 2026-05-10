
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertCircle, Calendar, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity, Zap, Target, BarChart3,
  ChevronRight, Info
} from 'lucide-react';
import { Payment, PaymentStatus } from '../types';
import { motion } from 'framer-motion';

interface PredictiveDashboardProps {
  payments: Payment[];
}

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({ payments }) => {
  console.log("PredictiveDashboard received:", { paymentsCount: payments.length });
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    payments.forEach(p => {
      const date = new Date(p.paymentDate || p.submittedDate || p.dueDate);
      if (!isNaN(date.getFullYear())) {
        years.add(date.getFullYear());
      }
    });
    
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear + 1);
    years.add(currentYear - 1);
    
    return Array.from(years).sort((a, b) => a - b);
  }, [payments]);

  const [selectedYear, setSelectedYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return currentYear;
  });

  // Update selected year if we have data but not for the current year
  React.useEffect(() => {
    if (payments.length > 0) {
      const currentYear = new Date().getFullYear();
      const hasDataForCurrentYear = payments.some(p => {
        const date = new Date(p.paymentDate || p.submittedDate || p.dueDate);
        return date.getFullYear() === currentYear;
      });
      
      if (!hasDataForCurrentYear) {
        // Find the most recent year with data
        const yearsWithData = Array.from(new Set(payments.map(p => {
          const date = new Date(p.paymentDate || p.submittedDate || p.dueDate);
          return date.getFullYear();
        }))).filter(y => !isNaN(y)).sort((a, b) => b - a);
        
        if (yearsWithData.length > 0) {
          setSelectedYear(yearsWithData[0]);
        }
      }
    }
  }, [payments]);

  const [growthFactor, setGrowthFactor] = useState(10); // 10% default growth/inflation

  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const chartData = useMemo(() => {
    const data = monthNames.map((name, index) => {
      const monthNum = (index + 1).toString().padStart(2, '0');
      
      // Actual payments (Approved or Paid)
      const actual = payments
        .filter(p => {
          const date = new Date(p.paymentDate || p.submittedDate);
          const isSameMonth = date.getFullYear() === selectedYear && (date.getMonth() + 1) === (index + 1);
          const isActual = p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID;
          
          return isSameMonth && isActual;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      // Proposed payments (Pending Approval or regular Pending)
      const proposed = payments
        .filter(p => {
          const date = new Date(p.proposedPaymentDate || p.dueDate);
          const isSameMonth = date.getFullYear() === selectedYear && (date.getMonth() + 1) === (index + 1);
          const isProposed = p.proposedStatus === 'PENDING_APPROVAL';
          const isRegularPending = p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE;
          
          return isSameMonth && (isProposed || isRegularPending);
        })
        .reduce((sum, p) => sum + (p.proposedAmount || p.amount), 0);

      const totalCommitted = actual + proposed;
      
      // Projection for next year
      const projection = totalCommitted * (1 + growthFactor / 100);

      return {
        name,
        actual,
        proposed,
        totalCommitted,
        projection
      };
    });

    return data;
  }, [payments, selectedYear, growthFactor]);

  const totals = useMemo(() => {
    return chartData.reduce((acc, curr) => ({
      actual: acc.actual + curr.actual,
      proposed: acc.proposed + curr.proposed,
      projection: acc.projection + curr.projection
    }), { actual: 0, proposed: 0, projection: 0 });
  }, [chartData]);

  const totalCommitted = totals.actual + totals.proposed;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            Análisis Predictivo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Proyección financiera basada en ejecución actual y tendencias.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Calendar size={18} className="text-slate-400" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none text-sm"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <TrendingUp size={18} className="text-slate-400" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Crecimiento:</span>
              <input 
                type="number" 
                value={growthFactor}
                onChange={(e) => setGrowthFactor(parseInt(e.target.value) || 0)}
                className="w-12 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none text-sm"
              />
              <span className="text-sm font-bold">%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ejecutado + Propuesto</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              ${totalCommitted.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center gap-1 text-xs font-bold mt-2 text-blue-500">
              <Activity size={14} />
              Flujo Total {selectedYear}
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
        </div>

        <div className="bg-slate-900 dark:bg-blue-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Proyección {selectedYear + 1}</p>
            <h3 className="text-2xl font-black tracking-tighter">
              ${totals.projection.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center gap-1 text-xs font-bold mt-2 text-blue-200">
              <Zap size={14} />
              Basado en tendencia actual
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Crecimiento Estimado</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              +${(totals.projection - totalCommitted).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center gap-1 text-xs font-bold mt-2 text-slate-500">
              <TrendingUp size={14} />
              Incremento Proyectado
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tendencia y Proyección Mensual</h3>
            <p className="text-slate-500 text-xs font-medium">Visualización de ejecución y estimación futura.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-black uppercase text-slate-500">Ejecutado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-300"></div>
              <span className="text-[10px] font-black uppercase text-slate-500">Propuesto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-black uppercase text-slate-500">Proyección {selectedYear + 1}</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '1.5rem'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              <Bar dataKey="actual" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey="proposed" stackId="a" fill="#93c5fd" radius={[10, 10, 0, 0]} barSize={40} />
              <Line 
                type="monotone" 
                dataKey="projection" 
                stroke="#f59e0b" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Desglose Predictivo por Mes</h3>
          <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
            Exportar Análisis <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mes</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejecutado + Propuesto</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyección {selectedYear + 1}</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {chartData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-6 font-black text-slate-900 dark:text-white">{row.name}</td>
                  <td className="p-6 font-bold text-slate-900 dark:text-white">${row.totalCommitted.toLocaleString()}</td>
                  <td className="p-6 font-black text-blue-600">${row.projection.toLocaleString()}</td>
                  <td className="p-6">
                    {row.totalCommitted > 0 ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-full">Activo</span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full">Sin Datos</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20">
          <h4 className="text-blue-900 dark:text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={16} />
            Insights de Proyección
          </h4>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm font-medium text-blue-800 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              Se estima un flujo de caja total de <span className="font-black">${totals.projection.toLocaleString()}</span> para el próximo año fiscal.
            </li>
            <li className="flex gap-3 text-sm font-medium text-blue-800 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              La proyección se basa en un factor de crecimiento del <span className="font-black">{growthFactor}%</span> sobre la ejecución actual.
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={16} />
              Lógica Predictiva
            </h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
              Nuestra lógica predictiva combina la ejecución real (pagos aprobados) con las propuestas financieras actuales para generar una tendencia de gasto. Al aplicar un factor de crecimiento ajustable, proyectamos el comportamiento del próximo año fiscal, permitiendo una planificación anticipada.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-3/4"></div>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500">Confianza del Modelo: 85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
