
export enum Role {
  SUPER_ADMIN = 'Super Usuario',
  ADMIN = 'Administrador',
  AUDITOR = 'Auditor',
  PRESIDENT = 'Presidencia'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  OVERDUE = 'Vencido',
  UPLOADED = 'Cargado',
  PAID = 'Pagado'
}

export enum Category {
  MUNICIPAL_TAX = '1 ALCALDIA',
  OBJECT = '2 OBJETO',
  INSTITUTIONS = '3 INSTITUCIONES NACIONALES Y REGIONALES',
  PAYROLL = '4 RECURSOS HUMANOS',
  TRANSPORT = '5 TRANSPORTE',
  UTILITY = '6 SERVICIOS PUBLICOS Y MANTENIMIENTO',
  SENIAT_DECLARATIONS = '7 SENIAT DECLARACIONES Y CONTABILIDAD',
  SENIAT_BOOKS = '8 SENIAT LIBROS',
  SYSTEMS = '9 SISTEMAS, MARKETING Y OFICINAS',
  INVENTORY = '10 INVENTARIO',
  OTHER = '11 OTROS'
}

export enum PaymentFrequency {
  NONE = 'Único',
  ANNUAL = 'Anual',
  SEMIANNUAL = 'Semestral',
  QUADRIMESTER = 'Cuatrimestral',
  TRIMESTRAL = 'Trimestral',
  MONTHLY = 'Mensual',
  BIWEEKLY = 'Quincenal',
  WEEKLY = 'Semanal',
  DAILY = 'Diario'
}

// Interfaz para el registro de auditoría
export interface AuditLog {
  date: string;
  action: 'CREACION' | 'APROBACION' | 'RECHAZO' | 'ACTUALIZACION' | 'CORRECCION' | 'APROBACION_MASIVA';
  actorName: string;
  role: Role;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  password?: string; // Solo para simulación local
  storeIds?: string[]; // Para Administradores y Auditores asignados a varias tiendas
  allowedCategories?: Category[];
  allowedTaxGroups?: string[];
  allowedTaxItems?: string[];
}

export interface Store {
  id: string;
  name: string;
  location: string;
  address?: string;
  municipality?: string;
  status: 'En Regla' | 'En Riesgo' | 'Vencido';
  nextDeadline: string;
  matrixId: string;
  lat?: number;
  lng?: number;
  logo?: string;
  rifEnding?: number; // 0-9
}

export interface Payment {
  id: string;
  storeId: string;
  storeName: string;
  userId: string;
  category: Category;
  specificType: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  daysToExpire?: number;
  status: PaymentStatus;
  receiptUrl?: string;
  receiptUrl2?: string;
  attachments?: string[];
  notes?: string;
  rejectionReason?: string;
  submittedDate: string;
  
  // Campo de Historial Extendido
  history?: AuditLog[]; 
  
  // Campos para Control de Presupuesto
  originalBudget?: number;
  isOverBudget?: boolean;
  frequency?: PaymentFrequency;

  // Campos del Soporte
  documentDate?: string;
  documentAmount?: number;
  documentName?: string;

  // Campos de Propuesta Financiera
  proposedAmount?: number;
  proposedPaymentDate?: string;
  proposedDueDate?: string;
  proposedDaysToExpire?: number;
  proposedFrequency?: PaymentFrequency;
  proposedStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  proposedJustification?: string;
  
  // Campos para reversión de propuestas
  previousAmount?: number;
  previousDueDate?: string;

  // Checklist de Auditoría
  checklist?: {
    receiptValid: boolean;
    stampLegible: boolean;
    storeConceptMatch: boolean;
    datesApproved: boolean;
    proposedDatesApproved: boolean;
    amountsApproved: boolean;
    proposedAmountApproved: boolean;
    observationsApproved: boolean;
  };

  // Historic Rate Reference
  dueDateRate?: number;
  dueDateAmountBs?: number;
}

export interface ChartData {
  name: string;
  value: number;
  secondaryValue?: number;
}

export type AlertSeverity = 'critical' | 'scheduled';

export interface AlertItem {
  id: string;
  paymentId: string;
  storeName: string;
  storeId: string;
  category: string;
  title: string;
  amount: number;
  severity: AlertSeverity;
  timeLabel: string;
  dueDate: string;
  paymentDate?: string;
  auditDaysCount?: number;
  auditSeverity?: 'green' | 'amber' | 'red' | 'critical';
}

export interface SystemSettings {
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappGatewayUrl: string;
  daysBeforeWarning: number;
  daysBeforeCritical: number;
  emailEnabled: boolean;
  exchangeRate: number;
  pushEnabled?: boolean;
  notifyPending?: boolean;
  notifyOverdue?: boolean;
  refreshInterval?: number;
}

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

export interface BudgetEntry {
  id: string;
  storeId: string; // Tienda asociada
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  category: Category;
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = 'Borrador',
  SENT = 'Enviada',
  PAID = 'Pagada',
  CANCELLED = 'Anulada'
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g., 0.16 for 16%
  total: number;
}

export interface Client {
  id: string; // Internal ID
  rif: string; // RIF or ID
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Invoice {
  id: string; // Internal ID
  number: string; // Invoice number (Control)
  issueDate: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  clientEmail: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  currency: 'USD' | 'BS';
  exchangeRate: number;
  storeId: string;
  createdBy: string;
  sentAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: Role;
  text: string;
  timestamp: string;
  type: 'text' | 'system';
  room: string;
}
