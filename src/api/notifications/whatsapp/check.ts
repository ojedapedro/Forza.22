import { checkAndSendNotifications } from '../../../server/notifications.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await checkAndSendNotifications();
    res.json({
      ...result,
      _serverTime: new Date().toISOString(),
      _v: '2.1'
    });
  } catch (err: any) {
    console.error('💥 [API Check] Error:', err);
    res.status(500).json({ 
      error: 'Error interno al procesar notificaciones', 
      details: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
}
