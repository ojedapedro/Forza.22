
import React, { useState, FC, FormEvent } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import { useTheme } from './ThemeContext';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: FC<LoginProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [isRecovering, setIsRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isRecovering) {
        if (!email) throw new Error('Por favor ingrese su correo.');
        const msg = await authService.recoverPassword(email);
        setSuccessMsg(msg);
        setTimeout(() => {
          setIsRecovering(false);
          setSuccessMsg(null);
        }, 3000);
      } else {
        if (!email || !password) throw new Error('Credenciales incompletas.');
        const user = await authService.login(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 lg:p-0 overflow-hidden font-sans transition-colors duration-500">
      <div className="w-full max-w-7xl h-full lg:h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 dark:border-slate-800/50 transition-all duration-500">
        
        {/* Left Side: Visuals & 3D Illustration */}
        <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 items-center justify-center overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>

            {/* Floating Elements Container */}
            <div className="relative z-10 w-[400px] h-[500px]">
                
                {/* Main Logo Illustration */}
                <div className="w-full h-full bg-white rounded-[5rem] overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] border-8 border-white/10 animate-in fade-in zoom-in duration-700">
                    <img 
                        src={APP_LOGO_URL} 
                        alt="Forza 22 Logo" 
                        className="w-full h-full object-contain p-8"
                        style={{ mixBlendMode: 'normal' }} 
                    />
                </div>
                
                {/* Floating Card: Profit */}
                <div className="absolute top-4 -left-20 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 p-4 rounded-2xl shadow-xl w-40 animate-bounce z-20" style={{ animationDuration: '3s' }}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-300 dark:text-slate-400">Presupuesto</div>
                        <span className="text-[10px] bg-green-500/20 text-green-400 dark:text-green-300 px-1.5 py-0.5 rounded">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$624k</div>
                    <div className="h-1 w-full bg-slate-700 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-green-500 dark:bg-green-400"></div>
                    </div>
                </div>

                {/* Floating Card: Orders */}
                <div className="absolute -bottom-20 -right-20 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 p-4 rounded-2xl shadow-xl w-44 animate-bounce z-20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                     <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-300 dark:text-slate-400">Pagos Auditados</div>
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded">Esta semana</span>
                    </div>
                    <div className="flex items-end gap-2 h-10 mt-2">
                         <div className="w-1/5 bg-brand-500/50 h-[40%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-brand-500/70 h-[70%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-brand-500 h-[100%] rounded-t-sm shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
                         <div className="w-1/5 bg-brand-500/60 h-[50%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-brand-500/40 h-[30%] rounded-t-sm"></div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-300 dark:text-slate-400 bg-black/20 dark:bg-black/40 p-2 rounded-lg">
                        <CheckCircle2 size={12} className="text-green-500 dark:text-green-400" />
                        <span>Todo en regla</span>
                    </div>
                </div>
            </div>
            
            {/* Circle Decoration */}
            <div className="absolute z-0 w-[400px] h-[400px] border border-white/5 rounded-full flex items-center justify-center">
                <div className="w-[300px] h-[300px] border border-white/5 rounded-full"></div>
            </div>

        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900 relative transition-colors duration-500">
            
            {/* Theme Toggle (Login Screen) */}
            <div className="absolute top-6 right-6 flex gap-2">
                <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-all active:scale-90 border border-slate-200 dark:border-slate-700/50 shadow-sm"
                    title="Información de Depuración"
                >
                    <BarChart3 size={20} />
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-all active:scale-90 border border-slate-200 dark:border-slate-700/50 shadow-sm"
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
                </button>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
                <img src={APP_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-lg" />
                <span className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent tracking-tight">Forza 22</span>
            </div>

            <div className="max-w-md w-full mx-auto">
                {showDebug ? (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50 mb-2">Información de Depuración</h2>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dominio Actual</p>
                        <code className="text-xs text-brand-600 dark:text-brand-400 font-mono break-all">{window.location.hostname}</code>
                        <p className="text-[10px] text-slate-500 mt-1">Asegúrate de que este dominio esté en "Authorized domains" en Firebase Console.</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Configuración Firebase</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase">API Key:</span>
                            <code className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">{firebaseConfig.apiKey.substring(0, 10)}...</code>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase">Email/Pass:</span>
                            <span className="text-[10px] font-bold text-amber-500">Verificar en Consola</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase">Google Auth:</span>
                            <span className="text-[10px] font-bold text-amber-500">Verificar en Consola</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDebug(false)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
                    >
                      Volver al Login
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mb-2">
                        {isRecovering ? 'Recuperar Cuenta' : 'Bienvenido de nuevo'}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        {isRecovering 
                            ? 'Ingrese su correo para recibir instrucciones.' 
                            : 'Ingrese sus credenciales para acceder al panel.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-base font-medium text-slate-700 dark:text-slate-300 ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                                </div>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-50 text-base rounded-xl block w-full pl-12 p-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" 
                                    placeholder="usuario@fiscal.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input (Hidden if recovering) */}
                        {!isRecovering && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-base font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-50 text-base rounded-xl block w-full pl-12 pr-12 p-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" 
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Forgot Password Link */}
                        {!isRecovering && (
                            <div className="flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsRecovering(true); setError(null); }}
                                    className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors"
                                >
                                    ¿Olvidó su contraseña?
                                </button>
                            </div>
                        )}

                        {/* Feedback Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-in fade-in">
                                <ShieldCheck size={16} />
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400 text-sm animate-in fade-in">
                                <CheckCircle2 size={16} />
                                {successMsg}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : isRecovering ? (
                                'Enviar Enlace de Recuperación'
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        {!isRecovering && (
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500 font-bold tracking-widest">O continuar con</span>
                                </div>
                            </div>
                        )}

                        {!isRecovering && (
                            <button 
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Iniciar sesión con Google</span>
                            </button>
                        )}
                    </form>

                    {/* Back to Login (if recovering) */}
                    {isRecovering && (
                        <button 
                            onClick={() => { setIsRecovering(false); setError(null); setSuccessMsg(null); }}
                            className="mt-6 w-full text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-50 text-sm font-medium transition-colors"
                        >
                            ← Volver al inicio de sesión
                        </button>
                    )}
                  </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
