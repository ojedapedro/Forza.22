
import { Category, PaymentFrequency } from './types';

export interface TaxItem {
  code: string;
  name: string;
  amount?: number;
  isVariable?: boolean;
  frequency?: PaymentFrequency;
}

export interface TaxGroup {
  label: string;
  deadlineDay: number;
  items: TaxItem[];
}

export type CategoryConfig = Record<string, TaxGroup>;

export const MUNICIPAL_TAX_CONFIG: CategoryConfig = {
  'PATENTE': {
    label: '1.1 PATENTE',
    deadlineDay: 15,
    items: [
      { code: '1.1.1', name: 'DECLARACION DE PATENTE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.1.2', name: 'LICENCIA DE PATENTE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.1.3', name: 'RENOVACION DE PATENTE', amount: 150.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.1.4', name: 'USO CONFORME', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'VENTAS': {
    label: '1.2 IMPUESTO DE VENTAS',
    deadlineDay: 15,
    items: [
      { code: '1.2.1', name: 'TOTAL VENTAS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '1.2.2', name: 'CODIGO 1 AL MAYOR DE PINTURA 1,5%', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '1.2.3', name: 'CODIGO 2 AL DETAL DE PINTURA 2%', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '1.2.4', name: 'CODIGO 3 AL MAYOR DE FERRETERIA 3%', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'VISTO_BUENO': {
    label: '1.3 VISTO BUENO AMBIENTAL',
    deadlineDay: 30,
    items: [
      { code: '1.3.1', name: 'CERTIFICADO DE APROVACION', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'IMA': {
    label: '1.4 IMA (ASEO)',
    deadlineDay: 25,
    items: [
      { code: '1.4.1', name: 'PLANILLA+RECIBO DE PAGO', isVariable: true, frequency: PaymentFrequency.MONTHLY }
    ]
  },
  'CATASTRO': {
    label: '1.5 CEDULA CATASTRAL',
    deadlineDay: 30,
    items: [
      { code: '1.5.1', name: 'FABRICA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.5.2', name: 'TIENDA', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'INMOBILIARIO': {
    label: '1.6 IMPUESTO INMOBILIARIO',
    deadlineDay: 30,
    items: [
      { code: '1.6.1', name: 'IMPUESTO INMOBILIARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'PUBLICIDAD': {
    label: '1.7 PUBLICIDAD',
    deadlineDay: 20,
    items: [
      { code: '1.7.1', name: 'PUBLICIDAD', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'BOMBEROS': {
    label: '1.8 BOMBEROS',
    deadlineDay: 28,
    items: [
      { code: '1.8.1', name: 'PLAN DE EMERGENCIA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.2', name: 'PAGO DE ARANCELES PLAN EMERGENCIA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.3', name: 'PAGO DE ARANCELES USO CONFORME', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.4', name: 'USO CONFORME', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.5', name: 'PAGO DE ARANCELES PARA CONTRATO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.6', name: 'EXTINTORES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '1.8.7', name: 'CONTRATO DE MANTENIMIENTO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const OBJECT_TAX_CONFIG: CategoryConfig = {
  'SENCAMER_REM': {
    label: '2.1 CERTIFICADO DE SENCAMER (REM 36357)',
    deadlineDay: 30,
    items: [
      { code: '2.1.1', name: 'CONSTANCIA DE REGISTRO (CERTIFICADO REM)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.1.2', name: 'PAGO DE RENOVACION REM', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SENCAMER_CPE': {
    label: '2.2 CPE SENCAMER',
    deadlineDay: 30,
    items: [
      { code: '2.2.1', name: 'CONSTANCIA DE VERIFICACION DE PRODUCTO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.2.2', name: 'PAGO DE ARANCELES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.2.3', name: 'SOLVENCIA DEL PRODUCTO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'RACDA': {
    label: '2.3 RACDA',
    deadlineDay: 30,
    items: [
      { code: '2.3.1', name: 'LICENCIA RACDA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.2', name: 'PAGOS DEL PROFESIONAL PARA DECLARACION EFLUENTES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.3', name: 'DECLARACION EFLUENTES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.4', name: 'DISPOSICION FINAL (ANUAL) INFORME', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SOLVENCIA_POLICIAL': {
    label: '2.4 SOLVENCIA POLICIAL NACIONAL AMBIENTAL',
    deadlineDay: 30,
    items: [
      { code: '2.4.1', name: 'ACTA DE SOLVENCIA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'DISPOSICION_FINAL': {
    label: '2.5 EMPRESA DE DISPOSCION FINAL SERANCOR',
    deadlineDay: 30,
    items: [
      { code: '2.5.1', name: 'CONTRATO (AMBIENTAL) EMPRESA DISPOSCION FINAL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.5.2', name: 'RETIRO DE DESECHOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'POLIZA_SEGURO': {
    label: '2.6 POLIZA DE SEGURO FABRICA',
    deadlineDay: 30,
    items: [
      { code: '2.6.1', name: 'PAGO DE ARANCELES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.6.2', name: 'POLIZA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SAPI': {
    label: '2.7 SAPI',
    deadlineDay: 30,
    items: [
      { code: '2.7.1', name: 'SAPI (MARCA)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.7.2', name: 'SAPI (LOGO)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const INSTITUTIONS_TAX_CONFIG: CategoryConfig = {
  'SNC': {
    label: '3.1 SERVICIO NACIONAL DE CONTRATISTA (SNC)',
    deadlineDay: 30,
    items: [
      { code: '3.1.1', name: 'EXPEDIENTE CONTABLE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.1.2', name: 'PAGO DE ARANCEL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.1.3', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'RUPDAE': {
    label: '3.2 RUPDAE',
    deadlineDay: 30,
    items: [
      { code: '3.2.1', name: 'INSCRIPCION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.2.2', name: 'ARANCEL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.2.3', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONACIT': {
    label: '3.3 FONACIT',
    deadlineDay: 30,
    items: [
      { code: '3.3.1', name: 'DECLARACION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.3.2', name: 'PAGO DE ARANCEL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.3.3', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONA': {
    label: '3.4 FONA',
    deadlineDay: 30,
    items: [
      { code: '3.4.1', name: 'DECLARACION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.4.2', name: 'PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.4.3', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONDO_DEPORTE': {
    label: '3.5 FONDO DE DEPORTE',
    deadlineDay: 30,
    items: [
      { code: '3.5.1', name: 'DECLARACION PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.5.2', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'INSALUD': {
    label: '3.6 PERMISOS SANITARIO (INSALUD)',
    deadlineDay: 30,
    items: [
      { code: '3.6.1', name: 'PAGO DE ARANCEL DE FUMIGACION', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '3.6.2', name: 'CERTIFICADO DE FUMIGACION', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '3.6.3', name: 'PAGO DE ARANCEL DESRATIZACION', isVariable: true, frequency: PaymentFrequency.QUADRIMESTER },
      { code: '3.6.4', name: 'CERTIFICADO DE DESRATIZACION', isVariable: true, frequency: PaymentFrequency.QUADRIMESTER },
      { code: '3.6.5', name: 'PAGO DE ARANCEL DE LIMPIEZA DE PLANTA', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
      { code: '3.6.6', name: 'CERTIFICADO DE LIMPIEZA DE PLANTA', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
      { code: '3.6.7', name: 'PAGO DE ARANCEL DE PERMISO SANITARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.6.8', name: 'ACTA DE INSPECCION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.6.9', name: 'PERMISO SANITARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const HUMAN_RESOURCES_CONFIG: CategoryConfig = {
  'EXPEDIENTES': {
    label: '4.1 EXPEDIENTE DEL TRABAJADOR',
    deadlineDay: 30,
    items: [
      { code: '4.1.1', name: 'EXPEDIENTE DEL TRABAJADOR', isVariable: true, frequency: PaymentFrequency.MONTHLY }
    ]
  },
  'NOMINA': {
    label: '4.2 NOMINA Y ADELANTO DE PRESTACIONES',
    deadlineDay: 30,
    items: [
      { code: '4.2.1', name: 'CALCULO + PDF', isVariable: true, frequency: PaymentFrequency.BIWEEKLY }
    ]
  },
  'ARI': {
    label: '4.3 AR-I',
    deadlineDay: 30,
    items: [
      { code: '4.3.1', name: 'ARI DEL TRABAJADOR', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL }
    ]
  },
  'PENSIONES': {
    label: '4.4 FONDO DE PENSIONES',
    deadlineDay: 30,
    items: [
      { code: '4.4.1', name: 'DELARACION + PLANILLA DE PAGO', isVariable: true, frequency: PaymentFrequency.MONTHLY }
    ]
  },
  'PRESTACIONES': {
    label: '4.5 APARTADO DE PRESTACIONES SOCIALES',
    deadlineDay: 30,
    items: [
      { code: '4.5.1', name: 'CALCULO GENERAL MENOS LOS ANTICIPOS', isVariable: true, frequency: PaymentFrequency.MONTHLY }
    ]
  },
  'IVSS': {
    label: '4.6 INSTITUTO VENEZOLANA SEGURO SOCIAL (IVSS)',
    deadlineDay: 30,
    items: [
      { code: '4.6.1', name: 'INSCRIPCION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '4.6.2', name: 'APORTES IVSS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.6.3', name: 'SOLVENCIA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.6.4', name: 'EGRESO DEL PERSONAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'BANAVIH': {
    label: '4.7 BANAVIH',
    deadlineDay: 30,
    items: [
      { code: '4.7.1', name: 'INSCRIPCION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '4.7.2', name: 'APORTES BANAVIH', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.7.3', name: 'SOLVENCIA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.7.4', name: 'EGRESO DEL PERSONAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'INCES_2': {
    label: '4.8 INCES SALARIO 2%',
    deadlineDay: 30,
    items: [
      { code: '4.8.1', name: 'DECLARACION DE APORTE (2%)', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '4.8.2', name: 'RECIBO DE PAGO', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '4.8.3', name: 'SOLVENCIA', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
    ]
  },
  'INCES_05': {
    label: '4.9 INCES UTILIDADES 0,5%',
    deadlineDay: 30,
    items: [
      { code: '4.9.1', name: 'DECLARACION DE APORTE (0,5%)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '4.9.2', name: 'RECIBO DE PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '4.9.3', name: 'SOLVENCIA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'PNAI': {
    label: '4.10 PROGRAMA NACIONAL DE APRENDIZ INCES (PNAI)',
    deadlineDay: 30,
    items: [
      { code: '4.10.1', name: 'INVEPINCA', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'MINTRA': {
    label: '4.11 MINISTERIO DEL TRABAJO (MINTRA)',
    deadlineDay: 30,
    items: [
      { code: '4.11.1', name: 'DECLARACION (NOMINA, INCE, IVSS, BANAVIH)', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '4.11.2', name: 'SOLVENCIA LABORAL', isVariable: true, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'INSAPSEL': {
    label: '4.12 INSAPSEL',
    deadlineDay: 30,
    items: [
      { code: '4.12.1', name: 'CONSTANCIA DE INSCRIPCION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '4.12.2', name: 'NOTIFICACION DE RIESGO', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '4.12.3', name: 'CERTIFICADO DE PREVENCION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '4.12.4', name: 'CERTIFICADO DE COMITÉ', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '4.12.5', name: 'INFORME DE GESTION', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.12.6', name: 'INFORME DE COMITÉ', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.12.7', name: 'INFORME DE DELEGADO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.12.8', name: 'INDUCCION DE SEGURIDAD', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '4.12.9', name: 'LIBRO DE ACTAS', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '4.12.10', name: 'DOTACION DE TRABAJADORES', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
    ]
  }
};

export const TRANSPORT_TAX_CONFIG: CategoryConfig = {
  'CHOFER': {
    label: '5.1 DOCUMENTOS DEL CHOFER',
    deadlineDay: 30,
    items: [
      { code: '5.1.1', name: 'CEDULA DE IDENTIDAD', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.1.2', name: 'CARNET DE CIRCULACION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.1.3', name: 'CERTIFICADO DE SABERES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.1.4', name: 'LICENCIA DE CONDUCIR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.1.5', name: 'CERTIFICADO MEDICO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'VEHICULO': {
    label: '5.2 DOCUMENTOS DEL VEHICULO',
    deadlineDay: 30,
    items: [
      { code: '5.2.1', name: 'TITULO DE PROPIEDAD', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.2.2', name: 'CARNET DE CIRCULACION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.2.3', name: 'SEGURO (RCV)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.4', name: 'IMPUESTO TRIMESTRAL', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '5.2.5', name: 'ROTC', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.6', name: 'FLOTA VEHICULAR ROCT', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.7', name: 'RACDA TRANSPORTE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.8', name: 'GPS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'MANTENIMIENTO': {
    label: '5.3 KILOMETRO MANTENIMIENTO',
    deadlineDay: 30,
    items: [
      { code: '5.3.1', name: 'FLUIDOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '5.3.2', name: 'FILTROS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '5.3.3', name: 'CAUCHOS', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
      { code: '5.3.4', name: 'FRENOS', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
    ]
  }
};

export const UTILITY_TAX_CONFIG: CategoryConfig = {
  'SERVICIOS': {
    label: 'SERVICIOS PUBLICOS',
    deadlineDay: 30,
    items: [
      { code: '6.1.1', name: 'INTERNET', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.2.2', name: 'TELEFONO FIJO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.3.3', name: 'TELEFONO MOVIL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.4.4', name: 'ELECTRICIDAD', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.5.5', name: 'HIDROCENTRO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.6.6', name: 'GAS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.7.7', name: 'CONDOMINIO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.8.8', name: 'ALQUILER', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.8.9', name: 'MANTENIMIENTO REGULAR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '6.8.10', name: 'MANTENIMIENTO MAYOR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '6.9.1', name: 'INSUMOS GENERAL DE LIMPIEZA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const SENIAT_DECLARATIONS_TAX_CONFIG: CategoryConfig = {
  'DECLARACIONES': {
    label: '7 SENIAT DECLARACIONES Y CONTABILIDAD',
    deadlineDay: 15,
    items: [
      { code: '7.1.1', name: 'LIBRO DE COMPRA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.1', name: 'LIBRO DE VENTA CODIGO 1', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.2', name: 'LIBRO DE VENTA CODIGO 2', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.3', name: 'LIBRO DE VENTA CODIGO 3', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.3.1', name: 'DECLARACION DE IVA', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.4.1', name: 'DECLARACION DE IVA RET', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.5.1', name: 'DECLARACION DE ANT ISLR', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.6.1', name: 'DECLARACION DE ISLR RETENIDO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.7.1', name: 'DECLARACION DE ISLR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '7.8.1', name: 'DECLARACION DE IGTF', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.9.1', name: 'DECLARACION DE IGP', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '7.10.1', name: 'DECLARACION DE FONDO DE PENSIONES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.11.1', name: 'HONORARIOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.12.1', name: 'CARPETA CONTABLE', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const SENIAT_BOOKS_TAX_CONFIG: CategoryConfig = {
  'LIBROS': {
    label: '8 SENIAT LIBROS',
    deadlineDay: 30,
    items: [
      { code: '8.1.1', name: 'LIBRO MAYOR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.2.1', name: 'LIBRO DE INVENTARIO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.3.1', name: 'LIBRO DIARIO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.4.1', name: 'LIBRO DE ACTAS', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const SYSTEMS_TAX_CONFIG: CategoryConfig = {
  'SISTEMAS': {
    label: '9 SISTEMAS, MARKETING Y OFICINAS',
    deadlineDay: 30,
    items: [
      { code: '9.1.1', name: 'SERVIDOR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.2.1', name: 'RED', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.3.1', name: 'SOFTWARE ADMINISTRATIVO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.4.1', name: 'SOFTWARE CONTABLE', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.5.1', name: 'PROGRAMA (GASTOS FIJOS)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.6.1', name: 'PAGINA WEB', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '9.7.1', name: 'PUBLICIDAD (DISEÑADOR)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.8.1', name: 'MARKETING (REDES SOCIALES)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.9.1', name: 'CONTROL DE DAÑOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.10.1', name: 'PAPELERIA DE OFICINA EN GENERAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.11.1', name: 'MOBILIARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const INVENTORY_TAX_CONFIG: CategoryConfig = {
  'INVENTARIO': {
    label: '10 INVENTARIO',
    deadlineDay: 30,
    items: [
      { code: '10.1.1', name: 'COMPRA DE MERCANCIA NACIONAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.1.2', name: 'COMPRA DE MERCANCIA IMPORTADA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const OTHER_TAX_CONFIG: CategoryConfig = {
  'OTROS': {
    label: '11 OTROS',
    deadlineDay: 30,
    items: [
      { code: '11.1.1', name: 'GASTOS VARIOS', isVariable: true, frequency: PaymentFrequency.MONTHLY }
    ]
  }
};

export const getTaxConfig = (cat: Category | '') => {
  switch (cat) {
    case Category.MUNICIPAL_TAX: return MUNICIPAL_TAX_CONFIG;
    case Category.OBJECT: return OBJECT_TAX_CONFIG;
    case Category.INSTITUTIONS: return INSTITUTIONS_TAX_CONFIG;
    case Category.PAYROLL: return HUMAN_RESOURCES_CONFIG;
    case Category.TRANSPORT: return TRANSPORT_TAX_CONFIG;
    case Category.UTILITY: return UTILITY_TAX_CONFIG;
    case Category.SENIAT_DECLARATIONS: return SENIAT_DECLARATIONS_TAX_CONFIG;
    case Category.SENIAT_BOOKS: return SENIAT_BOOKS_TAX_CONFIG;
    case Category.SYSTEMS: return SYSTEMS_TAX_CONFIG;
    case Category.INVENTORY: return INVENTORY_TAX_CONFIG;
    case Category.OTHER: return OTHER_TAX_CONFIG;
    default: return null;
  }
};
