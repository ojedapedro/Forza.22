
import { Category, Payment, PaymentStatus, Store, AlertItem, Role, Employee, PayrollEntry, BudgetEntry } from './types';

// URL del Logo de la Aplicación
// Nota: Si la imagen falla, la sidebar mostrará un icono por defecto.
export const APP_LOGO_URL = "https://i.ibb.co/YFGy2wjg/a8933dc7cb4d97e76826bcf7a9169945-0-1776164238-1967.png";

export const MUNICIPAL_SALES_TAX_RATES: Record<string, number> = {
  'Chacao': 0.03, // 3% para Chacao
  'Maracaibo': 0.02, // 2% para Maracaibo
  'Valencia': 0.025, // 2.5% para Valencia
  'Iribarren': 0.015, // 1.5% para Iribarren
  'Diego Bautista Urbaneja': 0.035, // 3.5% para Lechería (Diego Bautista Urbaneja)
  // Añadir más municipios según sea necesario
};
