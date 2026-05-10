export default function handler(req: any, res: any) {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    env: { 
      hasResendKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV
    } 
  });
}
