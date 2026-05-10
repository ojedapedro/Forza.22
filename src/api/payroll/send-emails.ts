import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import { PayrollEmailTemplate } from '../../components/PayrollEmailTemplate';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Se requiere una lista de entradas de nómina.' });
    }

    const key = process.env.RESEND_API_KEY;
    console.log('🔍 [payroll-emails-v2] Verificando RESEND_API_KEY:', key ? `Presente (Empieza por ${key.substring(0, 3)}...)` : 'AUSENTE');

    if (!key) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Simulando envío de recibos de nómina (Modo Demo).');
      return res.status(200).json({ 
        success: true, 
        message: 'Envío de nómina simulado (Modo Demo)',
        results: entries.map(e => ({ id: e.id, success: true, isDemo: true }))
      });
    }
    
    const resendClient = new Resend(key);

    const results = [];

    for (const entry of entries) {
      try {
        if (!entry.employeeEmail) {
          results.push({ id: entry.id, success: false, error: 'Correo no proporcionado' });
          continue;
        }

        const html = await render(
          React.createElement(PayrollEmailTemplate, {
            employeeName: entry.employeeName,
            month: entry.month,
            baseSalary: entry.baseSalary,
            totalWorkerNet: entry.totalWorkerNet,
            bonuses: entry.bonuses || [],
            deductions: entry.deductions || []
          })
        );

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const targetEmail = process.env.RESEND_TEST_TO_EMAIL || entry.employeeEmail;

        const { data, error } = await resendClient.emails.send({
          from: `Nómina Forza 22 <${fromEmail}>`,
          to: [targetEmail],
          subject: `Recibo de Pago - ${entry.month} - ${entry.employeeName}`,
          html: html,
        });

        if (error) {
          results.push({ id: entry.id, success: false, error: error.message });
        } else {
          results.push({ id: entry.id, success: true, messageId: data?.id });
        }
      } catch (err: any) {
        results.push({ id: entry.id, success: false, error: err.message });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (err: any) {
    console.error('💥 Error fatal en send-emails:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error fatal en el servidor', details: err?.message || String(err), stack: err?.stack });
    }
  }
}
