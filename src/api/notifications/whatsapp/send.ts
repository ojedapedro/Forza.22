import twilio from 'twilio';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { splitMessage } from '../../../utils.ts';
import fs from 'fs';
import path from 'path';

// Initialize Firebase for settings check
let db: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'src/firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.error('Error init firebase in send handler:', err);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+16415353606';

// Lazy client initialization for resilience
let clientCache: twilio.Twilio | null = null;
function getTwilioClient(): twilio.Twilio | null {
  if (clientCache) return clientCache;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !sid.startsWith('AC')) return null;
  try {
    clientCache = twilio(sid, token);
    return clientCache;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'To and message are required' });
  }

  try {
    // 1. Verificar si hay un Gateway URL configurado en el sistema
    let gatewayUrl = '';
    if (db) {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        gatewayUrl = settingsDoc.data().whatsappGatewayUrl || '';
      }
    }

    const cleanTo = to.replace('whatsapp:', '').replace('+', '').trim();
    const messageChunks = splitMessage(message, 1500);
    let lastResult = null;

    // 2. Si hay Gateway URL, intentar usarlo
    if (gatewayUrl && gatewayUrl.includes('[MESSAGE]')) {
      let allOk = true;
      for (const chunk of messageChunks) {
        const finalUrl = gatewayUrl
          .replace('[PHONE]', cleanTo)
          .replace('[MESSAGE]', encodeURIComponent(chunk));
        
        const gatewayRes = await fetch(finalUrl);
        if (!gatewayRes.ok) allOk = false;
      }
      
      if (allOk) {
        return res.json({ success: true, method: 'gateway' });
      }
    }

    // 3. De lo contrario, usar Twilio (si está configurado)
    const client = getTwilioClient();
    if (!client) {
      return res.status(503).json({ error: 'Twilio not configured and no valid Gateway URL' });
    }

    const formatTwilio = (num: string) => {
      const cleanNum = num.trim();
      if (cleanNum.startsWith('whatsapp:')) return cleanNum;
      return `whatsapp:${cleanNum.startsWith('+') ? cleanNum : `+${cleanNum}`}`;
    };

    const fromFormatted = formatTwilio(fromWhatsApp);
    const toFormatted = formatTwilio(to);

    for (const chunk of messageChunks) {
      lastResult = await client.messages.create({
        from: fromFormatted,
        to: toFormatted,
        body: chunk
      });
    }
    
    res.json({ success: true, sid: lastResult?.sid, method: 'twilio' });
  } catch (err: any) {
    console.error('Send WhatsApp Error:', err.message);
    let errorHint = '';
    if (err.message.includes('exceeded') && (err.message.includes('limit') || err.message.includes('50'))) {
      errorHint = ' (TIP: Has excedido el límite diario de Twilio Trial de 50 mensajes. Usa CallMeBot o mejora tu plan de Twilio).';
    }
    res.status(500).json({ error: 'Failed to send WhatsApp', details: err.message + errorHint });
  }
}
