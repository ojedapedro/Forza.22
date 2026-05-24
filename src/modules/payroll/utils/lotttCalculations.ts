import { PayrollEntry, Employee } from '../types';
import { PAYROLL_FACTORS } from '../constants/payrollConstants';

export const calculateParafiscales = (baseSalary: number, bonuses: {amount: number}[]) => {
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const salarioNormal = baseSalary;
  const salarioIntegral = baseSalary + totalBonuses;
  const totalPagos = baseSalary + totalBonuses;

  return {
    deductions: [
      { name: `SSO (${PAYROLL_FACTORS.WORKER.SSO * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.WORKER.SSO).toFixed(2)) },
      { name: `RPE (${PAYROLL_FACTORS.WORKER.RPE * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.WORKER.RPE).toFixed(2)) },
      { name: `FAOV / LPH (${PAYROLL_FACTORS.WORKER.FAOV * 100}%)`, amount: Number((salarioIntegral * PAYROLL_FACTORS.WORKER.FAOV).toFixed(2)) }
    ],
    liabilities: [
      { name: `SSO Patronal (${PAYROLL_FACTORS.EMPLOYER.SSO * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.EMPLOYER.SSO).toFixed(2)) },
      { name: `RPE Patronal (${PAYROLL_FACTORS.EMPLOYER.RPE * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.EMPLOYER.RPE).toFixed(2)) },
      { name: `FAOV Patronal (${PAYROLL_FACTORS.EMPLOYER.FAOV * 100}%)`, amount: Number((salarioIntegral * PAYROLL_FACTORS.EMPLOYER.FAOV).toFixed(2)) },
      { name: `INCES Patronal (${PAYROLL_FACTORS.EMPLOYER.INCES * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.EMPLOYER.INCES).toFixed(2)) },
      { name: `Fondo de Pensiones (${PAYROLL_FACTORS.EMPLOYER.PENSIONS_FUND * 100}%)`, amount: Number((totalPagos * PAYROLL_FACTORS.EMPLOYER.PENSIONS_FUND).toFixed(2)) },
      { name: `Provisión Prestaciones (${PAYROLL_FACTORS.EMPLOYER.PROVISION_PRESTACIONES * 100}%)`, amount: Number((salarioIntegral * PAYROLL_FACTORS.EMPLOYER.PROVISION_PRESTACIONES).toFixed(2)) },
      { name: `Provisión Vacaciones (${PAYROLL_FACTORS.EMPLOYER.PROVISION_VACATION * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.EMPLOYER.PROVISION_VACATION).toFixed(2)) },
      { name: `Provisión Utilidades (${PAYROLL_FACTORS.EMPLOYER.PROVISION_BONUS * 100}%)`, amount: Number((salarioNormal * PAYROLL_FACTORS.EMPLOYER.PROVISION_BONUS).toFixed(2)) }
    ]
  };
};

export const hasParafiscalDiscrepancies = (entry: PayrollEntry) => {
  const { deductions, liabilities } = calculateParafiscales(entry.baseSalary, entry.bonuses);
  
  const hasDeductionDiff = entry.deductions.some(d => {
    const theoretical = deductions.find(item => item.name === d.name)?.amount || 0;
    return Math.abs(d.amount - theoretical) > 0.01;
  });

  const hasLiabilityDiff = entry.employerLiabilities.some(l => {
    const theoretical = liabilities.find(item => item.name === l.name)?.amount || 0;
    return Math.abs(l.amount - theoretical) > 0.01;
  });

  return hasDeductionDiff || hasLiabilityDiff;
};

export const calculateTotals = (data: {
  baseSalary: number;
  bonuses: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  employerLiabilities: { name: string; amount: number }[];
  nightHoursWorked?: number;
  sundaysHolidaysWorked?: number;
  overtimeHoursWorked?: number;
}) => {
  const totalBonuses = data.bonuses.reduce((sum, b) => sum + b.amount, 0);
  const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalLiabilities = data.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
  
  const extras = calculateLOTTTExtras(
    data.baseSalary,
    data.nightHoursWorked || 0,
    data.sundaysHolidaysWorked || 0,
    data.overtimeHoursWorked || 0
  );

  return {
    totalWorkerNet: data.baseSalary + totalBonuses + extras.bonoNocturnoAmount + extras.sundaysHolidaysAmount + extras.overtimeAmount - totalDeductions,
    totalEmployerCost: data.baseSalary + totalBonuses + extras.bonoNocturnoAmount + extras.sundaysHolidaysAmount + extras.overtimeAmount + totalLiabilities,
    ...extras
  };
};

export const calculateLOTTTExtras = (baseSalary: number, nightHours: number, sundays: number, overtime: number) => {
  const dailyRate = baseSalary / 30;
  const hourlyRate = dailyRate / 8;

  const bonoNocturnoAmount = Number((hourlyRate * 0.3 * nightHours).toFixed(2));
  const sundaysHolidaysAmount = Number(((dailyRate * 1.5) * sundays).toFixed(2));
  const overtimeAmount = Number((hourlyRate * 1.5 * overtime).toFixed(2));

  return {
    bonoNocturnoAmount,
    sundaysHolidaysAmount,
    overtimeAmount
  };
};

export const calculatePrestacionesForEmployee = (employee: Employee, endDateStr: string = new Date().toISOString().split('T')[0]) => {
  const hireDate = new Date(employee.hireDate);
  const endDate = new Date(endDateStr);
  
  if (endDate < hireDate) return null;

  // Calculate time difference
  let years = endDate.getFullYear() - hireDate.getFullYear();
  let months = endDate.getMonth() - hireDate.getMonth();
  let days = endDate.getDate() - hireDate.getDate();
  
  if (days < 0) {
    months -= 1;
    days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  const totalMonths = years * 12 + months;
  const quarters = Math.floor(totalMonths / 3);
  
  // Integral Salary
  const totalBonuses = (employee.defaultBonuses || []).reduce((sum, b) => sum + b.amount, 0);
  const monthlyIntegralSalary = employee.baseSalary + totalBonuses;
  const dailyIntegralSalary = monthlyIntegralSalary / 30;
  
  // 1. Garantía Trimestral (Art. 142 literal a y b)
  const baseDaysQuarterly = quarters * 15;
  
  // Días adicionales por antigüedad (después del 1er año, 2 días por año, max 30)
  let additionalDays = 0;
  if (years > 1) {
    additionalDays = (years - 1) * 2;
    if (additionalDays > 30) additionalDays = 30;
  }
  
  const totalGuaranteeDays = baseDaysQuarterly + additionalDays;
  const totalGuaranteeAmount = totalGuaranteeDays * dailyIntegralSalary;
  
  // 2. Cálculo Literal C (Retroactivo - Art. 142 literal c)
  let literalCYears = years;
  if (months >= 6) {
    literalCYears += 1;
  }
  
  const literalCDays = literalCYears * 30;
  const literalCAmount = literalCDays * dailyIntegralSalary;
  
  // 3. Monto a Pagar (El mayor)
  const finalAmount = Math.max(totalGuaranteeAmount, literalCAmount);
  const maxAnticipo = finalAmount * 0.75;
  
  return {
    years, months, days,
    dailyIntegralSalary,
    quarters,
    baseDaysQuarterly,
    additionalDays,
    totalGuaranteeDays,
    totalGuaranteeAmount,
    literalCYears,
    literalCDays,
    literalCAmount,
    finalAmount,
    maxAnticipo
  };
};

export const calculateARI = (ariData: {
  estimatedIncomeBs: number;
  estimatedExpensesBs: number;
  dependents: number;
  taxUnitValueBs: number;
}) => {
  const { estimatedIncomeBs, estimatedExpensesBs, dependents, taxUnitValueBs } = ariData;
  if (taxUnitValueBs <= 0) return { percentage: 0, totalTaxBs: 0, isObligated: false, incomeUT: 0 };

  const incomeUT = estimatedIncomeBs / taxUnitValueBs;
  const expensesUT = estimatedExpensesBs / taxUnitValueBs;
  
  const isObligated = incomeUT > 1000;
  
  const taxableIncomeUT = Math.max(0, incomeUT - expensesUT);
  
  let taxUT = 0;
  if (taxableIncomeUT <= 1000) {
    taxUT = taxableIncomeUT * 0.06;
  } else if (taxableIncomeUT <= 1500) {
    taxUT = (taxableIncomeUT * 0.09) - 30;
  } else if (taxableIncomeUT <= 2000) {
    taxUT = (taxableIncomeUT * 0.12) - 75;
  } else if (taxableIncomeUT <= 2500) {
    taxUT = (taxableIncomeUT * 0.16) - 155;
  } else if (taxableIncomeUT <= 3000) {
    taxUT = (taxableIncomeUT * 0.20) - 255;
  } else if (taxableIncomeUT <= 4000) {
    taxUT = (taxableIncomeUT * 0.24) - 375;
  } else if (taxableIncomeUT <= 6000) {
    taxUT = (taxableIncomeUT * 0.29) - 575;
  } else {
    taxUT = (taxableIncomeUT * 0.34) - 875;
  }

  // Rebajas
  const rebajaPersonalUT = 10;
  const rebajaCargasUT = dependents * 10;
  const totalRebajasUT = rebajaPersonalUT + rebajaCargasUT;

  const finalTaxUT = Math.max(0, taxUT - totalRebajasUT);
  const finalTaxBs = finalTaxUT * taxUnitValueBs;
  
  let percentage = 0;
  if (estimatedIncomeBs > 0) {
    percentage = (finalTaxBs / estimatedIncomeBs) * 100;
  }

  return { percentage, totalTaxBs: finalTaxBs, isObligated, incomeUT };
};

export const getParafiscalDiff = (name: string, amount: number, baseSalary: number, bonuses: {amount: number}[]) => {
  const { deductions, liabilities } = calculateParafiscales(baseSalary, bonuses);
  const theoretical = [...deductions, ...liabilities].find(item => item.name === name)?.amount || 0;
  const diff = amount - theoretical;
  return { theoretical, diff, hasDiff: Math.abs(diff) > 0.01 };
};
