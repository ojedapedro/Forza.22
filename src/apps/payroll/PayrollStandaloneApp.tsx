import React, { useState, useEffect } from 'react';
import { PayrollEntryPoint } from '../../modules/payroll/PayrollEntryPoint';
import { Login } from '../../components/Login';
import { authService } from '../../services/auth';
import { firestoreService } from '../../services/firestoreService';
import { User, Role, SystemSettings, Store } from '../../types';
import { Loader2, LogOut, Layout } from 'lucide-react';

interface PayrollStandaloneAppProps {
  user?: User | null;
}

export const PayrollStandaloneApp: React.FC<PayrollStandaloneAppProps> = ({ user }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isAuthReady, setIsAuthReady] = useState(!!user);
  const [stores, setStores] = useState<Store[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    // If user is provided via props, use it
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setIsAuthReady(true);
    });
    
    return () => unsubscribe();
  }, [user]);

  // View data when user changes
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        // Load minimum required data for independent module
        const [storesData, settingsData] = await Promise.all([
          firestoreService.getStores(),
          firestoreService.getSettings()
        ]);
        setStores(storesData || []);
        setSettings(settingsData);
      }
    };
    loadData();
  }, [currentUser]);

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Mini-Header for Standalone App */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white">App de Nómina</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Módulo Independiente SaaS</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-500">{currentUser?.role}</p>
          </div>
          <button 
            onClick={() => authService.logout()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <PayrollEntryPoint 
          currentUser={currentUser}
          settings={settings}
          stores={stores}
        />
      </main>
    </div>
  );
};
