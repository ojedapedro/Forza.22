
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-500">
                <AlertTriangle size={40} />
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                ¡Ups! Algo salió mal
              </h1>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Lo sentimos, ha ocurrido un error inesperado en la aplicación. 
                Hemos registrado el incidente para revisarlo.
              </p>

              {this.state.error && (
                <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-left overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detalle del Error</p>
                  <p className="text-xs font-mono text-red-500 dark:text-red-400 break-words line-clamp-3">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]"
                >
                  <RefreshCw size={18} />
                  Recargar Aplicación
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                >
                  <Home size={18} />
                  Ir al Inicio
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                Forza 22 &bull; Sistema de Control Fiscal
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
