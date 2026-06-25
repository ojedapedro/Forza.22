import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, AlertTriangle, Download, CheckCircle2, ChevronDown, DollarSign } from 'lucide-react';
import { Payment, PaymentStatus } from '../types';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { jsPDF } from 'jspdf';

interface PredictiveAnalysisProps {
  payments: Payment[];
}

export const PredictiveAnalysis: React.FC<PredictiveAnalysisProps> = ({ payments }) => {
  const { exchangeRate } = useExchangeRate();
  const [isExporting, setIsExporting] = useState(false);

  // Generate Insights
  const insights = useMemo(() => {
    const totalPayments = payments.length;
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
    const approvedPayments = payments.filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
    const rejectedPayments = payments.filter(p => p.status === PaymentStatus.REJECTED);
    const overduePayments = payments.filter(p => p.status === PaymentStatus.OVERDUE || (p.dueDate && new Date(p.dueDate) < new Date() && p.status !== PaymentStatus.PAID && p.status !== PaymentStatus.APPROVED));
    const overBudgetPayments = payments.filter(p => p.isOverBudget);

    const pendingAmount = pendingPayments.reduce((acc, p) => acc + (p.proposedAmount || p.amount), 0);
    const overdueAmount = overduePayments.reduce((acc, p) => acc + (p.proposedAmount || p.amount), 0);
    const overBudgetAmount = overBudgetPayments.reduce((acc, p) => {
       const cost = (p.proposedAmount || p.amount);
       return acc + (cost > (p.originalBudget || 0) ? cost - (p.originalBudget || 0) : 0);
    }, 0);

    const recommendations = [];
    
    // Insights Logic
    if (overduePayments.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Riesgo de Multas por Pagos Vencidos',
        description: `Existen ${overduePayments.length} pagos vencidos que suman $${overdueAmount.toLocaleString()}. Priorice estos pagos para mitigar riesgos legales o recargos.`,
        icon: AlertTriangle,
        color: 'red'
      });
    }

    if (pendingPayments.length > 5) {
      recommendations.push({
        type: 'warning',
        title: 'Cuello de Botella en Aprobaciones',
        description: `Se detectaron ${pendingPayments.length} obligaciones pendientes por $${pendingAmount.toLocaleString()}. Agilice el proceso de revisión de auditores para evitar vencimientos inminentes.`,
        icon: TrendingUp,
        color: 'amber'
      });
    }

    if (overBudgetPayments.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Desviación de Presupuesto',
        description: `Se han registrado sobregiros en ${overBudgetPayments.length} obligaciones, generando un exceso de $${overBudgetAmount.toLocaleString()}. Se sugiere revisar las partidas asociadas.`,
        icon: DollarSign,
        color: 'orange'
      });
    }

    if (totalPayments > 0 && overduePayments.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Gestión Saludable',
        description: 'La gestión actual de pagos se encuentra al día, sin vencimientos detectados. Excelente control de cumplimiento.',
        icon: CheckCircle2,
        color: 'emerald'
      });
    }
    
    // Suggest general optimization
    recommendations.push({
      type: 'info',
      title: 'Optimización de Flujo de Caja',
      description: 'Considerar la consolidación de pagos recurrentes o renegociación de términos con proveedores para obligaciones sistemáticas.',
      icon: Lightbulb,
      color: 'blue'
    });

    return {
      total: totalPayments,
      pendingCount: pendingPayments.length,
      approvedCount: approvedPayments.length,
      rejectedCount: rejectedPayments.length,
      overdueCount: overduePayments.length,
      recommendations
    };
  }, [payments]);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 100)); // allow UI to update to loading state
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Análisis Predictivo y Financiero", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 35, 196, 35);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumen de Obligaciones", 14, 45);
      
      doc.setFontSize(11);
      doc.text(`Obligaciones Activas: ${insights.total}`, 14, 55);
      doc.text(`Pendientes de Gestión: ${insights.pendingCount}`, 14, 62);
      doc.text(`Alertas Vencidas: ${insights.overdueCount}`, 14, 69);
      doc.text(`Gestión Exitosa: ${insights.approvedCount}`, 14, 76);
      
      doc.setFontSize(14);
      doc.text("Observaciones y Soluciones Propuestas", 14, 90);
      
      let currentY = 100;
      
      insights.recommendations.forEach(rec => {
         if (currentY > 270) {
             doc.addPage();
             currentY = 20;
         }
         doc.setFontSize(12);
         doc.setFont("helvetica", "bold");
         doc.text(rec.title, 14, currentY);
         
         currentY += 6;
         doc.setFontSize(10);
         doc.setFont("helvetica", "normal");
         doc.setTextColor(80, 80, 80);
         
         const splitText = doc.splitTextToSize(rec.description, 180);
         doc.text(splitText, 14, currentY);
         
         doc.setTextColor(0, 0, 0); // reset color
         currentY += (splitText.length * 5) + 8;
      });
      
      doc.save('analisis_predictivo.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Export */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Lightbulb className="text-amber-500" />
            Análisis Financiero y Predictivo
          </h2>
          <p className="text-slate-500 mt-2">Detección de patrones, análisis de gestión y recomendaciones generadas.</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
               Generando PDF...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Download size={18} />
              Descargar Análisis PDF
            </span>
          )}
        </button>
      </div>

      <div id="predictive-analysis-content" className="space-y-8 bg-slate-50 dark:bg-slate-900/20 p-2 sm:p-4 rounded-3xl">
        {/* Status Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Obligaciones Activas</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{insights.total}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Pendientes de Gestión</div>
                <div className="text-3xl font-black text-amber-500">{insights.pendingCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Alertas Vencidas</div>
                <div className="text-3xl font-black text-red-500">{insights.overdueCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Gestión Exitosa</div>
                <div className="text-3xl font-black text-emerald-500">{insights.approvedCount}</div>
            </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
             Observaciones y Soluciones Propuestas
          </h3>
          <div className="space-y-4">
            {insights.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border border-${rec.color}-200 dark:border-${rec.color}-900/50 bg-${rec.color}-50 dark:bg-${rec.color}-900/10 flex gap-4`}
              >
                <div className={`p-3 bg-${rec.color}-100 dark:bg-${rec.color}-900/30 text-${rec.color}-600 dark:text-${rec.color}-400 rounded-xl h-fit`}>
                  <rec.icon size={24} />
                </div>
                <div>
                  <h4 className={`text-base font-bold text-${rec.color}-800 dark:text-${rec.color}-300 mb-1`}>{rec.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
