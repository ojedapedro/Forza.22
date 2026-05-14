import { Request, Response } from 'express';

/**
 * Handle Hikvision Event Webhooks
 * Hikvision devices can send XML or JSON events via HTTP Host or ISUP.
 */
export default async function hikvisionWebhookHandler(req: Request, res: Response) {
  try {
    const event = req.body;
    console.log('🔔 [Hikvision Webhook] Evento recibido:', JSON.stringify(event, null, 2));

    // Lógica para procesar el evento (ej: registrar asistencia, alerta de seguridad)
    // En una implementación real, aquí se guardaría en Firestore

    res.status(200).json({ status: 'ok', message: 'Evento procesado' });
  } catch (error: any) {
    console.error('❌ [Hikvision Webhook] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
