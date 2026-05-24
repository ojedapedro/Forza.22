
import { api } from '../../../services/api';
import { SystemSettings } from '../../../types';
import { PayrollEntry, Employee } from '../types';

export const payrollNotificationService = {
  /**
   * Notifica el recibo de pago de nómina al empleado
   */
  notifyPayrollReceipt: async (entry: PayrollEntry, employee: Employee, settings: SystemSettings | null) => {
    if (!settings?.emailEnabled && !settings?.whatsappEnabled) return;

    if (settings.emailEnabled && employee.email) {
      await api.sendPayrollEmail(entry, employee.email);
    }

    if (settings.whatsappEnabled && employee.directPhone) {
      const message = `📄 *Recibo de Pago de Nómina*\n\n` +
        `Hola ${employee.name},\n` +
        `Tu pago del mes de ${entry.month} ha sido procesado.\n\n` +
        `Monto Neto: $${entry.totalWorkerNet.toLocaleString()}\n` +
        `Equivalente: Bs. ${(entry.totalWorkerNet * (settings.exchangeRate || 1)).toLocaleString()}\n\n` +
        `El recibo detallado ha sido enviado a tu correo electrónico.`;
      await api.sendWhatsApp(employee.directPhone, message);
    }
  },

  /**
   * Notifica de forma masiva los recibos de nómina
   */
  notifyBulkPayrollReceipts: async (entries: PayrollEntry[], employees: Employee[], settings: SystemSettings | null) => {
    if (!settings?.emailEnabled && !settings?.whatsappEnabled) return { success: false, message: 'Notificaciones desactivadas en configuración' };

    const results = {
      emailsSent: 0,
      whatsAppsSent: 0,
      total: entries.length,
      errors: [] as string[]
    };

    if (settings.emailEnabled) {
      const entriesWithEmails = entries.map(entry => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
          ...entry,
          employeeEmail: employee?.email || ''
        };
      }).filter(e => e.employeeEmail);

      if (entriesWithEmails.length > 0) {
        try {
          const emailResult = await api.sendBulkPayrollEmails(entriesWithEmails);
          results.emailsSent = emailResult.results?.filter((r: any) => r.success).length || 0;
        } catch (error: any) {
          results.errors.push(error.message || 'Error en el servicio de correos masivos');
        }
      }
    }

    if (settings.whatsappEnabled) {
      for (const entry of entries) {
        const employee = employees.find(e => e.id === entry.employeeId);
        if (employee && employee.directPhone) {
          const message = `📄 *Recibo de Pago de Nómina*\n\n` +
            `Hola ${employee.name},\n` +
            `Tu pago del mes de ${entry.month} ha sido procesado.\n\n` +
            `Monto Neto: $${entry.totalWorkerNet.toLocaleString()}\n` +
            `Equivalente: Bs. ${(entry.totalWorkerNet * (settings.exchangeRate || 1)).toLocaleString()}\n\n` +
            `El recibo detallado ha sido enviado a tu correo electrónico.`;
          
          try {
            const waResult = await api.sendWhatsApp(employee.directPhone, message);
            if (waResult.status === 'success') {
              results.whatsAppsSent++;
            }
          } catch (error: any) {
            results.errors.push(`Error en ${employee.name}: ${error.message}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: `Procesado: ${results.emailsSent} correos y ${results.whatsAppsSent} WhatsApps enviados.`,
      results 
    };
  }
};
