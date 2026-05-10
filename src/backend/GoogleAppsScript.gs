
// ID de tu Hoja de Cálculo
const SPREADSHEET_ID = '1EaYm-kbgFciU2ZFIJk5B8rLb9y07hZEDbGKIiElLbd8';

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e ? e.parameter : {}; 
    const action = params.action;
    let data = {};
    
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let result = { status: 'success' };

    switch (action) {
      case 'setup':
        result = setupDatabase(ss);
        break;

      case 'getPayments':
        result.data = getData(ss, 'Payments');
        break;

      case 'addPayment':
        addRow(ss, 'Payments', data);
        break;

      case 'updatePayment':
        updateRow(ss, 'Payments', data.id, data);
        break;
      
      case 'deletePayment':
        deleteRow(ss, 'Payments', data.id);
        break;
        
      // --- EMPLOYEES (NÓMINA) ---
      case 'getEmployees':
        result.data = getData(ss, 'Employees');
        break;

      case 'addEmployee':
        addRow(ss, 'Employees', data);
        result = { status: 'success', message: 'Empleado creado' };
        break;

      case 'updateEmployee':
        updateRow(ss, 'Employees', data.id, data);
        result = { status: 'success', message: 'Empleado actualizado' };
        break;
      
      case 'deleteEmployee':
        deleteRow(ss, 'Employees', data.id);
        result = { status: 'success', message: 'Empleado eliminado' };
        break;
        
      // --- PAYROLL ENTRIES (HISTÓRICO DE NÓMINA) ---
      case 'getPayrollEntries':
        result.data = getData(ss, 'PayrollEntries');
        break;

      case 'addPayrollEntry':
        addRow(ss, 'PayrollEntries', data);
        result = { status: 'success', message: 'Nómina creada' };
        break;
      
      case 'deletePayrollEntry':
        deleteRow(ss, 'PayrollEntries', data.id);
        result = { status: 'success', message: 'Nómina eliminada' };
        break;
        
      // --- USER MANAGEMENT ---
      case 'getUsers':
        result.data = getData(ss, 'Users').map(u => {
          if (u.username && !u.name) u.name = u.username;
          return u;
        });
        break;

      case 'addUser':
        // Validar duplicados por email
        const users = getData(ss, 'Users');
        const exists = users.find(u => u.email === data.email);
        if (exists) {
          result = { status: 'error', message: 'El correo ya existe' };
        } else {
          // Map name to username if needed
          if (data.name && !data.username) {
            data.username = data.name;
          }
          addRow(ss, 'Users', data);
          result = { status: 'success', message: 'Usuario creado' };
        }
        break;

      case 'updateUser':
        if (data.name && !data.username) {
          data.username = data.name;
        }
        updateRow(ss, 'Users', data.id, data);
        result = { status: 'success', message: 'Usuario actualizado' };
        break;

      case 'deleteUser':
        deleteRow(ss, 'Users', data.id);
        result = { status: 'success', message: 'Usuario eliminado' };
        break;
      // -----------------------

      case 'saveSettings':
        saveSettings(ss, data);
        result = { status: 'success', message: 'Configuración guardada' };
        break;

      case 'getSettings':
        result.data = getSettings(ss);
        break;

      case 'checkNotifications':
        const count = checkDeadlinesAndNotify();
        result = { status: 'success', message: `Reporte generado. Alertas encontradas: ${count}` };
        break;

      // --- NUEVAS ACCIONES DE NOTIFICACIÓN DIRECTA ---
      case 'sendEmail':
        if (!data.to || !data.subject || !data.body) {
          result = { status: 'error', message: 'Faltan datos para el envío de email' };
        } else {
          MailApp.sendEmail({
            to: data.to,
            subject: data.subject,
            body: data.body
          });
          result = { status: 'success', message: 'Email enviado correctamente' };
        }
        break;

      case 'sendWhatsApp':
        const settings = getSettings(ss);
        if (!settings || !settings.whatsappEnabled || !settings.whatsappGatewayUrl) {
          result = { status: 'error', message: 'WhatsApp no está configurado o habilitado' };
        } else if (!data.to || !data.message) {
          result = { status: 'error', message: 'Faltan datos para el envío de WhatsApp' };
        } else {
          const chunks = splitMessageGAS(data.message, 1500);
          let allSent = true;
          for (let i = 0; i < chunks.length; i++) {
            const sent = sendWhatsAppMessage(settings.whatsappGatewayUrl, data.to, chunks[i]);
            if (!sent) allSent = false;
          }
          result = allSent ? { status: 'success', message: 'WhatsApp enviado' } : { status: 'error', message: 'Error al enviar WhatsApp' };
        }
        break;

      default:
        result = { status: 'error', message: 'Acción desconocida o petición vacía' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ... (Rest of the file remains unchanged: checkDeadlinesAndNotify, sendWhatsAppMessage, getSettings, saveSettings, testSetup, setupDatabase, getData, addRow, updateRow, deleteRow)

// --- AUTOMATIZACIÓN WHATSAPP EFICIENTE (BATCH) ---

/**
 * Esta función debe ser configurada con un TRIGGER de tiempo en Google Apps Script.
 * Ve a "Activadores" (icono reloj) > Añadir activador > checkDeadlinesAndNotify > Según tiempo > Diario.
 */
function checkDeadlinesAndNotify() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settings = getSettings(ss);
  
  // Validación estricta antes de procesar
  if (!settings || !settings.whatsappEnabled || !settings.whatsappGatewayUrl) {
    Logger.log("WhatsApp desactivado o sin configurar (URL vacía)");
    return 0;
  }

  const payments = getData(ss, 'Payments');
  const today = new Date();
  today.setHours(0,0,0,0);

  // Contenedores para agrupar alertas
  const alerts = {
    critical: [], // Vencidos o vencen hoy
    upcoming: [], // Vencen en 1 día (crítico configurado)
    warning: []   // Vencen pronto (warning configurado)
  };

  let totalAlerts = 0;

  payments.forEach(p => {
    // Solo procesar pagos pendientes o en riesgo (ignorar aprobados/rechazados)
    if (p.status === 'Aprobado' || p.status === 'Rechazado') return;

    // FIX: Manejo robusto de fechas (Google Sheets devuelve Objetos Date si la celda tiene formato fecha)
    let dueDate;
    
    // Comprobamos si es un objeto Date nativo
    if (Object.prototype.toString.call(p.dueDate) === "[object Date]") {
       dueDate = new Date(p.dueDate);
    } else {
       // Si es string "YYYY-MM-DD" o similar
       const dateStr = String(p.dueDate);
       if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          // Intento simple de parsing YYYY-MM-DD
          if (parts.length === 3) {
             dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
             dueDate = new Date(dateStr);
          }
       } else {
          dueDate = new Date(dateStr);
       }
    }

    // Validar que la fecha sea válida antes de continuar
    if (isNaN(dueDate.getTime())) return;
    
    // Calcular diferencia en días: (Due - Today)
    const diffTime = dueDate - today; 
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const item = {
      store: p.storeName,
      concept: p.specificType,
      amount: p.amount,
      date: p.dueDate instanceof Date ? Utilities.formatDate(p.dueDate, Session.getScriptTimeZone(), "yyyy-MM-dd") : p.dueDate
    };

    if (diffDays < 0) {
      alerts.critical.push({ ...item, label: `Vencido hace ${Math.abs(diffDays)} días` });
      totalAlerts++;
    } else if (diffDays === 0) {
      alerts.critical.push({ ...item, label: "VENCE HOY" });
      totalAlerts++;
    } else if (diffDays <= settings.daysBeforeCritical) {
      alerts.upcoming.push({ ...item, label: `Vence en ${diffDays} días` });
      totalAlerts++;
    } else if (diffDays <= settings.daysBeforeWarning) {
      alerts.warning.push({ ...item, label: `Fecha: ${item.date}` });
      totalAlerts++;
    }
  });

  // Si no hay nada que reportar, salimos
  if (totalAlerts === 0) {
    Logger.log("No hay alertas para enviar hoy.");
    return 0;
  }

  // --- CONSTRUCCIÓN DEL MENSAJE UNIFICADO ---
  let message = `🤖 *REPORTE FISCAL DIARIO*\nFecha: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")}\n`;
  
  if (alerts.critical.length > 0) {
    message += `\n🚨 *URGENTE / VENCIDOS (${alerts.critical.length})*\n`;
    alerts.critical.forEach(a => {
      message += `• ${a.store}: ${a.concept} ($${a.amount}) - *${a.label}*\n`;
    });
  }

  if (alerts.upcoming.length > 0) {
    message += `\n⚠️ *ATENCIÓN INMEDIATA (${alerts.upcoming.length})*\n`;
    alerts.upcoming.forEach(a => {
      message += `• ${a.store}: ${a.concept} ($${a.amount}) - ${a.label}\n`;
    });
  }

  if (alerts.warning.length > 0) {
    message += `\n📅 *PRÓXIMOS VENCIMIENTOS (${alerts.warning.length})*\n`;
    alerts.warning.forEach(a => {
      message += `• ${a.store}: ${a.concept} - ${a.label}\n`;
    });
  }

  message += `\n_Ingrese a la plataforma para gestionar los pagos._`;

  // Enviar mensajes en fragmentos si es necesario
  const chunks = splitMessageGAS(message, 1500);
  let success = true;
  
  for (let i = 0; i < chunks.length; i++) {
    const sent = sendWhatsAppMessage(settings.whatsappGatewayUrl, settings.whatsappPhone, chunks[i]);
    if (!sent) success = false;
  }

  return totalAlerts;
}

function splitMessageGAS(message, limit) {
  limit = limit || 1500;
  if (message.length <= limit) return [message];
  
  const chunks = [];
  let currentPos = 0;
  
  while (currentPos < message.length) {
    let endPos = currentPos + limit;
    if (endPos >= message.length) {
      chunks.push(message.substring(currentPos));
      break;
    }
    
    let lastIndex = message.lastIndexOf('\n', endPos);
    if (lastIndex <= currentPos) {
      lastIndex = message.lastIndexOf(' ', endPos);
    }
    
    if (lastIndex > currentPos) {
      endPos = lastIndex;
    }
    
    chunks.push(message.substring(currentPos, endPos));
    currentPos = endPos;
  }
  
  return chunks;
}

function sendWhatsAppMessage(gatewayUrl, phone, message) {
  try {
    if (!gatewayUrl) return false;

    let finalUrl = String(gatewayUrl).trim();
    if (finalUrl === "") return false;

    // Codificar mensaje (importante para emojis y saltos de línea)
    const encodedMessage = encodeURIComponent(message);
    
    if (finalUrl.includes('[MESSAGE]')) {
       finalUrl = finalUrl.replace('[MESSAGE]', encodedMessage).replace('[PHONE]', phone);
    } else {
       const separator = finalUrl.includes('?') ? '&' : '?';
       finalUrl = `${finalUrl}${separator}phone=${phone}&text=${encodedMessage}`;
    }

    const response = UrlFetchApp.fetch(finalUrl);
    Logger.log("WhatsApp enviado: " + response.getContentText());
    return true;
  } catch (e) {
    Logger.log("Error enviando WhatsApp: " + e.toString());
    return false;
  }
}

// --- GESTIÓN DE SETTINGS ---

function getSettings(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  // Obtenemos los valores. Si la hoja está vacía o fila 2 no existe, manejamos el error.
  const range = sheet.getRange(2, 1, 1, 6);
  const values = range.getValues();
  
  if (!values || values.length === 0 || !values[0]) return null;

  const data = values[0];
  
  return {
    whatsappEnabled: data[0] === true || data[0] === 'TRUE',
    whatsappPhone: data[1],
    whatsappGatewayUrl: data[2],
    daysBeforeWarning: Number(data[3] || 3),
    daysBeforeCritical: Number(data[4] || 1),
    emailEnabled: data[5] === true || data[5] === 'TRUE'
  };
}

function saveSettings(ss, settings) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Settings');
  
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['Enabled', 'Phone', 'GatewayURL', 'WarningDays', 'CriticalDays', 'EmailEnabled']);
  }

  // Guardar en la fila 2 (sobreescribir)
  sheet.getRange(2, 1, 1, 6).setValues([[
    settings.whatsappEnabled,
    settings.whatsappPhone,
    settings.whatsappGatewayUrl,
    settings.daysBeforeWarning,
    settings.daysBeforeCritical,
    settings.emailEnabled
  ]]);
}

// --- FUNCIONES CORE (Existentes + TestSetup) ---

function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const result = setupDatabase(ss);
  Logger.log(result);
}

function setupDatabase(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schema = {
    'Payments': ['id', 'storeId', 'storeName', 'userId', 'category', 'specificType', 'amount', 'dueDate', 'paymentDate', 'status', 'notes', 'rejectionReason', 'submittedDate', 'history', 'receiptUrl', 'originalBudget', 'isOverBudget', 'justification', 'justificationFileUrl', 'proposedAmount', 'proposedPaymentDate', 'proposedDueDate', 'proposedDaysToExpire', 'proposedStatus', 'proposedJustification'],
    'Stores': ['id', 'name', 'location', 'status', 'nextDeadline', 'matrixId'],
    'Users': ['id', 'username', 'role', 'email', 'password'],
    'Settings': ['Enabled', 'Phone', 'GatewayURL', 'WarningDays', 'CriticalDays', 'EmailEnabled'],
    'Employees': ['id', 'code', 'nationality', 'name', 'lastName', 'age', 'educationLevel', 'position', 'department', 'positionDescription', 'hireDate', 'socialBenefitsDate', 'projectedExitDate', 'email', 'projectAddress', 'directPhone', 'emergencyPhone', 'homeAddress', 'gender', 'wearsGlasses', 'hasCondition', 'height', 'storeId', 'baseSalary', 'isActive', 'bankAccount', 'defaultBonuses', 'defaultDeductions', 'defaultEmployerLiabilities', 'ppeAssignments'],
    'PayrollEntries': ['id', 'employeeName', 'employeeId', 'month', 'baseSalary', 'bonuses', 'deductions', 'employerLiabilities', 'totalWorkerNet', 'totalEmployerCost', 'status', 'submittedDate']
  };

  const created = [];
  const updated = [];

  for (const [sheetName, headers] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers); 
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      created.push(sheetName);
    } else {
      // Check for missing columns and add them
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      let addedColumns = false;
      
      headers.forEach(header => {
        if (!existingHeaders.includes(header)) {
          sheet.insertColumnAfter(sheet.getLastColumn() || 1);
          sheet.getRange(1, (sheet.getLastColumn() || 1) + 1).setValue(header).setFontWeight('bold').setBackground('#f3f4f6');
          existingHeaders.push(header);
          addedColumns = true;
        }
      });
      
      if (addedColumns) {
        updated.push(sheetName);
      }
    }
  }

  return { message: 'Estructura creada/verificada correctamente', sheets: created, updatedSheets: updated };
}

function getData(ss, sheetName) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = data.shift();
  
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      if ((header === 'history' || header === 'parts' || header === 'defaultBonuses' || header === 'defaultDeductions' || header === 'defaultEmployerLiabilities' || header === 'bonuses' || header === 'deductions' || header === 'employerLiabilities' || header === 'ppeAssignments') && row[i]) {
        try {
          obj[header] = JSON.parse(row[i]);
        } catch (e) {
          obj[header] = [];
        }
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

function addRow(ss, sheetName, item) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    let val = item[header];
    if (typeof val === 'object') val = JSON.stringify(val);
    if (typeof val === 'string' && (val.startsWith('=') || val.startsWith('+') || val.startsWith('-'))) {
      val = "'" + val;
    }
    if (typeof val === 'string' && val.length > 50000) {
      val = val.substring(0, 49990) + '...'; // Truncate to avoid error
    }
    return val;
  });
  sheet.appendRow(row);
}

function updateRow(ss, sheetName, id, updates) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      const rowValues = data[i];
      let changed = false;
      headers.forEach((header, colIndex) => {
        if (updates.hasOwnProperty(header)) {
          let val = updates[header];
          if (typeof val === 'object') val = JSON.stringify(val);
          if (typeof val === 'string' && (val.startsWith('=') || val.startsWith('+') || val.startsWith('-'))) {
            val = "'" + val;
          }
          if (typeof val === 'string' && val.length > 50000) {
            val = val.substring(0, 49990) + '...'; // Truncate to avoid error
          }
          rowValues[colIndex] = val;
          changed = true;
        }
      });
      if (changed) {
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowValues]);
      }
      return;
    }
  }
  throw new Error('ID no encontrado: ' + id);
}

function deleteRow(ss, sheetName, id) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIndex = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}
