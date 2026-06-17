
import React from 'react';
import { 
  Users, 
  Store, 
  Calendar, 
  BarChart3, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  ArrowUpRight, 
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Brain,
  Zap
} from 'lucide-react';
import { Payment, PaymentStatus, Role, User, Category, Store as StoreType, BudgetEntry } from '../types';
import { formatDate } from '../utils';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface AdminControlPanelProps {
  payments: Payment[];
  users: User[];
  stores: StoreType[];
  budgets: BudgetEntry[];
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  payments = [],
  users = [],
  stores = [],
  budgets = [],
  currentUser,
  onNavigate
}) => {
  const { exchangeRate } = useExchangeRate();

  // Statistics Calculations
  const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
  const overduePayments = payments.filter(p => p.status === PaymentStatus.OVERDUE);
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const approvedPayments = payments.filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
  const totalApprovedAmount = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Store Health Distribution
  const healthData = [
    { name: 'En Regla', value: stores.filter(s => s.status === 'En Regla').length, color: '#10b981' },
    { name: 'En Riesgo', value: stores.filter(s => s.status === 'En Riesgo').length, color: '#f59e0b' },
    { name: 'Vencido', value: stores.filter(s => s.status === 'Vencido').length, color: '#ef4444' },
  ];

  const overallHealth = stores.length > 0 ? Math.round((healthData[0].value / stores.length) * 100) : 0;

  // Recent activity (mix of recent payments)
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.submittedDate || b.dueDate).getTime() - new Date(a.submittedDate || a.dueDate).getTime())
    .slice(0, 5);

  const quickLinks = [
    { id: 'user-management', label: 'Usuarios', icon: Users, desc: 'Control de accesos y roles', color: 'blue' },
    { id: 'store-management', label: 'Tiendas', icon: Store, desc: 'Administrar sucursales', color: 'emerald' },
    { id: 'reports', label: 'Reportes', icon: BarChart3, desc: 'Análisis y auditoría', color: 'indigo' },
    { id: 'predictive', label: 'Predicciones', icon: Brain, desc: 'IA y proyecciones fiscales', color: 'purple' },
    { id: 'calendar', label: 'Calendario', icon: Calendar, desc: 'Cronograma de obligaciones', color: 'amber' },
    { id: 'chat', label: 'Soporte', icon: MessageSquare, desc: 'Comunicación interna', color: 'pink' },
    { id: 'approvals', label: 'Auditoría', icon: ShieldCheck, desc: 'Validación de soportes', color: 'orange' },
    { id: 'settings', label: 'Ajustes', icon: Settings, desc: 'Parámetros del sistema', color: 'slate' },
  ];

  const getLinkStyles = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40';
      case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40';
      case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40';
      case 'purple': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40';
      case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40';
      case 'pink': return 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40';
      case 'orange': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40';
      default: return 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-900/40';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            Panel de Control
            <span className="text-xs font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">Admin</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Visión global de cumplimiento fiscal y estado general del sistema.</p>
        </div>
        <div className="flex items-center gap-4 md:border-l md:border-slate-100 md:dark:border-slate-800 md:pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sesión Actual</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(new Date().toISOString())}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-900/20 shrink-0">
            {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </header>

      {/* Bento Grid - Dashboard Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Main Financial Card (Span 2) */}
        <div className="sm:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden group shadow-lg shadow-blue-900/20">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-blue-100 text-sm font-semibold tracking-wide mb-1 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-200" /> Presupuesto Ejecutado
                </p>
                <p className="text-4xl sm:text-5xl font-black tracking-tighter">${totalApprovedAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-6 border-t border-white/20">
               <div>
                  <p className="text-blue-200 text-xs font-semibold mb-1 uppercase tracking-wider">Monto Vencido</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    ${totalOverdueAmount.toLocaleString()} 
                    {totalOverdueAmount > 0 && <AlertCircle size={16} className="text-amber-300" />}
                  </p>
               </div>
               <div>
                  <p className="text-blue-200 text-xs font-semibold mb-1 uppercase tracking-wider">Pagos Pendientes</p>
                  <p className="text-2xl font-bold">{pendingPayments.length} por revisar</p>
               </div>
            </div>
          </div>
          {/* Decoración Fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900/30 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
        </div>

        {/* Health Factor Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 focus-within:ring-2 focus-within:ring-emerald-500 transition-all overflow-hidden relative">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full uppercase tracking-widest">Global</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">Salud Fiscal</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{overallHealth}%</p>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              <Store size={12} /> {stores.length} Tiendas activas
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 text-emerald-50 dark:text-emerald-900/10 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
            <ShieldCheck size={140} strokeWidth={1} />
          </div>
        </div>

        {/* Users / System Status */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-blue-500/30 transition-all relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full uppercase tracking-widest">Activos</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">Usuarios del Sistema</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{users.length}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-bold flex items-center gap-1">
               <Zap size={12} /> Plataforma 100% operativa
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 text-blue-50 dark:text-blue-900/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Users size={120} strokeWidth={1} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Accesos Directos & Transacciones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Accesos Directos - Grid compacto */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Activity className="text-blue-500" size={20} />
              Navegación Rápida
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {quickLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className="flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group"
                >
                  <div className={`p-3 rounded-2xl ${getLinkStyles(link.color)} mb-3 transition-colors`}>
                    <link.icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1 line-clamp-1">{link.label}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block line-clamp-1">{link.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-slate-500" size={18} />
                Transacciones Recientes
              </h3>
              <button onClick={() => onNavigate('dashboard')} className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPayments.length > 0 ? recentPayments.map((p) => (
                <div key={p.id} className="px-6 sm:px-8 py-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                      {p.category.substring(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.specificType}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{p.storeName} • {formatDate(p.submittedDate || p.dueDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">${(p.amount || 0).toLocaleString()}</p>
                    <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                      p.status === PaymentStatus.APPROVED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      p.status === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              )) : (
                 <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                   No hay transacciones recientes.
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Gráficos y Tips */}
        <div className="space-y-6">
          {/* Distribución de Salud de Tiendas */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Store className="text-slate-500" size={18} />
              Cumplimiento de Sucursales
            </h3>
            
            <div className="h-56 flex items-center justify-center mb-6">
              {(() => {
                const R = 36;
                const C = 2 * Math.PI * R;
                const totalStores = stores.length;
                let accumulatedAngle = 0;

                return totalStores === 0 ? (
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r={R} fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-black text-slate-300 dark:text-slate-600">0</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full max-w-[220px]">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Fondo de anillo para darle un aspecto más pulido */}
                      <circle cx="50" cy="50" r={R} fill="transparent" stroke="currentColor" className="text-slate-50 dark:text-slate-800/50" strokeWidth="8"/>
                      {healthData.map((d) => {
                        if (d.value === 0) return null;
                        const pct = d.value / totalStores;
                        const strokeLength = pct * C;
                        const strokeOffset = C - (accumulatedAngle * C);
                        accumulatedAngle += pct;

                        return (
                          <circle
                            key={d.name}
                            cx="50"
                            cy="50"
                            r={R}
                            fill="transparent"
                            stroke={d.color}
                            strokeWidth="10"
                            strokeDasharray={`${strokeLength} ${C}`}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out hover:stroke-[12] cursor-pointer"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{totalStores}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Tiendas</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              {healthData.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: d.color }}></div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {d.value} <span className="text-xs text-slate-500 font-normal ml-0.5">{d.value === 1 ? 'suc.' : 'suc.'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips de Productividad / IA */}
          <div className="bg-slate-900 dark:bg-slate-950 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden group border border-slate-800 shadow-xl shadow-slate-900/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-white/10">
                  <Brain size={24} className="text-blue-300" />
                </div>
                <h3 className="text-xl font-bold leading-tight mb-3">Inteligencia Analítica</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium mb-8">
                  El sistema de evaluación predictiva detecta oportunidades de mejora en la planificación fiscal del próximo trimestre.
                </p>
              </div>
              <button 
                onClick={() => onNavigate('predictive')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
              >
                Analizar Proyecciones <ArrowUpRight size={16} />
              </button>
            </div>
            {/* Ambient Background blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

