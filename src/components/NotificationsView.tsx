
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Filter,
  ArrowLeft,
  Settings,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  Bell,
  Smartphone,
  MessageSquare,
  Link as LinkIcon,
  PlayCircle,
  Loader2,
  Save,
  CheckCircle2,
  RefreshCw,
  Send
} from 'lucide-react';
import { AlertItem, AlertSeverity, SystemSettings, Payment, PaymentStatus, User, Store, Role } from '../types';
import { api } from '../services/api';
import { firestoreService } from '../services/firestoreService';
import { notificationService } from '../services/notificationService';
import { formatTime } from '../utils';
import { sendPushNotification, requestNotificationPermission } from '../utils/pushNotifications';
import { Building2 } from 'lucide-react';

interface NotificationsViewProps {
  onBack: () => void;
  payments: Payment[]; // Recibe los datos reales
  onManage: (paymentId: string) => void; // Callback para el botón gestionar
  onRefresh?: () => Promise<void> | void; // Callback para actualizar datos
  users?: User[];
  settings?: SystemSettings | null;
  currentUser?: User | null;
  stores?: Store[];
}

const ITEMS_PER_PAGE = 6;
const REFRESH_INTERVAL = 60000; // 60 segundos

export const NotificationsView: React.FC<NotificationsViewProps> = ({ 
  onBack, 
  payments, 
  onManage, 
  onRefresh,
  users = [],
  settings = null,
  currentUser,
  stores = []
}) => {
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    currentUser?.storeIds && currentUser.storeIds.length > 0 ? currentUser.storeIds[0] : 'all'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifyingAlertId, setNotifyingAlertId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Paginación State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState<'severity' | 'date'>('severity');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Custom Expirations State (Persisted)
  const [customExpirations, setCustomExpirations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('custom_expirations');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('custom_expirations', JSON.stringify(customExpirations));
  }, [customExpirations]);

  // Settings State
  const [config, setConfig] = useState<SystemSettings>({
      whatsappEnabled: false,
      whatsappPhone: '',
      whatsappGatewayUrl: '',
      daysBeforeWarning: 3,
      daysBeforeCritical: 1,
      emailEnabled: true,
      exchangeRate: 1,
      pushEnabled: true,
      notifyPending: true,
      notifyOverdue: true,
      refreshInterval: 60
  });

  // Sync config with settings prop
  useEffect(() => {
    if (settings) {
      setConfig(settings);
    }
  }, [settings]);

  // Auto-refresh Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (onRefresh && !showSettings && config.refreshInterval && config.refreshInterval > 0) {
        interval = setInterval(async () => {
            setIsRefreshing(true);
            await onRefresh();
            setLastUpdated(new Date());
            setIsRefreshing(false);
        }, config.refreshInterval * 1000);
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [onRefresh, showSettings, config.refreshInterval]);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
      if (onRefresh && !isRefreshing) {
          setIsRefreshing(true);
          await onRefresh();
          setLastUpdated(new Date());
          setIsRefreshing(false);
      }
  };

  const handleNotifyPerson = async (alert: AlertItem) => {
    if (!users.length || !config) return;
    
    const payment = payments.find(p => p.id === alert.paymentId);
    if (!payment) return;

    setNotifyingAlertId(alert.id);
    try {
      await notificationService.notifyPaymentReminder(payment, users, config);
      // Podríamos mostrar un toast de éxito aquí si tuviéramos un sistema de notificaciones globales
    } catch (error) {
      console.error('Error sending manual notification:', error);
    } finally {
      setNotifyingAlertId(null);
    }
  };

  // Generar Alertas dinámicamente basadas en los Pagos reales
  const alerts: AlertItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredPayments = selectedStoreId === 'all' 
      ? payments 
      : payments.filter(p => p.storeId === selectedStoreId);

    return filteredPayments
      .filter(p => p.status !== PaymentStatus.APPROVED && p.status !== PaymentStatus.REJECTED) // Solo pendientes/vencidos/cargados
      .map(p => {
        const effectiveDueDate = customExpirations[p.id] || p.dueDate;
        const dueDate = new Date(effectiveDueDate + 'T00:00:00'); // Asegurar formato ISO
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let severity: AlertSeverity = 'scheduled';
        let timeLabel = '';

        if (diffDays < 0) {
            severity = 'critical';
            timeLabel = `Vencido hace ${Math.abs(diffDays)} día(s)`;
        } else if (diffDays === 0) {
            severity = 'critical';
            timeLabel = 'Vence HOY';
        } else if (diffDays <= (config.daysBeforeWarning || 5)) {
            severity = 'scheduled';
            timeLabel = `Vence en ${diffDays} día(s)`;
        } else {
            severity = 'scheduled';
            timeLabel = `Programado (${diffDays} días)`;
        }

        let auditDaysCount = undefined;
        let auditSeverity: 'green' | 'amber' | 'red' | 'critical' | undefined = undefined;

        // Si ya está cargado (Uploaded), calcula el tiempo en auditoría
        if (p.status === PaymentStatus.UPLOADED) {
            severity = 'scheduled';
            
            if (p.submittedDate) {
                const submittedDate = new Date(p.submittedDate);
                const diffTimeAudit = today.getTime() - submittedDate.getTime();
                const elapsedDays = Math.floor(diffTimeAudit / (1000 * 60 * 60 * 24));
                const auditDaysRemaining = 8 - elapsedDays;
                
                // Lógica de semáforo (8 días para aprobar):
                // 8 a 5 días: verde
                // 4 a 1 días: naranja
                // 0 o menos días: rojo (negativo)
                if (auditDaysRemaining >= 5) {
                    auditSeverity = 'green';
                } else if (auditDaysRemaining >= 1) {
                    auditSeverity = 'amber';
                } else {
                    auditSeverity = 'red';
                    severity = 'critical'; 
                }
                
                auditDaysCount = auditDaysRemaining;
                timeLabel = `En auditoría (${auditDaysCount} días restantes)`;
            } else {
                timeLabel = 'En revisión por auditoría';
            }
        }

        return {
            id: p.id,
            paymentId: p.id,
            storeName: p.storeName,
            storeId: p.storeId,
            category: p.category,
            title: p.specificType,
            amount: p.amount,
            severity,
            timeLabel,
            dueDate: effectiveDueDate,
            paymentDate: p.paymentDate,
            auditDaysCount,
            auditSeverity
        };
      })
      .sort((a, b) => {
          if (sortBy === 'date') {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          // Ordenar: Críticas primero, luego próximas
          const severityOrder = { 'critical': 0, 'scheduled': 1 };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
              return severityOrder[a.severity] - severityOrder[b.severity];
          }
          // Si tienen misma severidad, por fecha
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [payments, config.daysBeforeWarning, customExpirations, sortBy, selectedStoreId]);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filter, payments]);

  // Request Notification Permission
  useEffect(() => {
    if (config.pushEnabled) {
      requestNotificationPermission();
    }
  }, [config.pushEnabled]);

  // Trigger Push Notifications
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      const initialSet = new Set(alerts.map(a => a.id));
      setNotifiedAlerts(initialSet);
      isInitialMount.current = false;
      return;
    }

    if (!config.pushEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const newNotifiedAlerts = new Set(notifiedAlerts);
    let newAlertsCount = 0;
    let lastAlert: AlertItem | null = null;

    alerts.forEach(alert => {
      if (!notifiedAlerts.has(alert.id)) {
        let shouldNotify = false;
        
        if (alert.severity === 'critical' && config.notifyOverdue) {
          shouldNotify = true;
        } else if (alert.severity === 'scheduled' && config.notifyPending) {
          shouldNotify = true;
        }

        if (shouldNotify) {
          newNotifiedAlerts.add(alert.id);
          newAlertsCount++;
          lastAlert = alert;
        }
      }
    });

    if (newAlertsCount > 0) {
      if (newAlertsCount === 1 && lastAlert) {
        sendPushNotification('Forza 22', {
          body: `${(lastAlert as AlertItem).storeName}: ${(lastAlert as AlertItem).title} - ${(lastAlert as AlertItem).timeLabel}`
        });
      } else {
        sendPushNotification('Forza 22', {
          body: `Tienes ${newAlertsCount} nuevas alertas de pagos.`
        });
      }
      setNotifiedAlerts(newNotifiedAlerts);
    }
  }, [alerts, config.pushEnabled, config.notifyOverdue, config.notifyPending, notifiedAlerts]);

  // Cargar configuración al abrir la vista de settings
  useEffect(() => {
    if (showSettings) {
      const fetchSettings = async () => {
        try {
            const saved = await firestoreService.getSettings();
            if (saved) {
                setConfig(prev => ({ ...prev, ...saved }));
            }
        } catch (e) {
            console.error("Error loading settings", e);
        }
      };
      fetchSettings();
    }
  }, [showSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await firestoreService.saveSettings(config);
      await onRefresh();
      alert('✅ Configuración guardada en Firestore.');
    } catch (e) {
      alert('❌ Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      if (config.pushEnabled && Notification.permission === 'granted') {
        sendPushNotification('Forza 22', {
          body: 'Esta es una notificación de prueba.',
        });
      }
      
      if (config.whatsappEnabled) {
        const res = await api.triggerNotificationCheck();
        if (res.error || res.status === 'error' || res.success === false) {
          const detail = res.message || res.error || 'Error desconocido';
          alert(`❌ Error en prueba WhatsApp: ${detail}\n\nPor favor, verifica que las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN estén configuradas en el menú de Ajustes (Settings) de la aplicación.`);
        } else {
          alert(`✅ Resultado prueba WhatsApp: ${res.message || 'Chequeo completado con éxito'}`);
        }
      } else if (config.pushEnabled) {
        alert('Notificación Push de prueba enviada.');
      } else {
        alert('No hay canales de notificación habilitados para probar.');
      }
    } catch (e) {
      alert('Error ejecutando prueba');
    } finally {
      setIsTesting(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={18} />;
      case 'scheduled': return <Calendar size={18} />;
      default: return <Bell size={18} />;
    }
  };

  // Filtrado visual y Paginación
  const filteredAlerts = alerts.filter(alert => {
    // Filtro por severidad/tipo
    if (filter !== 'all' && alert.severity !== filter) return false;
    
    // Filtro por concepto (search)
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && !alert.category.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
    }

    // Filtro por fecha
    if (dateFilter) {
        // Puede filtrar por dueDate o paymentDate si existe
        const alertDate = alert.dueDate;
        const pDate = alert.paymentDate;
        if (alertDate !== dateFilter && pDate !== dateFilter) return false;
    }

    return true;
  });

  const visibleAlerts = filteredAlerts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAlerts.length;

  if (showSettings) {
      return (
          <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                      <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                  </button>
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Automatización</h1>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona los canales de envío y frecuencias de alerta.</p>
                  </div>
              </div>

              <div className="space-y-6">
                  {/* WhatsApp Configuration */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl">
                              <MessageSquare size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">Integración WhatsApp</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Envío automático mediante Gateway API (CallMeBot, Twilio, etc)</p>
                          </div>
                          <div className="ml-auto">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.whatsappEnabled}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setConfig({...config, whatsappEnabled: isChecked});
                                        if (isChecked) {
                                            // Optional: could also set a local state to show a more persistent message
                                        }
                                    }} 
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500"></div>
                              </label>
                          </div>
                      </div>

                      {config.whatsappEnabled && (
                          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                              <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                              <div className="space-y-1">
                                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Automatización Activa</p>
                                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                                      El sistema realiza auditorías automáticas de pagos cada 24 horas y envía resúmenes a los destinatarios configurados.
                                  </p>
                              </div>
                          </div>
                      )}

                      <div className={`space-y-4 transition-all ${config.whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">URL del Gateway / API</label>
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    value={config.whatsappGatewayUrl}
                                    onChange={(e) => setConfig({...config, whatsappGatewayUrl: e.target.value})}
                                    placeholder="Ej: https://api.callmebot.com/whatsapp.php?phone=[PHONE]&text=[MESSAGE]&apikey=TU_KEY" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono"
                                  />
                                  <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1.5 ml-1">
                                  Soporta variables: <code>[PHONE]</code> y <code>[MESSAGE]</code>. Si usa CallMeBot, coloque la URL completa con su API Key.
                              </p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Número Destino (Admin)</label>
                              <div className="relative">
                                  <input 
                                    type="text"
                                    value={config.whatsappPhone}
                                    onChange={(e) => setConfig({...config, whatsappPhone: e.target.value})} 
                                    placeholder="+58 412 1234567" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono"
                                  />
                                  <Smartphone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Email Configuration (Resend) */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                              <Send size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">Integración de Correo (Resend)</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Envío de alertas y recibos de nómina vía Email</p>
                          </div>
                          <div className="ml-auto">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.emailEnabled}
                                    onChange={(e) => setConfig({...config, emailEnabled: e.target.checked})} 
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
                              </label>
                          </div>
                      </div>

                      <div className={`space-y-4 transition-all ${config.emailEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                              * El servicio utiliza <strong>Resend</strong> configurado en el servidor. Asegúrese de que las variables de entorno <code>RESEND_API_KEY</code> y <code>RESEND_FROM_EMAIL</code> estén configuradas en el panel de control.
                          </p>
                      </div>
                  </div>

                  {/* Frequency Settings */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                           <Clock size={20} className="text-blue-500" />
                           Frecuencia de Alertas
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Días antes (Aviso Preventivo)</label>
                               <input 
                                  type="number" 
                                  value={config.daysBeforeWarning}
                                  onChange={(e) => setConfig({...config, daysBeforeWarning: Number(e.target.value)})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Días antes (Aviso Crítico)</label>
                               <input 
                                  type="number" 
                                  value={config.daysBeforeCritical}
                                  onChange={(e) => setConfig({...config, daysBeforeCritical: Number(e.target.value)})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Intervalo de Actualización (seg)</label>
                               <input 
                                  type="number" 
                                  value={config.refreshInterval}
                                  onChange={(e) => setConfig({...config, refreshInterval: Number(e.target.value)})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                               />
                           </div>
                       </div>
                  </div>

                  {/* Push Notifications Settings */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                              <Bell size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">Notificaciones Push</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Configura las notificaciones en el navegador</p>
                          </div>
                          <div className="ml-auto">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.pushEnabled}
                                    onChange={(e) => setConfig({...config, pushEnabled: e.target.checked})} 
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                              </label>
                          </div>
                      </div>

                      <div className={`space-y-4 transition-all ${config.pushEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">Pagos Pendientes</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Recibir notificaciones para pagos próximos a vencer</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.notifyPending}
                                    onChange={(e) => setConfig({...config, notifyPending: e.target.checked})} 
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
                              </label>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">Pagos Vencidos</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Recibir notificaciones para pagos que ya han vencido</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.notifyOverdue}
                                    onChange={(e) => setConfig({...config, notifyOverdue: e.target.checked})} 
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-red-500"></div>
                              </label>
                          </div>
                      </div>
                  </div>

                  {/* Exchange Rate Settings */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                           <RefreshCw size={20} className="text-emerald-500" />
                           Tasa de Cambio ($/Bs)
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Tasa Manual (Bs por $1)</label>
                               <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Bs.</span>
                                   <input 
                                      type="number" 
                                      step="0.01"
                                      value={config.exchangeRate}
                                      onChange={(e) => setConfig({...config, exchangeRate: Number(e.target.value)})}
                                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-12 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white font-mono"
                                   />
                               </div>
                               <p className="text-[10px] text-slate-500 mt-2">Esta tasa se usará para convertir todos los montos en dólares a bolívares en el sistema.</p>
                           </div>
                       </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                       <button 
                        onClick={handleTestNotification}
                        disabled={isTesting || (!config.whatsappEnabled && !config.pushEnabled && !config.emailEnabled)}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                           {isTesting ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                           Probar Envío Manual
                       </button>
                       <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                           {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                           Guardar Cambios
                       </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500 dark:text-slate-400">
                        {alerts.length} alertas activas.
                    </p>
                    {onRefresh && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 pl-2 border-l border-slate-300 dark:border-slate-700">
                            <span>Actualizado: {formatTime(lastUpdated)}</span>
                            <button 
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all ${isRefreshing ? 'animate-spin text-blue-500' : 'text-slate-500 hover:text-blue-500'}`}
                                title="Actualizar lista ahora"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.AUDITOR) && (
              <div className="relative group">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  disabled={currentUser?.storeIds && currentUser.storeIds.length === 1}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block py-2.5 pl-10 pr-10 transition-all outline-none cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {(!currentUser?.storeIds || currentUser.storeIds.length === 0) && <option value="all">Todas las Tiendas</option>}
                  {(currentUser?.storeIds && currentUser.storeIds.length > 0 ? stores.filter(s => currentUser.storeIds!.includes(s.id)) : stores).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            )}
            <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
                <Settings size={18} />
                <span>Configurar</span>
            </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
                { id: 'all', label: 'Todas las Alertas' },
                { id: 'critical', label: 'Críticas (Vencidas)' },
                { id: 'scheduled', label: 'Programadas' }
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setFilter(item.id as any)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                        filter === item.id 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    {item.label}
                </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
              <button 
                  onClick={() => setSortBy('severity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'severity' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Prioridad
              </button>
              <button 
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'date' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Fecha
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Buscar por concepto o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
            </div>
            <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
                {dateFilter && (
                    <button 
                        onClick={() => setDateFilter('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-bold"
                    >
                        Limpiar
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                <Filter size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {filteredAlerts.length} resultados encontrados
                </span>
            </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Todo en orden</h3>
                <p className="text-slate-500 dark:text-slate-500">No hay alertas con el filtro seleccionado.</p>
            </div>
        ) : (
            <>
                {visibleAlerts.map((alert) => (
                    <div key={alert.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                        <div className="flex-1 flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                                'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
                            }`}>
                                {getSeverityIcon(alert.severity)}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-500">
                                        <Building2 size={10} />
                                        Tienda: {alert.storeName}
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{alert.category}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    <span className="text-blue-500 dark:text-blue-400 text-xs font-black block uppercase mb-0.5">Concepto de Pago</span>
                                    {alert.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Estado / Tiempo</span>
                                        <p className={`text-sm font-bold ${
                                            alert.auditSeverity === 'critical' ? 'text-red-700 dark:text-red-400' :
                                            alert.severity === 'critical' ? 'text-red-500' : 
                                            alert.auditSeverity === 'amber' ? 'text-amber-500' :
                                            alert.auditSeverity === 'green' ? 'text-emerald-500' :
                                            'text-emerald-500'
                                        }`}>
                                            {alert.timeLabel}
                                        </p>
                                    </div>

                                    {alert.auditDaysCount !== undefined && (
                                        <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-3">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Plazo Auditoría</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    alert.auditSeverity === 'critical' ? 'bg-red-700 animate-pulse' :
                                                    alert.auditSeverity === 'red' ? 'bg-red-500' :
                                                    alert.auditSeverity === 'amber' ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}></span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {alert.auditDaysCount} {Math.abs(alert.auditDaysCount) === 1 ? 'día' : 'días'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Fecha de Pago / Soporte</span>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {alert.paymentDate ? new Date(alert.paymentDate + 'T00:00:00').toLocaleDateString('es-ES') : 'No registrada'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                        <Calendar size={12} className="text-slate-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Vencimiento</span>
                                            <input 
                                                type="date"
                                                value={alert.dueDate}
                                                onChange={(e) => setCustomExpirations(prev => ({ ...prev, [alert.id]: e.target.value }))}
                                                className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pl-4 border-l border-slate-100 dark:border-slate-800 md:border-l-0 md:pl-0">
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-slate-900 dark:text-white">${alert.amount.toLocaleString()}</span>
                                <span className="text-xs text-slate-400">Monto estimado</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleNotifyPerson(alert)}
                                    disabled={notifyingAlertId === alert.id || (!config.whatsappEnabled && !config.emailEnabled)}
                                    className="px-4 py-2 bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                    title="Enviar recordatorio por WhatsApp/Email"
                                >
                                    {notifyingAlertId === alert.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    <span className="hidden sm:inline">Notificar</span>
                                </button>
                                <button 
                                    onClick={() => onManage(alert.id)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <span>Gestionar</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Botón de Cargar Más / Paginación */}
                {hasMore && (
                    <div className="flex flex-col items-center pt-4 animate-in fade-in">
                        <p className="text-xs text-slate-400 mb-2">
                            Mostrando {visibleAlerts.length} de {filteredAlerts.length} alertas
                        </p>
                        <button 
                            onClick={handleLoadMore}
                            className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                        >
                            <span>Cargar más alertas</span>
                            <ChevronDown size={16} />
                        </button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
