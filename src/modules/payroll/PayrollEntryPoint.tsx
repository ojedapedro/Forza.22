import React, { useEffect, useState } from 'react';
import { PayrollModule } from './PayrollModule';
import { PayrollModuleProvider } from './context/PayrollModuleContext';
import { payrollService } from './services';
import { User, SystemSettings, Store } from '../../types';
import { PayrollEntry, Employee } from './types';

interface PayrollEntryPointProps {
  currentUser: User | null;
  settings: SystemSettings | null;
  stores: Store[];
}

export const PayrollEntryPoint: React.FC<PayrollEntryPointProps> = ({
  currentUser,
  settings,
  stores
}) => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const { employees: fetchedEmployees } = await payrollService.getEmployees();
      const { entries: fetchedEntries } = await payrollService.getPayrollEntries();
      setEmployees(fetchedEmployees);
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Error loading payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const contextValue = {
    currentUser,
    settings,
    stores,
    services: {
      notification: payrollService.notifications,
      api: payrollService.api
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PayrollModuleProvider value={contextValue}>
      <PayrollModule 
        entries={entries}
        employees={employees}
        stores={stores}
        currentUser={currentUser}
        settings={settings}
        onRefreshData={refreshData}
        onAddEntry={async (entry) => {
          const id = Math.random().toString(36).substr(2, 9);
          await payrollService.createPayrollEntry({ ...entry, id, submittedDate: new Date().toISOString() } as PayrollEntry);
          await refreshData();
        }}
        onDeleteEntry={async (id) => {
          await payrollService.deletePayrollEntry(id);
          await refreshData();
        }}
        onAddEmployee={async (emp) => {
          await payrollService.createEmployee(emp);
          await refreshData();
        }}
        onUpdateEmployee={async (emp) => {
          await payrollService.updateEmployee(emp);
          await refreshData();
        }}
        onDeleteEmployee={async (id) => {
          await payrollService.deleteEmployee(id);
          await refreshData();
        }}
      />
    </PayrollModuleProvider>
  );
};
