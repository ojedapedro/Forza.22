
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Zap, 
  ShieldCheck,
  ArrowRight,
  User,
  Calendar,
  BarChart3,
  Filter,
  Store as StoreIcon,
  Search
} from 'lucide-react';
import { Payment, AuditLog, PaymentStatus, Role } from '../types';

interface EvaluationModuleProps {
  payments: Payment[];
}

interface EvaluationKPIs {
  id: string;
  idCompromiso: string;
  storeName: string;
  fechaVencimiento: string;
  traceability: string[];
  fullHistory: AuditLog[];
  auditorSpeedHours: number | null;
  adminCorrectionHours: number | null;
  reworkCount: number;
  isLate: boolean;
  isNearDeadline: boolean;
  efficiencyScore: number;
  status: PaymentStatus;
}

export const EvaluationModule: React.FC<EvaluationModuleProps> = ({ payments }) => {
  const [auditorFilter, setAuditorFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  // Extract unique auditors and stores for filters
  const filterOptions = useMemo(() => {
    const auditors = new Set<string>();
    const stores = new Set<string>();

    payments.forEach(p => {
      if (p.storeName) stores.add(p.storeName);
      p.history?.forEach(log => {
        if (log.role === Role.AUDITOR) {
          auditors.add(log.actorName);
        }
      });
    });

    return {
      auditors: Array.from(auditors).sort(),
      stores: Array.from(stores).sort()
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStore = storeFilter === 'all' || p.storeName === storeFilter;
      const matchesAuditor = auditorFilter === 'all' || p.history?.some(log => log.role === Role.AUDITOR && log.actorName === auditorFilter);
      return matchesStore && matchesAuditor;
    });
  }, [payments, storeFilter, auditorFilter]);

  const evaluations = useMemo(() => {
    return filteredPayments.map(p => {
      const history = p.history || [];
      
      // 1. Trazabilidad Lineal
      const traceability = history.map(h => `${h.actorName} (${h.action})`);

      // 2. KPI Velocidad Auditor
      // Tiempo entre el primer envío (CREACION) y la primera respuesta del Auditor (APROBACION o RECHAZO)
      const creationLog = history.find(h => h.action === 'CREACION');
      const firstAuditorLog = history.find(h => h.action === 'APROBACION' || h.action === 'RECHAZO');
      
      let auditorSpeedHours = null;
      if (creationLog && firstAuditorLog) {
        const diff = new Date(firstAuditorLog.date).getTime() - new Date(creationLog.date).getTime();
        auditorSpeedHours = diff / (1000 * 60 * 60);
      }

      // 3. KPI Subsanación Administrador
      // Tiempo entre un RECHAZO y el siguiente CORRECCION
      const rejectionLog = history.find(h => h.action === 'RECHAZO');
      const correctionLog = history.find(h => h.action === 'CORRECCION' && new Date(h.date) > new Date(rejectionLog?.date || 0));
      
      let adminCorrectionHours = null;
      if (rejectionLog && correctionLog) {
        const diff = new Date(correctionLog.date).getTime() - new Date(rejectionLog.date).getTime();
        adminCorrectionHours = diff / (1000 * 60 * 60);
      }

      // 4. KPI Calidad (Rework)
      const reworkCount = history.filter(h => h.action === 'RECHAZO').length;

      // 5. Alerta de Vencimiento
      const finalApprovalLog = [...history].reverse().find(h => h.action === 'APROBACION');
      const dueDate = new Date(p.dueDate);
      const approvalDate = finalApprovalLog ? new Date(finalApprovalLog.date) : null;
      
      const isLate = approvalDate ? approvalDate > dueDate : false;
      const hoursToDeadline = (dueDate.getTime() - (approvalDate?.getTime() || Date.now())) / (1000 * 60 * 60);
      const isNearDeadline = !isLate && hoursToDeadline < 24 && hoursToDeadline > 0;

      // 6. Score de Eficiencia (Fórmula Propuesta)
      // Base 100
      // -20 por cada devolución (Rework)
      // -5 por cada 24h de retraso del Auditor (umbral 24h)
      // -5 por cada 24h de retraso del Admin (umbral 24h)
      // -40 si se aprobó después del vencimiento
      let score = 100;
      score -= (reworkCount * 20);
      
      if (auditorSpeedHours && auditorSpeedHours > 24) {
        score -= Math.floor((auditorSpeedHours - 24) / 24) * 5;
      }
      if (adminCorrectionHours && adminCorrectionHours > 24) {
        score -= Math.floor((adminCorrectionHours - 24) / 24) * 5;
      }
      if (isLate) score -= 40;

      return {
        id: p.id,
        idCompromiso: p.id,
        storeName: p.storeName,
        fechaVencimiento: p.dueDate,
        traceability,
        fullHistory: history,
        auditorSpeedHours,
        adminCorrectionHours,
        reworkCount,
        isLate,
        isNearDeadline,
        efficiencyScore: Math.max(0, score),
        status: p.status
      } as EvaluationKPIs;
    });
  }, [filteredPayments]);

  const avgEfficiency = evaluations.length > 0 
    ? evaluations.reduce((acc, curr) => acc + curr.efficiencyScore, 0) / evaluations.length 
    : 0;

  const totalReworks = evaluations.reduce((acc, curr) => acc + curr.reworkCount, 0);

  return (
    <div className="space-y-8 p-6 bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen">
      {/* Header Editorial Style */}
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
          Módulo de Evaluación
        </h1>
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-sm">
          <span className="flex items-center gap-1"><Zap size={14} /> KPI REAL-TIME</span>
          <span className="flex items-center gap-1"><ShieldCheck size={14} /> AUDITORÍA DE PROCESOS</span>
        </div>
      </div>

      {/* Summary Stats Recipe 8 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Eficiencia Promedio</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-light text-slate-900 dark:text-white">{avgEfficiency.toFixed(1)}</span>
            <span className="text-xl text-slate-400">/ 100</span>
          </div>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${avgEfficiency}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Total Devoluciones</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-light text-slate-900 dark:text-white">{totalReworks}</span>
            <span className="text-xl text-slate-400">REWORKS</span>
          </div>
          <p className="mt-4 text-sm text-slate-500 italic">Impacto directo en la trazabilidad lineal</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Alertas Críticas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-light text-red-500">
              {evaluations.filter(e => e.isLate || e.isNearDeadline).length}
            </span>
            <span className="text-xl text-slate-400">VENCIMIENTOS</span>
          </div>
          <p className="mt-4 text-sm text-red-500/70 font-medium">Requiere atención inmediata del Administrador</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <StoreIcon size={12} /> Filtrar por Tienda
          </label>
          <select 
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="all">Todas las Tiendas</option>
            {filterOptions.stores.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Filter size={12} /> Filtrar por Auditor
          </label>
          <select 
            value={auditorFilter}
            onChange={(e) => setAuditorFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="all">Todos los Auditores</option>
            {filterOptions.auditors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs pb-3">
          <Search size={14} />
          <span>Mostrando {filteredPayments.length} de {payments.length} transacciones</span>
        </div>
      </div>

      {/* Logical Table Recipe 1 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-bottom border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-serif italic text-xl text-slate-800 dark:text-slate-200">Matriz de Eficiencia Operativa</h2>
          <BarChart3 size={20} className="text-slate-400" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">ID Compromiso / Tienda</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Historial de Manos (Actor, Acción, Fecha)</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Velocidad Auditor</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Subsanación Admin</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Rework</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Score</th>
                <th className="p-4 font-mono text-[10px] uppercase tracking-tighter text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {evaluations.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{e.idCompromiso}</span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <StoreIcon size={10} /> {e.storeName}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar size={10} /> {e.fechaVencimiento}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-3">
                      {e.fullHistory.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-3 group/step">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              log.action === 'APROBACION' || log.action === 'APROBACION_MASIVA' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                              log.action === 'RECHAZO' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                              log.action === 'CORRECCION' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            {idx < e.fullHistory.length - 1 && <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 my-1" />}
                          </div>
                          <div className="flex flex-col min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{log.action}</span>
                              <span className="text-[9px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {new Date(log.date).toLocaleString('es-VE', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <User size={10} className="text-slate-400" />
                              <span className="text-[10px] text-slate-500 font-medium">{log.actorName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {e.auditorSpeedHours ? `${e.auditorSpeedHours.toFixed(1)}h` : '---'}
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {e.adminCorrectionHours ? `${e.adminCorrectionHours.toFixed(1)}h` : '---'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${e.reworkCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {e.reworkCount} Devoluciones
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${e.efficiencyScore > 80 ? 'bg-emerald-500' : e.efficiencyScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{e.efficiencyScore}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {e.isLate && <AlertCircle size={14} className="text-red-500" />}
                      {e.isNearDeadline && <Clock size={14} className="text-orange-500 animate-pulse" />}
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{e.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Proposal Recipe 10 */}
      <div className="bg-blue-600 p-12 rounded-[40px] text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-3xl font-serif italic mb-6">Propuesta de Score de Eficiencia</h3>
          <div className="space-y-4 font-light text-blue-100 leading-relaxed">
            <p className="text-xl">
              <span className="font-bold text-white">S = 100 - (R × 20) - (D_aud × 5) - (D_adm × 5) - (L × 40)</span>
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white rounded-full" />
                <span><strong className="text-white">R:</strong> Cantidad de Devoluciones (Rework)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white rounded-full" />
                <span><strong className="text-white">D_aud:</strong> Días de retraso Auditor (&gt;24h)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white rounded-full" />
                <span><strong className="text-white">D_adm:</strong> Días de retraso Admin (&gt;24h)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white rounded-full" />
                <span><strong className="text-white">L:</strong> Aprobación post-vencimiento (Binario)</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <TrendingUp size={200} />
        </div>
      </div>
    </div>
  );
};
