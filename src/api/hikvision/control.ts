import { Request, Response } from 'express';

/**
 * Control Hikvision Device (Remote Unlock, etc.)
 */
export default async function hikvisionControlHandler(req: Request, res: Response) {
  try {
    const { deviceId, action } = req.body;

    if (!deviceId || !action) {
      return res.status(400).json({ error: 'deviceId and action are required' });
    }

    console.log(`🎮 [Hikvision Control] Accion: ${action} en dispositivo: ${deviceId}`);

    // Aquí iría la llamada a la API ISAPI de Hikvision
    // PUT /ISAPI/AccessControl/RemoteControl/door/1

    res.status(200).json({ 
      success: true, 
      message: `Comando ${action} enviado correctamente al dispositivo ${deviceId}` 
    });

  } catch (error: any) {
    console.error('❌ [Hikvision Control] Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
