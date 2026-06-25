import React, { useState, useEffect } from 'react';
import App from './App';
import { PayrollStandaloneApp } from './apps/payroll/PayrollStandaloneApp';
import { Login } from './components/Login';
import { authService } from './services/auth';
import { User, Role } from './types';
import { Loader2, LayoutGrid, DollarSign, Users, Shield, Bell, ChevronLeft, Building2, BarChart3, LogOut, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_LOGO_URL } from './constants';

type AppId = 'hub' | 'core' | 'payroll' | 'analytics';

export const SaaSPlatformShell: React.FC = () => {
  const [activeApp, setActiveApp] = React.useState<AppId>(() => {
    const path = window.location.pathname;
    if (path.includes('/payroll')) return 'payroll';
    const saved = localStorage.getItem('active_saas_app');
    // Default to 'hub' initially for standard new users to see the platform menu
    return (saved as AppId) || 'hub';
  });

  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('active_saas_app', activeApp);
  }, [activeApp]);

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const applications = [
    {
      id: 'core' as AppId,
      name: 'Finanzas',
      description: 'Control de pagos, presupuestos y auditoría.',
      icon: DollarSign,
      color: 'bg-emerald-500',
      active: true,
    },
    {
      id: 'payroll' as AppId,
      name: 'Nómina',
      description: 'Gestión de personal y recibos de pago.',
      icon: Users,
      color: 'bg-indigo-500',
      active: true,
    },
    {
      id: 'analytics' as AppId,
      name: 'Analytics (Próximamente)',
      description: 'Dashboard integral y métricas empresariales.',
      icon: BarChart3,
      color: 'bg-purple-500',
      active: false,
    }
  ];

  const handleLaunchApp = (appId: AppId, isActive: boolean) => {
    if (!isActive) return;
    setActiveApp(appId);
    setIsLauncherOpen(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const renderTopBar = () => (
    <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 z-[100] border-b border-slate-800">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsLauncherOpen(!isLauncherOpen)}
          className={`p-2 rounded-lg transition-colors ${isLauncherOpen ? 'bg-slate-700' : 'hover:bg-slate-800'} text-slate-300 hover:text-white`}
        >
          <LayoutGrid size={20} />
        </button>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveApp('hub')}>
          <div className="h-8 flex-shrink-0 flex items-center justify-center">
            <img src={APP_LOGO_URL} alt="Forza Gerencia" className="h-10 w-auto object-contain" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-md mx-8 hidden md:flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar en toda la plataforma..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
        </button>
        <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role || 'Usuario'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-300">
            {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppDrawer = () => (
    <AnimatePresence>
      {isLauncherOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsLauncherOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }} 
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-16 left-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[200] overflow-hidden flex flex-col"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Tus Aplicaciones</span>
            </div>
            <div className="p-2 grid grid-cols-3 gap-1">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id, app.active)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-all ${app.active ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'opacity-50 cursor-not-allowed'} ${activeApp === app.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner ${app.color}`}>
                    <app.icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
                    {app.name.split(' ')[0]} {/* Short name */}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold transition-colors"
               >
                 <LogOut size={16} /> Salir
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderHub = () => (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Buenos días, {currentUser.name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Bienvenido a tu plataforma empresarial centralizada.
          </p>
        </header>

        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mb-4">Aplicaciones Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => handleLaunchApp(app.id, app.active)}
                className={`text-left group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden ${app.active ? 'hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}`}
              >
                {!app.active && (
                  <div className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    Pronto
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner mb-5 flex-shrink-0 ${app.color}`}>
                  <app.icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {app.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {app.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Future Hub Widgets could go here (e.g. Recent Activity globally) */}
        <section className="mt-16">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mb-4">Actividad Reciente</h2>
           <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Shield className="text-slate-400" size={24} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">El registro de actividad global se mostrará aquí.</p>
           </div>
        </section>

      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-900">
      {renderTopBar()}
      {renderAppDrawer()}
      
      <div className="flex-1 w-full relative flex flex-col bg-white dark:bg-slate-900 overflow-hidden rounded-tl-xl rounded-tr-xl">
        {activeApp === 'hub' ? (
          renderHub()
        ) : activeApp === 'core' ? (
          <App user={currentUser} />
        ) : activeApp === 'payroll' ? (
          <PayrollStandaloneApp user={currentUser} />
        ) : null}
      </div>
    </div>
  );
};
