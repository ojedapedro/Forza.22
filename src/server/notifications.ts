import twilio from 'twilio';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { SystemSettings, PaymentStatus } from '../types.ts';
import { splitMessage } from '../utils.ts';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Client safely (Bypasses IAM issues by using REST/Web channel with open rules)
let db: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log('✅ [Notifications] Firebase Client (Web SDK) inicializado correctamente.');
} catch (err: any) {
  console.error('❌ [Notifications] Error inicializando Firebase Client:', err.message);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP || 'whatsapp:+16415353606';
const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBERS || process.env.ADMIN_WHATSAPP || '').split(',').filter(n => n.trim());
const presidencyNumber = process.env.PRESIDENCY_WHATSAPP_NUMBER || process.env.PRESIDENCY_WHATSAPP || process.env.PRESIDENCY_WHA;

// Helper to format WhatsApp number
const formatWhatsApp = (num: string) => {
  const cleanNum = num.trim();
  if (cleanNum.startsWith('whatsapp:')) return cleanNum;
  return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
};

// Lazy client initialization
let clientCache: twilio.Twilio | null = null;
function getTwilioClient(): twilio.Twilio | null {
  if (clientCache) return clientCache;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !sid.trim().startsWith('AC')) return null;
  try {
    clientCache = twilio(sid.trim(), token.trim());
    return clientCache;
  } catch {
    return null;
  }
}

export async function fetchServerSettings() {
    if (!db) return null;
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    return settingsDoc.exists() ? settingsDoc.data() : null;
}

export async function checkAndSendNotifications() {
  const client = getTwilioClient();
  
  if (!client) {
    return { success: false, message: 'Twilio no configurado.' };
  }

  if (!db) {
    return { success: false, message: 'Firebase no inicializado.' };
  }

  console.log('🔍 [Notifications] Iniciando auditoría con reglas abiertas...');
  
  try {
    // 1. Obtener Configuración
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    const settings = settingsDoc.exists() ? settingsDoc.data() as SystemSettings : null;
    
    if (settings && settings.whatsappEnabled === false) {
      return { success: true, message: 'WhatsApp desactivado.' };
    }

    const warningDays = settings?.daysBeforeWarning || 3;
    const criticalDays = settings?.daysBeforeCritical || 1;
    const gatewayUrl = settings?.whatsappGatewayUrl || '';
    const settingsPhone = settings?.whatsappPhone || '';

    // 2. Obtener Pagos
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueArr: any[] = [];
    const criticalArr: any[] = [];
    const warningArr: any[] = [];

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      if (p.status === PaymentStatus.PAID || p.status === PaymentStatus.REJECTED) return;

      const dueDate = new Date(p.dueDate + 'T00:00:00');
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdueArr.push({ ...p, diffDays });
      } else if (diffDays <= criticalDays) {
        criticalArr.push({ ...p, diffDays });
      } else if (diffDays <= warningDays) {
        warningArr.push({ ...p, diffDays });
      }
    });

    if (overdueArr.length === 0 && criticalArr.length === 0 && warningArr.length === 0) {
      return { success: true, message: 'No hay pagos urgentes.' };
    }

    // 2.5. Fetch Admin Emails
    const adminEmails: string[] = [];
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      usersSnap.forEach(u => {
        const userData = u.data();
        if ((userData.role === 'Administrador' || userData.role === 'Presidencia' || userData.role === 'Super Usuario') && userData.email) {
          adminEmails.push(userData.email);
        }
      });
    } catch (usersErr) {
      console.warn("⚠️ No se pudo obtener la lista de usuarios (falta de permisos en entorno servidor). Se usarán correos por defecto.");
    }
    
    // Add default admin from environment
    if (process.env.ADMIN_EMAILS) {
        const envEmails = process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(e => e);
        adminEmails.push(...envEmails);
    }
    if (process.env.RESEND_TEST_TO_EMAIL && adminEmails.length === 0) {
        adminEmails.push(process.env.RESEND_TEST_TO_EMAIL);
    }

    // 2.6. Send Email Notifications
    if (settings && settings.emailEnabled !== false && adminEmails.length > 0) {
      if (process.env.RESEND_API_KEY) {
        try {
          // Dynamic import to avoid top-level require issues
          const { Resend } = await import('resend');
          const resendClient = new Resend(process.env.RESEND_API_KEY);
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
          let htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0ea5e9;">Forza 22 - Reporte de Obligaciones</h2>
              <p>Fecha: ${today.toLocaleDateString()}</p>
          `;
          if (overdueArr.length > 0) {
            htmlContent += `<h3 style="color: #ef4444;">🔴 Vencidos</h3><ul>${overdueArr.map(p => `<li><strong>${p.storeName}</strong>: $${p.amount.toLocaleString()} - ${p.specificType} (Atrasado ${Math.abs(p.diffDays)} días)</li>`).join('')}</ul>`;
          }
          if (criticalArr.length > 0) {
             htmlContent += `<h3 style="color: #f59e0b;">🚨 Críticos</h3><ul>${criticalArr.map(p => `<li><strong>${p.storeName}</strong>: $${p.amount.toLocaleString()} - ${p.specificType} (Vence en ${p.diffDays} días)</li>`).join('')}</ul>`;
          }
          if (warningArr.length > 0) {
             htmlContent += `<h3 style="color: #3b82f6;">🟡 Próximos</h3><ul>${warningArr.map(p => `<li><strong>${p.storeName}</strong>: $${p.amount.toLocaleString()} - ${p.specificType} (Vence en ${p.diffDays} días)</li>`).join('')}</ul>`;
          }
          
          htmlContent += `
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
                Este es un correo automático. Por favor revise el panel de control para gestionar estos pagos.
              </div>
            </div>`;

          const targetEmails = process.env.RESEND_TEST_TO_EMAIL 
            ? [process.env.RESEND_TEST_TO_EMAIL] 
            : [...new Set(adminEmails)];

          if (targetEmails.length > 0) {
            await resendClient.emails.send({
              from: `Forza <${fromEmail}>`,
              to: targetEmails,
              subject: `Resumen de Obligaciones - ${today.toLocaleDateString()}`,
              html: htmlContent
            });
            console.log(`📧 Correo automático enviado exitosamente a ${targetEmails.length} administradores.`);
          }
        } catch(e: any) {
          console.error("❌ Error enviando email automático con Resend:", e);
        }
      } else {
        console.warn("⚠️ RESEND_API_KEY no configurada. No se enviaron emails automáticos.");
      }
    }

    // 3. Construir Mensaje de WhatsApp
    let message = `📊 *REPORTE FORZA 22*\n${today.toLocaleDateString()}\n`;
    message += `--------------------------------\n\n`;

    if (overdueArr.length > 0) {
      message += `🔴 *VENCIDOS*\n`;
      overdueArr.forEach(p => {
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | ${Math.abs(p.diffDays)}d atrasado\n`;
      });
      message += `\n`;
    }

    if (criticalArr.length > 0) {
      message += `🚨 *CRÍTICO*\n`;
      criticalArr.forEach(p => {
        const d = p.diffDays === 0 ? 'HOY' : `${p.diffDays}d`;
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | Vence ${d}\n`;
      });
      message += `\n`;
    }

    if (warningArr.length > 0) {
      message += `🟡 *PRÓXIMOS*\n`;
      warningArr.forEach(p => {
        message += `• ${p.storeName}: $${p.amount.toLocaleString()} | ${p.diffDays}d\n`;
      });
      message += `\n`;
    }

    message += `--------------------------------\n`;
    message += `💡 _Verifique el panel de control._`;

    // 4. Enviar
    const recipients = [...adminNumbers];
    if (presidencyNumber) recipients.push(presidencyNumber);
    if (settingsPhone) recipients.push(settingsPhone);
    const uniqueRecipients = [...new Set(recipients)].map(formatWhatsApp);

    const fromFormatted = formatWhatsApp(fromWhatsApp);
    console.log(`📧 Enviando desde ${fromFormatted} a ${uniqueRecipients.length} destinatarios...`);

    const results = await Promise.all(uniqueRecipients.map(async (to) => {
      try {
        const messageChunks = splitMessage(message, 1500);
        
        for (const chunk of messageChunks) {
          // Soporte para Gateway Externo (CallMeBot, etc)
          if (gatewayUrl && gatewayUrl.includes('[MESSAGE]')) {
            const cleanPhone = to.replace('whatsapp:', '').replace('+', '');
            const finalUrl = gatewayUrl
              .replace('[PHONE]', cleanPhone)
              .replace('[MESSAGE]', encodeURIComponent(chunk));
            
            await fetch(finalUrl);
          } else {
            // Si no hay gateway URL, usar Twilio (Default)
            await client!.messages.create({
              from: fromFormatted,
              to: to,
              body: chunk
            });
          }
        }
        
        return { to, success: true, method: gatewayUrl ? 'gateway' : 'twilio' };
      } catch (err: any) {
        let errorHint = '';
        if (err.message.includes('Channel')) {
          errorHint = ' | TIP: El número emisor (' + fromFormatted + ') no está habilitado para WhatsApp en Twilio. Si usas Sandbox, el emisor debe ser whatsapp:+14155238886';
        } else if (err.message.includes('exceeded') && (err.message.includes('limit') || err.message.includes('50'))) {
          errorHint = ' | TIP: Has excedido el límite diario de Twilio Trial (50 msgs). Para enviar más, usa el Gateway de CallMeBot o registra una cuenta paga de Twilio.';
        }
        console.error(`❌ Error en ${to}:`, err.message);
        return { to, success: false, error: err.message + errorHint };
      }
    }));

    const successful = results.filter(r => r.success).length;
    return { success: successful > 0, total: uniqueRecipients.length, successful, results };
  } catch (error: any) {
    console.error('💥 Error en auditoría:', error);
    return { success: false, message: error.message };
  }
}
