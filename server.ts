import express from 'express';

console.log('🚀 [Server] server.tsx cargado');
console.log('🚀 [Server] NODE_ENV:', process.env.NODE_ENV);
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { checkAndSendNotifications } from './src/server/notifications';

// Import API handlers
import pingHandler from './src/api/ping.ts';
import createPaymentIntentHandler from './src/api/create-payment-intent.ts';
import sendEmailsHandler from './src/api/payroll/send-emails.ts';
import sendEmailHandler from './src/api/notifications/send-email.ts';
import whatsappCheckHandler from './src/api/notifications/whatsapp/check.ts';
import whatsappSendHandler from './src/api/notifications/whatsapp/send.ts';
import exchangeRateHandler from './src/api/exchange-rate.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const PORT = Number(process.env.PORT) || 3000;

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

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('💥 Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: err.message
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`🌍 [Server] URL: http://0.0.0.0:${PORT}`);
    console.log(`📝 [Server] process.env.PORT detectado: ${process.env.PORT || 'no definido'}`);
    
    // Configurar chequeo diario de notificaciones (cada 24 horas)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      console.log('🕒 [Server] Ejecutando chequeo diario de notificaciones...');
      try {
        await checkAndSendNotifications();
      } catch (err) {
        console.error('❌ [Server] Error en el chequeo diario:', err);
      }
    }, TWENTY_FOUR_HOURS);
    
    // Ejecutar un chequeo inicial después de 30 segundos del arranque
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
