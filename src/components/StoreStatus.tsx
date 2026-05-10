
import React, { useState, useMemo } from 'react';
import { Payment, PaymentStatus, Store, BudgetEntry } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Store as StoreIcon, 
  MapPin,
  Search,
  Filter,
  ArrowRightLeft,
  X,
  Plus,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import VenezuelaMap from './VenezuelaMap';

interface StoreStatusProps {
  payments: Payment[];
  budgets: BudgetEntry[];
  userStoreIds?: string[];
  stores: Store[];
}

export const StoreStatus: React.FC<StoreStatusProps> = ({ payments, budgets, userStoreIds = [], stores }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredStore, setHoveredStore] = useState<string | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Calcular el estado dinámico de las tiendas basado en los pagos reales
  const dynamicStores = useMemo(() => {
    let storesToProcess = stores;
    if (userStoreIds.length > 0) {
      storesToProcess = stores.filter(s => userStoreIds.includes(s.id));
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return storesToProcess.map(store => {
        // Obtener pagos asociados a esta tienda
        const storePayments = payments.filter(p => p.storeId === store.id);
        
        // Lógica de Estado
        let calculatedStatus: 'En Regla' | 'En Riesgo' | 'Vencido' = 'En Regla';
        
        const hasOverdue = storePayments.some(p => p.status === PaymentStatus.OVERDUE);
        const hasPending = storePayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);

        // Budget Check for Store
        const hasBudgetExceeded = budgets.some(b => {
            if (b.storeId !== store.id) return false;
            const bDate = new Date(b.date);
            if (bDate.getMonth() !== currentMonth || bDate.getFullYear() !== currentYear) return false;
            
            // For this budget entry, find corresponding payments
            const itemCodePrefix = b.title.split(' ')[0];
            const totalPaid = storePayments
                .filter(p => p.category === b.category && p.specificType.startsWith(itemCodePrefix))
                .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            return totalPaid > b.amount;
        });

        if (hasOverdue || hasBudgetExceeded) {
            calculatedStatus = 'Vencido';
        } else if (hasPending) {
            calculatedStatus = 'En Riesgo';
        }

        // Calcular próxima fecha límite real basada en el pago pendiente más próximo
        const activePayments = storePayments
            .filter(p => p.status !== PaymentStatus.APPROVED && p.status !== PaymentStatus.REJECTED)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        const nextDeadline = activePayments.length > 0 ? activePayments[0].dueDate : store.nextDeadline;

        // Estadísticas para comparación
        const totalPaid = storePayments
            .filter(p => p.status === PaymentStatus.APPROVED)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const totalPending = storePayments
            .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE)
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            ...store,
            status: calculatedStatus,
            nextDeadline: nextDeadline,
            stats: {
                totalPaid,
                totalPending,
                paymentCount: storePayments.length
            }
        };
    });
  }, [payments, budgets, stores, userStoreIds]);

  const toggleStoreSelection = (id: string) => {
    setSelectedStoreIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStoreIds([]);
  };

  const selectedStores = useMemo(() => 
    dynamicStores.filter(s => selectedStoreIds.includes(s.id)),
  [dynamicStores, selectedStoreIds]);

  // Calcular estadísticas para el gráfico basadas en datos dinámicos
  const stats = [
    { 
      name: 'En Regla', 
      value: dynamicStores.filter(s => s.status === 'En Regla').length, 
      color: '#10b981', // emerald-500
      textColor: 'text-emerald-600'
    },
    { 
      name: 'En Riesgo', 
      value: dynamicStores.filter(s => s.status === 'En Riesgo').length, 
      color: '#f59e0b', // amber-500
      textColor: 'text-amber-600'
    },
    { 
      name: 'Vencido', 
      value: dynamicStores.filter(s => s.status === 'Vencido').length, 
      color: '#ef4444', // red-500
      textColor: 'text-red-600'
    },
  ];

  const filteredStores = dynamicStores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    store.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
       <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estado de la Red</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoreo en tiempo real de cumplimiento fiscal por sucursal.</p>
            </div>
            <div className="flex gap-3">
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar tienda..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200 w-full md:w-64"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 </div>
                 {(searchTerm !== '' || selectedStoreIds.length > 0) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 animate-in fade-in zoom-in"
                    >
                        <RotateCcw size={16} />
                        <span className="hidden sm:inline">Limpiar Filtros</span>
                    </button>
                 )}
                 <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Filter size={20} />
                 </button>
            </div>
       </header>

       {/* Top Section: Charts & Map */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Distribución de Estatus</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                                axisLine={false} 
                                tickLine={false} 
                                width={80}
                            />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Real Map Card */}
            <VenezuelaMap stores={dynamicStores} selectedStoreIds={selectedStoreIds} onStoreClick={toggleStoreSelection} />
       </div>

       {/* Comparison Panel */}
       {selectedStores.length > 0 && (
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                           <ArrowRightLeft size={20} />
                       </div>
                       <h3 className="font-bold text-lg text-white">Comparativa de Desempeño Fiscal</h3>
                   </div>
                   <button 
                       onClick={() => setSelectedStoreIds([])}
                       className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                   >
                       <X size={16} /> Limpiar selección
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {selectedStores.map(store => (
                       <div key={store.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="font-bold text-white text-sm">{store.name}</h4>
                                   <p className="text-[10px] text-slate-400">{store.location}</p>
                               </div>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    store.status === 'En Regla' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    store.status === 'En Riesgo' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                    {store.status}
                                </span>
                           </div>

                           <div className="grid grid-cols-2 gap-2">
                               <div className="bg-slate-900/50 p-2 rounded-lg">
                                   <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Ejecutado</p>
                                   <p className="text-xs font-bold text-blue-400">${store.stats.totalPaid.toLocaleString()}</p>
                               </div>
                               <div className="bg-slate-900/50 p-2 rounded-lg">
                                   <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Pendiente</p>
                                   <p className="text-xs font-bold text-orange-400">${store.stats.totalPending.toLocaleString()}</p>
                               </div>
                           </div>

                           <div className="space-y-2">
                               <div className="flex justify-between text-[10px]">
                                   <span className="text-slate-400">Cumplimiento</span>
                                   <span className="text-white font-bold">
                                       {store.stats.paymentCount > 0 
                                           ? Math.round((store.stats.totalPaid / (store.stats.totalPaid + store.stats.totalPending || 1)) * 100) 
                                           : 0}%
                                   </span>
                               </div>
                               <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                   <div 
                                       className={`h-full transition-all duration-500 ${
                                           store.status === 'En Regla' ? 'bg-emerald-500' : 
                                           store.status === 'En Riesgo' ? 'bg-amber-500' : 'bg-red-500'
                                       }`}
                                       style={{ width: `${Math.round((store.stats.totalPaid / (store.stats.totalPaid + store.stats.totalPending || 1)) * 100)}%` }}
                                   ></div>
                               </div>
                           </div>
                       </div>
                   ))}
                   
                   {selectedStores.length < 4 && (
                       <div className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center group hover:border-slate-700 transition-colors">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2 group-hover:scale-110 transition-transform">
                               <Plus size={20} />
                           </div>
                           <p className="text-[10px] text-slate-500">Seleccione otra tienda en el directorio para comparar</p>
                       </div>
                   )}
               </div>
           </div>
       )}

        {/* Directory List */}
        <div className="space-y-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <StoreIcon size={20} className="text-blue-500" />
                Directorio de Sucursales
            </h2>

            {filteredStores.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    No se encontraron tiendas con ese criterio.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredStores.map((store) => (
                        <div 
                            key={store.id} 
                            onMouseEnter={() => setHoveredStore(store.id)}
                            onMouseLeave={() => setHoveredStore(null)}
                            onClick={() => toggleStoreSelection(store.id)}
                            className={`bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer relative ${
                                selectedStoreIds.includes(store.id)
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : hoveredStore === store.id 
                                ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/20 translate-y-[-2px]' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {selectedStoreIds.includes(store.id) && (
                                <div className="absolute top-2 right-2 text-blue-500 animate-in zoom-in duration-200">
                                    <CheckCircle2 size={16} />
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        store.status === 'Vencido' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 
                                        store.status === 'En Riesgo' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 
                                        'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
                                    }`}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{store.name}</h3>
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <MapPin size={10} /> {store.location}
                                            </p>
                                            {store.municipality && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                    Mun. {store.municipality}
                                                </p>
                                            )}
                                            {store.address && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic line-clamp-1" title={store.address}>
                                                    {store.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    store.status === 'En Regla' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' :
                                    store.status === 'En Riesgo' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' :
                                    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                                }`}>
                                    {store.status}
                                </span>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Próximo cierre:</span>
                                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
                                    {store.nextDeadline}
                                    {store.status === 'En Regla' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                    {store.status === 'En Riesgo' && <AlertTriangle size={14} className="text-amber-500" />}
                                    {store.status === 'Vencido' && <XCircle size={14} className="text-red-500" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
