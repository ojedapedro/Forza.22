
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';
import { Payment, PaymentStatus, PayrollEntry, Category, User, Role, Store, BudgetEntry } from '../types';
import { 
  DollarSign, TrendingUp, AlertTriangle, FileText, CheckCircle2, 
  AlertOctagon, Clock, XCircle, Building2, Filter, Users, 
  AlertCircle, PieChart as PieChartIcon, MessageSquare, Loader2
} from 'lucide-react';

interface PresidencyDashboardProps {
  payments: Payment[];
  payrollEntries: PayrollEntry[];
  budgets: BudgetEntry[];
  currentUser?: User;
  onApproveAll?: () => void;
  stores: Store[];
}

export const PresidencyDashboard: React.FC<PresidencyDashboardProps> = ({ payments, payrollEntries, budgets, currentUser, onApproveAll, stores }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [isNotifying, setIsNotifying] = useState(false);

  const handleTestNotifications = async () => {
    setIsNotifying(true);
    try {
      const response = await fetch('/api/notifications/whatsapp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Notificaciones enviadas con éxito.');
      } else {
        alert('❌ Error: ' + (data.error || 'No se pudieron enviar las notificaciones. Verifica la consola del servidor.'));
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
      alert('❌ Error de red al intentar enviar notificaciones.');
    } finally {
      setIsNotifying(false);
    }
  };

  // Use stores from props
  const storeOptions = useMemo(() => {
    return stores.map(s => ({ id: s.id, name: s.name }));
  }, [stores]);

  // Filter data based on selections
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (selectedStore !== 'all' && p.storeId !== selectedStore) return false;
      
      const pDate = new Date(p.paymentDate || p.submittedDate);
      if (startDate && pDate < new Date(startDate)) return false;
      if (endDate && pDate > new Date(endDate)) return false;
      
      return true;
    });
  }, [payments, selectedStore, startDate, endDate]);

  const filteredPayroll = useMemo(() => {
    return payrollEntries.filter(e => {
      if (selectedStore !== 'all' && e.storeId !== selectedStore) return false;
      
      const eDate = new Date(e.submittedDate);
      if (startDate && eDate < new Date(startDate)) return false;
      if (endDate && eDate > new Date(endDate)) return false;
      
      return true;
    });
  }, [payrollEntries, selectedStore, startDate, endDate]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      if (selectedStore !== 'all' && b.storeId !== selectedStore) return false;
      
      const bDate = new Date(b.date);
      if (startDate && bDate < new Date(startDate)) return false;
      if (endDate && bDate > new Date(endDate)) return false;
      
      return true;
    });
  }, [budgets, selectedStore, startDate, endDate]);

  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);

  const totalApproved = filteredPayments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = filteredPayments
    .filter(p => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayrollCost = filteredPayroll.reduce((sum, e) => sum + e.totalEmployerCost, 0);
  
  // Calcular Pasivos Laborales
  const totalLaborLiabilities = filteredPayroll.reduce((sum, e) => {
    const liabilitiesSum = e.employerLiabilities?.reduce((lSum, l) => lSum + l.amount, 0) || 0;
    return sum + liabilitiesSum;
  }, 0);
  
  const budgetUtilization = totalBudget > 0 ? ((totalApproved / totalBudget) * 100).toFixed(1) : '0.0';
  const budgetStatusBg = Number(budgetUtilization) > 100 ? 'bg-red-500/10' : Number(budgetUtilization) > 90 ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const budgetStatusColor = Number(budgetUtilization) > 100 ? 'text-red-400' : Number(budgetUtilization) > 90 ? 'text-amber-400' : 'text-emerald-400';

  const overBudgetCount = filteredPayments.filter(p => p.isOverBudget).length;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const overduePayments = filteredPayments.filter(p => {
    if (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED) return false;
    const dueDate = new Date(p.dueDate);
    return dueDate < today;
  });
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  const dueSoonPayments = filteredPayments.filter(p => {
    if (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED) return false;
    const dueDate = new Date(p.dueDate);
    return dueDate >= today && dueDate <= nextWeek;
  });
  const totalDueSoon = dueSoonPayments.reduce((sum, p) => sum + p.amount, 0);

  const rejectedCount = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED).length;
  const rejectionRate = filteredPayments.length > 0 ? ((rejectedCount / filteredPayments.length) * 100).toFixed(1) : '0.0';

  const paymentsByCategory = Object.values(Category).map(cat => ({
    name: cat,
    value: filteredPayments.filter(p => p.category === cat).reduce((sum, p) => sum + p.amount, 0)
  })).filter(c => c.value > 0);

  // Top 5 Tiendas
  const storeSpending: Record<string, number> = {};
  filteredPayments.filter(p => p.status === PaymentStatus.APPROVED).forEach(p => {
    storeSpending[p.storeName] = (storeSpending[p.storeName] || 0) + p.amount;
  });
  const topStores = Object.entries(storeSpending)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Evolución de Gastos (por mes)
  const monthlySpending: Record<string, number> = {};
  filteredPayments.filter(p => p.status === PaymentStatus.APPROVED).forEach(p => {
    const date = new Date(p.paymentDate || p.submittedDate);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + p.amount;
  });
  const trendData = Object.entries(monthlySpending)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Monthly Budget vs Actual
  const monthlyBudget: Record<string, number> = {};
  filteredBudgets.forEach(b => {
    const date = new Date(b.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyBudget[monthYear] = (monthlyBudget[monthYear] || 0) + b.amount;
  });

  const allMonths = Array.from(new Set([...Object.keys(monthlySpending), ...Object.keys(monthlyBudget)])).sort();
  const comparisonData = allMonths.map(month => ({
    month,
    spent: monthlySpending[month] || 0,
    budget: monthlyBudget[month] || 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ec4899', '#14b8a6'];

  const pendingPaymentsCount = filteredPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE).length;

  return (
    <div className="p-6 lg:p-10 text-slate-200 space-y-10 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Panel de Presidencia</h1>
          <p className="text-slate-500 font-medium">Visualización estratégica y control financiero consolidado.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-800/50 shadow-inner">
            <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
              <Filter size={16} />
            </div>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none pr-4 cursor-pointer"
            >
              <option value="all">Todas las Tiendas</option>
              {storeOptions.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-800/50 shadow-inner">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer px-2"
            />
            <span className="text-slate-700 font-black">/</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer px-2"
            />
          </div>

          {(currentUser?.role === Role.PRESIDENT || currentUser?.role === Role.SUPER_ADMIN) && (
            <button 
              onClick={handleTestNotifications}
              disabled={isNotifying}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              {isNotifying ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
              <span>Notificar WhatsApp</span>
            </button>
          )}

          {(currentUser?.role === Role.PRESIDENT || currentUser?.role === Role.SUPER_ADMIN) && pendingPaymentsCount > 0 && onApproveAll && (
            <button 
              onClick={onApproveAll}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <CheckCircle2 size={18} />
              <span>Aprobar Todo ({pendingPaymentsCount})</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {[
          { label: 'Presupuesto Total', value: totalBudget, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Ejecución Presup.', value: budgetUtilization, icon: TrendingUp, color: budgetStatusColor, bg: budgetStatusBg, isPercent: true, sub: `$${totalApproved.toLocaleString()} usados` },
          { label: 'Pagos Aprobados', value: totalApproved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Sobre Presupuesto', value: overBudgetCount, icon: AlertTriangle, color: 'text-pink-400', bg: 'bg-pink-500/10', isCount: true },
          { label: 'Pagos Realizados', value: totalPaid, icon: CheckCircle2, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Pagos Pendientes', value: totalPending, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Pagos Vencidos', value: totalOverdue, icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10', sub: `${overduePayments.length} pagos` },
          { label: 'Próximos (7d)', value: totalDueSoon, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', sub: `${dueSoonPayments.length} pagos` },
          { label: 'Costo Nómina', value: totalPayrollCost, icon: FileText, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Pasivos Laborales', value: totalLaborLiabilities, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Tasa de Rechazo', value: rejectionRate, icon: XCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', isPercent: true, sub: `${rejectedCount} devueltos` },
        ].map((card, idx) => (
          <div key={idx} className="glass-card glass-card-hover p-5 flex flex-col justify-between min-h-[120px]">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 ${card.bg} ${card.color} rounded-xl shadow-inner`}>
                <card.icon size={20} />
              </div>
              {card.sub && <span className={`text-[10px] font-black uppercase tracking-widest ${card.color} opacity-80`}>{card.sub}</span>}
            </div>
            <div>
              <p className="label-caps mb-1">{card.label}</p>
              <p className="text-2xl font-black text-white tabular-nums">
                {card.isCount ? card.value : card.isPercent ? `${card.value}%` : `$${card.value.toLocaleString()}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Evolución de Gastos */}
        <div className="glass-card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <TrendingUp size={20} />
              </div>
              Evolución de Gastos (Aprobados)
            </h2>
          </div>
          <div className="h-[350px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <AlertCircle size={40} className="opacity-20" />
                <p className="font-medium">No hay datos suficientes para generar la tendencia</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Tiendas */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
              <Building2 size={20} />
            </div>
            Top 5 Tiendas (Gasto Aprobado)
          </h2>
          <div className="h-[350px]">
            {topStores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStores} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight={600} width={100} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={30}>
                    {topStores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <Building2 size={40} className="opacity-20" />
                <p className="font-medium">Sin datos de tiendas</p>
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <PieChartIcon size={20} />
            </div>
            Distribución por Categoría
          </h2>
          <div className="h-[350px]">
            {paymentsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie 
                    data={paymentsByCategory} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={100} 
                    paddingAngle={5}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <PieChartIcon size={40} className="opacity-20" />
                <p className="font-medium">Sin datos de categorías</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparativa Presupuesto vs Real */}
        <div className="glass-card p-8 lg:col-span-2">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileText size={20} />
            </div>
            Cumplimiento Portafolio: Ejecutado vs Presupuestado
          </h2>
          <div className="h-[350px]">
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar dataKey="budget" name="Presupuesto" fill="#1e293b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Ejecutado" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <FileText size={40} className="opacity-20" />
                <p className="font-medium">No hay datos de presupuesto cargados para las fechas seleccionadas</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
