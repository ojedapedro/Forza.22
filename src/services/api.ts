
import { SystemSettings, User } from '../types';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA QUE OBTENGAS AL IMPLEMENTAR EL SCRIPT EN GOOGLE
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const API_URL = 'https://script.google.com/macros/s/AKfycbyxVkNV8XIqvDgTOY5kj5FQsHCR6BWkHHnxaQ78rMW5kPm_EWoOc3iusVxiG3Dyfp9e/exec';

// Detectar si estamos usando la URL de ejemplo o una inválida para activar el modo offline
const isMockMode = () => API_URL.includes('PLACEHOLDER') || !API_URL.startsWith('https://script.google.com');

export const api = {
  // Forzar chequeo de notificaciones (Test Manual)
  triggerNotificationCheck: async () => {
     try {
       const response = await fetch('/api/notifications/whatsapp/check', { method: 'POST' });
       return await response.json();
     } catch (e) {
       console.error("Error triggering check", e);
       return { status: 'error', message: 'Error de conexión' };
     }
  },

  // --- NOTIFICACIONES ---
  
  sendWhatsApp: async (to: string, message: string) => {
    try {
      const response = await fetch('/api/notifications/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
      const data = await response.json();
      return { status: data.success ? 'success' : 'error', message: data.details || data.error || 'Resultado' };
    } catch (e) {
      console.error("Error sending WhatsApp", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  sendEmail: async (to: string, subject: string, body: string) => {
    try {
      const response = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending Email", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  sendPayrollEmail: async (entry: any, email: string) => {
    try {
      const response = await fetch('/api/payroll/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entries: [{
            ...entry,
            employeeEmail: email
          }] 
        })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending payroll email", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  },

  sendBulkPayrollEmails: async (entries: any[]) => {
    try {
      const response = await fetch('/api/payroll/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
      return await response.json();
    } catch (e) {
      console.error("Error sending bulk payroll emails", e);
      return { status: 'error', message: 'Error de conexión' };
    }
  }
};
