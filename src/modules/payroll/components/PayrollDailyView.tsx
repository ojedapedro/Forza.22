import React, { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw, DollarSign, Calculator, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, DailyPayrollEntry } from '../types';
import { attendanceService } from '../services/attendanceService';
import { calculateDailyPayroll } from '../utils/lotttCalculations';
import { formatDate } from '../utils';
import { useExchangeRate } from '../../../contexts/ExchangeRateContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollDailyViewProps {
  employees: Employee[];
}

export const PayrollDailyView: React.FC<PayrollDailyViewProps> = ({ employees }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState<DailyPayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { exchangeRate } = useExchangeRate();

  const loadDailyPayroll = async () => {
    setLoading(true);
    try {
      const attendance = await attendanceService.getDailyAttendance(date, employees);
      
      const entries: DailyPayrollEntry[] = [];
      
      attendance.forEach(att => {
        const emp = employees.find(e => e.id === att.employeeId);
        if (!emp) return;
        
        // Asumiendo horario normal. Para horas extras o nocturnas se requeriría una lógica más fina sobre el attendance
        // Aquí pasaremos 0 para simplificar, a menos que hoursWorked > 8
        let overtime = 0;
        if (att.hoursWorked > 8) {
          overtime = att.hoursWorked - 8;
        }

        const entry = calculateDailyPayroll(emp, date, 0, 0, overtime);
        
        // Si no vino, descontar el día o dejarlo en 0. 
        // Según el usuario, los días libres son remunerados, 
        // pero si faltó injustificadamente, ¿qué pasa?
        // Asumiremos que se paga igual la fracción base, pero podríamos ajustarlo
        if (att.status === 'AUSENTE') {
          // Si queremos que gane 0 si está ausente:
          // entry.totalNet = 0; 
          // entry.bonuses = [];
        }

        entries.push(entry);
      });

      setDailyEntries(entries);
    } catch (error) {
      console.error('Error loading daily payroll', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyPayroll();
  }, [date, employees]);

  const filteredEntries = dailyEntries.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDailyCost = filteredEntries.reduce((sum, e) => sum + e.totalNet, 0);

  const handleExportCSV = () => {
    const data = filteredEntries.map(e => ({
      Fecha: e.date,
      Trabajador: e.employeeName,
      ID: e.employeeId,
      'Tarifa Diaria ($)': e.dailyRate,
      'Total Bonos ($)': e.bonuses.reduce((s, b) => s + b.amount, 0),
      'Total Deducciones ($)': e.deductions.reduce((s, d) => s + d.amount, 0),
      'Neto a Pagar ($)': e.totalNet,
      'Neto a Pagar (Bs)': e.totalNet * exchangeRate,
      Estado: e.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nómina Diaria");
    XLSX.writeFile(wb, `Nomina_Diaria_${date}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Nómina Diaria', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${formatDate(date)}`, 14, 30);
    doc.text(`Total del Día: $${totalDailyCost.toLocaleString()}`, 14, 35);
    
    const tableData = filteredEntries.map(e => [
      e.employeeName,
      e.employeeId,
      `$${e.dailyRate.toLocaleString()}`,
      `$${e.totalNet.toLocaleString()}`,
      e.status
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Trabajador', 'Cédula/ID', 'Tarifa Diaria', 'Total Neto ($)', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Nomina_Diaria_${date}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={loadDailyPayroll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Calcular
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Costo Diario</p>
            <p className="text-2xl font-bold text-gray-900">${totalDailyCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <p className="text-sm text-gray-400">Bs. {(totalDailyCost * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 text-sm">Trabajador</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Cédula/ID</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Tarifa Diaria</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Neto a Pagar</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Calculando nómina del día...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay registros procesados para esta fecha.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={entry.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{entry.employeeName}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {entry.employeeId}
                    </td>
                    <td className="p-4 text-right text-sm text-gray-500">
                      ${entry.dailyRate.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-right font-medium text-blue-600">
                      ${entry.totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                        {entry.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
