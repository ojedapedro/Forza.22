import React, { createContext, useContext } from 'react';
import { User, SystemSettings, Store } from '../../../types';

interface PayrollModuleContextType {
  currentUser: User | null;
  settings: SystemSettings | null;
  stores: Store[];
  services: {
    notification: any;
    api: any;
  };
}

const PayrollModuleContext = createContext<PayrollModuleContextType | undefined>(undefined);

export const PayrollModuleProvider: React.FC<{
  value: PayrollModuleContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <PayrollModuleContext.Provider value={value}>
      {children}
    </PayrollModuleContext.Provider>
  );
};

export const usePayrollModule = () => {
  const context = useContext(PayrollModuleContext);
  if (!context) {
    throw new Error('usePayrollModule must be used within a PayrollModuleProvider');
  }
  return context;
};
