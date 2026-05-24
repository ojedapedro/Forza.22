import { Request, Response } from 'express';
import { adminDb } from '../../lib/firebase-admin';

/**
 * Get Hikvision Devices Status
 */
export default async function hikvisionStatusHandler(req: Request, res: Response) {
  try {
    const { deviceId } = req.query;

    if (deviceId) {
      const doc = await adminDb.collection('hikvision_devices').doc(deviceId as string).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Device not found' });
      }
      return res.status(200).json(doc.data());
    }

    // List all devices
    const snapshot = await adminDb.collection('hikvision_devices').get();
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      count: devices.length,
      devices
    });

  } catch (error: any) {
    console.error('❌ [Hikvision Status] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
