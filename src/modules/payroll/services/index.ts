
import { payrollFirestoreService } from './payrollFirestoreService';
import { payrollNotificationService } from './payrollNotificationService';
import { api } from '../../../services/api';

/**
 * This service acts as a facade for all external and internal 
 * interactions of the payroll module.
 */
export const payrollService = {
  // Database
  ...payrollFirestoreService,

  // Notifications
  notifications: payrollNotificationService,

  // API (Proxy)
  api: {
    sendPayrollEmails: api.sendBulkPayrollEmails,
    sendSinglePayrollEmail: api.sendPayrollEmail,
  }
};
