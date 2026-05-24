import { Request, Response } from 'express';
import { adminDb } from '../../lib/firebase-admin';
import { parseHikvisionEvent, extractEventDetails } from './utils';

/**
 * Handle Hikvision Event Webhooks
 * Hikvision devices can send XML or JSON events via HTTP Host or ISUP.
 */
export default async function hikvisionWebhookHandler(req: Request, res: Response) {
  try {
    const rawData = req.body;
    console.log('🔔 [Hikvision Webhook] Datos recibidos');

    const parsedEvent = parseHikvisionEvent(rawData);
    if (!parsedEvent) {
      return res.status(400).json({ status: 'error', message: 'Failed to parse request body' });
    }

    const eventDetails = extractEventDetails(parsedEvent);
    console.log(`📄 [Hikvision Webhook] Evento: ${eventDetails.eventType} de ${eventDetails.deviceName}`);

    // Persistir en Firestore
    const docRef = adminDb.collection('hikvision_events').doc();
    await docRef.set({
      ...eventDetails,
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ status: 'ok', message: 'Evento procesado y guardado', eventId: docRef.id });
  } catch (error: any) {
    console.error('❌ [Hikvision Webhook] Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
