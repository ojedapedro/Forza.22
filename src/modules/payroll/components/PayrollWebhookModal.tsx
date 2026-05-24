import React, { useState } from 'react';
import { X, Copy, CheckCircle2, ShieldCheck, Link2 } from 'lucide-react';

interface PayrollWebhookModalProps {
  onClose: () => void;
}

export const PayrollWebhookModal: React.FC<PayrollWebhookModalProps> = ({ onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const webhookUrl = `${window.location.origin}/api/hikvision/webhook`;
  const secretKey = 'hkv_sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
              <Link2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurar Webhook Hikvision</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Credenciales para eventos ISAPI / HTTP Host</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Paso 1: URL del Webhook</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ingresa esta URL en la configuración de <b>Eventos {'->'} Parámetro de Receptor de Alarma (HTTP)</b> en tu dispositivo Hikvision.</p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-sm text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
                {webhookUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(webhookUrl, true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all text-sm whitespace-nowrap"
              >
                {copiedUrl ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copiedUrl ? 'Copiado' : 'Copiar URL'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-6 relative overflow-hidden">
            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" />
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-500 mb-2">Paso 2: Token de Seguridad (Bearer Token)</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mb-4">Usa este token para autenticar las peticiones desde el dispositivo. <b>Mantén este token en secreto.</b></p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 font-mono text-sm text-amber-700 dark:text-amber-400 overflow-x-auto whitespace-nowrap select-all">
                  {secretKey}
                </div>
                <button 
                  onClick={() => copyToClipboard(secretKey, false)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-200/50 dark:bg-amber-900/30 hover:bg-amber-300/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-amber-300/30 dark:border-amber-800/50"
                >
                  {copiedSecret ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copiedSecret ? 'Copiado' : 'Copiar Token'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white">Instrucciones Adicionales:</h3>
             <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2">
               <li>Asegúrate de que el dispositivo Hikvision tenga salida a internet o conexión directa al servidor.</li>
               <li>Habilita el envío de imágenes (MMS) si deseas recibir fotos de los eventos de control de acceso.</li>
               <li>Formato de de datos: Selecciona <b>JSON</b> o <b>XML</b> (el webhook lo auto-detectará).</li>
               <li>En <b>Eventos Vinculados</b>, asegúrate de marcar 'Anotación en centro' o 'Notification to Surveillance Center'.</li>
             </ul>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all text-sm w-full sm:w-auto"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
