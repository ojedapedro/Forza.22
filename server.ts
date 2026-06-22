import cron from 'node-cron';
import express from 'express';

// Suppress Firebase Grpc idle stream warnings on backend
const originalConsoleError = console.error;
console.error = function(...args) {
  const logStr = args.map(String).join(' ');
  if (logStr.includes("GrpcConnection") && logStr.includes("CANCELLED")) {
    return; // Suppress Firebase idle stream warning
  }
  originalConsoleError.apply(console, args);
};

console.log('🚀 [Server] server.ts cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { checkAndSendNotifications, fetchServerSettings } from './src/server/notifications.ts';

// Import API handlers
import pingHandler from './src/api/ping.ts';
import createPaymentIntentHandler from './src/api/create-payment-intent.ts';
import sendEmailsHandler from './src/modules/payroll/api/send-emails.ts';
import sendEmailHandler from './src/api/notifications/send-email.ts';
import whatsappCheckHandler from './src/api/notifications/whatsapp/check.ts';
import whatsappSendHandler from './src/api/notifications/whatsapp/send.ts';
import exchangeRateHandler from './src/api/exchange-rate.ts';
import hikvisionWebhookHandler from './src/api/hikvision/webhook.ts';
import hikvisionStatusHandler from './src/api/hikvision/status.ts';
import hikvisionControlHandler from './src/api/hikvision/control.ts';

async function startServer() {
  console.log(`🚀 [Server] Iniciando servidor Express... (${new Date().toISOString()})`);
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Socket.IO Logic
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket] Nuevo usuario conectado: ${socket.id}`);

    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`👥 [Socket] Usuario ${socket.id} se unió a la sala: ${room}`);
    });

    socket.on('chat:message', (message) => {
      // Broadcast simple a todos en la sala. 
      // La persistencia se maneja en el cliente vía Firestore para robustez.
      io.to(message.room).emit('chat:message', message);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket] Usuario desconectado: ${socket.id}`);
    });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fiscal-control-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true, 
      sameSite: 'none',
      httpOnly: true 
    }
  }));

  // Mount API routes
  app.all('/api/ping', pingHandler);
  app.all('/api/create-payment-intent', createPaymentIntentHandler);
  app.all('/api/payroll/send-emails', sendEmailsHandler);
  app.all('/api/notifications/send-email', sendEmailHandler);
  app.all('/api/notifications/whatsapp/check', whatsappCheckHandler);
  app.all('/api/notifications/whatsapp/send', whatsappSendHandler);
  app.all('/api/exchange-rate', exchangeRateHandler);
  app.all('/api/hikvision/webhook', hikvisionWebhookHandler);
  app.all('/api/hikvision/status', hikvisionStatusHandler);
  app.all('/api/hikvision/control', hikvisionControlHandler);

  // global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('💥 Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  });

  let isProd = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('.cjs');

  console.log(`🚀 [Server] Modo detectado al inicio: ${isProd ? 'PRODUCCIÓN' : 'DESARROLLO'} (NODE_ENV: ${process.env.NODE_ENV || 'no definido'})`);

  // Explicitly serve Service Worker and Manifest to avoid SPA fallback issues
  app.get('/service-worker.js', (req, res) => {
    const swPath = isProd
      ? path.join(process.cwd(), 'dist', 'service-worker.js')
      : path.join(process.cwd(), 'public', 'service-worker.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(swPath);
  });

  app.get('/manifest.json', (req, res) => {
    const manifestPath = isProd
      ? path.join(process.cwd(), 'dist', 'manifest.json')
      : path.join(process.cwd(), 'public', 'manifest.json');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(manifestPath);
  });

  // Vite middleware
  let vite: any = null;
  if (!isProd) {
    try {
      console.log('📦 [Server] Intentando cargar Vite middleware...');
      const { createServer: createViteServer } = await import('vite');
      vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer }
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('✅ [Server] Vite middleware configurado exitosamente.');
    } catch (err: any) {
      console.warn('⚠️ [Server] No se pudo cargar Vite (probablemente estemos en prod sin devDependencies). Activando modo producción. Error:', err.message);
      isProd = true;
    }
  }

  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    // Servir assets estáticos con cache largo si tienen hash, pero NO el index.html ni el sw.js
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('service-worker.js') || filePath.endsWith('manifest.json')) {
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
        } else if (filePath.includes('/assets/')) {
          // Los assets de Vite tienen hashes, son seguros para cachear por mucho tiempo
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*all', (req, res) => {
      // Si la petición parece ser un activo (tiene extensión) y no fue capturada por express.static, 
      // devolvemos 404 en lugar de index.html para evitar errores de tipo MIME
      if (req.path.includes('.') && !req.path.endsWith('.html')) {
        console.warn(`⚠️ [Server] 404 Activo no encontrado: ${req.path}`);
        return res.status(404).set('Cache-Control', 'no-store').json({ error: 'Asset not found', path: req.path });
      }
      // No cachear el index.html para evitar que el navegador guarde referencias a assets viejos
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`🌍 [Server] URL: http://0.0.0.0:${PORT}`);
    console.log(`📝 [Server] process.env.PORT detectado: ${process.env.PORT || 'no definido'}`);
    
    // Configurar cron-job para procesar recordatorios programados
    cron.schedule('* * * * *', async () => {
        try {
            const settings = await fetchServerSettings();
            
            // Default time si no hay configuración
            const scheduleTime = settings?.emailScheduleTime || '08:00';
            
            const now = new Date();
            // Asegurar zona horaria estándar o local. Trabajamos con hora local del contenedor:
            const currentHour = String(now.getHours()).padStart(2, '0');
            const currentMinute = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;
            
            if (currentTime === scheduleTime) {
                console.log(`🕒 [Server] Coincidencia de horario (${currentTime}). Ejecutando recordatorios...`);
                await checkAndSendNotifications();
            }
        } catch (err) {
            console.error('❌ [Server] Error en el cron programado:', err);
        }
    });

    // Ejecutar un chequeo inicial después de 30 segundos del arranque para debug
    setTimeout(async () => {
      console.log('🕒 [Server] Ejecutando chequeo inicial de notificaciones...');
      try {
        await checkAndSendNotifications();
      } catch (err) {
        console.error('❌ [Server] Error en el chequeo inicial:', err);
      }
    }, 30000);
  });
}

startServer();
