
export interface PayrollLiability {
  name: string;
  amount: number;
  type: 'WORKER' | 'EMPLOYER';
}

export interface PayrollEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  storeId: string; // Tienda asociada
  month: string;
  baseSalary: number;
  bonuses: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  employerLiabilities: { name: string; amount: number }[];
  totalWorkerNet: number;
  totalEmployerCost: number;
  status: 'PENDIENTE' | 'PROCESADO';
  submittedDate: string;
  
  // Shift related calculated values (LOTTT)
  nightHoursWorked?: number;
  sundaysHolidaysWorked?: number;
  overtimeHoursWorked?: number;
  bonoNocturnoAmount?: number;
  sundaysHolidaysAmount?: number;
  overtimeAmount?: number;
}

export interface PPEItemData {
  name: string;
  talla: string;
  cantidad: number;
  precio: number;
  frecuencia: string;
}

export interface PPEAssignment {
  id: string;
  date: string;
  items: PPEItemData[];
  totalCost: number;
}

export enum ShiftGroup {
  GROUP_A = 'Grupo A',
  GROUP_B = 'Grupo B',
  GROUP_C = 'Grupo C',
  ADMINISTRATIVE = 'Administrativo',
  NONE = 'Sin Asignar'
}

export type ShiftSlot = {
  name: string;
  startTime: string;
  endTime: string;
  nightHoursPerDay: number;
};

export interface Employee {
  id: string; // Cédula/ID
  code: string; // CODIGO
  nationality: string; // NACIONALIDAD
  name: string; // NOMBRES
  lastName: string; // APELLIDOS
  age: number; // EDAD
  educationLevel: string; // GRADO DE INSTRUCCIÓN
  position: string; // CARGO
  department: string; // DEPARTAMENTO
  positionDescription: string; // DESCRIPCION DEL CARGO
  hireDate: string; // FECHA DE INGRESO
  socialBenefitsDate?: string; // FECHA DE PRESTACIONES SOCIALES AL DIA
  projectedExitDate?: string; // FECHA DE EGRESO PROYECTADA
  email: string; // CORREO ELECTRONICO
  projectAddress?: string; // DIRECCION DEL PROYECTO
  directPhone: string; // TELEFONO DIRECTO
  emergencyPhone: string; // TELEFONO DE EMERGENCIA
  homeAddress: string; // DIRECCION HABITACION
  gender: string; // SEXO
  wearsGlasses: string; // USA LENTES
  hasCondition: string; // PERSONA CON CONDICION
  height: string; // ESTATURA
  
  storeId: string; // Tienda asignada
  baseSalary: number;
  isActive: boolean;
  bankAccount?: string;
  defaultBonuses: { name: string; amount: number }[];
  defaultDeductions: { name: string; amount: number }[];
  defaultEmployerLiabilities: { name: string; amount: number }[];
  ppeAssignments?: PPEAssignment[];
  shiftGroup?: ShiftGroup;
}
