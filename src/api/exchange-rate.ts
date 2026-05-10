import { Request, Response } from 'express';
import axios from 'axios';

export default async function exchangeRateHandler(req: Request, res: Response) {
  try {
    console.log('🌐 [API] Obteniendo tasa de cambio oficial (BCV)...');
    
    // Usamos el API de PyDolarVenezuela que es bastante confiable para obtener la tasa BCV
    // También podríamos intentar scrapear bcv.org.ve directamente, pero esta API es más limpia.
    const response = await axios.get('https://pydolarvenezuela-api-production.up.railway.app/api/v1/dollar?page=bcv');
    
    if (response.data && response.data.monitors && response.data.monitors.bcv) {
      const bcvData = response.data.monitors.bcv;
      const rate = bcvData.price;
      const lastUpdate = bcvData.last_update;
      
      console.log(`✅ [API] Tasa BCV obtenida: ${rate} (Actualizado: ${lastUpdate})`);
      
      return res.json({
        success: true,
        rate: rate,
        lastUpdate: lastUpdate,
        source: 'BCV (via PyDolar)'
      });
    }

    // Fallback simple si el anterior falla (a veces las APIs cambian estructura)
    // Intentamos una alternativa o lanzamos error
    throw new Error('No se pudo encontrar la tasa BCV en la respuesta de la API');

  } catch (error: any) {
    console.error('❌ [API] Error obteniendo tasa de cambio:', error.message);
    
    // Fallback a una tasa estática o devolver error
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la tasa de cambio oficial.',
      details: error.message
    });
  }
}
