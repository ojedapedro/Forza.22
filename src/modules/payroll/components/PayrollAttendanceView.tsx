import React, { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw, Download, Clock, UserCheck, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, AttendanceRecord } from '../types';
import { attendanceService } from '../services/attendanceService';
import { formatDate } from '../utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollAttendanceViewProps {
  employees: Employee[];
}

export const PayrollAttendanceView: React.FC<PayrollAttendanceViewProps> = ({ employees }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getDailyAttendance(date, employees);
      setRecords(data);
    } catch (error) {
      console.error('Error loading attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [date, employees]);

  const filteredRecords = records.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeStr = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExportCSV = () => {
    const data = filteredRecords.map(r => ({
      Fecha: r.date,
      Trabajador: r.employeeName,
      ID: r.employeeId,
      Entrada: formatTimeStr(r.checkIn),
      Salida: formatTimeStr(r.checkOut),
      'Horas Trabajadas': r.hoursWorked,
      Estado: r.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
    XLSX.writeFile(wb, `Asistencia_${date}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Asistencia Diaria', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${formatDate(date)}`, 14, 30);
    
    const tableData = filteredRecords.map(r => [
      r.employeeName,
      r.employeeId,
      formatTimeStr(r.checkIn),
      formatTimeStr(r.checkOut),
      `${r.hoursWorked}h`,
      r.status
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Trabajador', 'Cédula/ID', 'Entrada', 'Salida', 'Horas', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Asistencia_${date}.pdf`);
  };

  const presentCount = records.filter(r => r.status === 'PRESENTE').length;
  const absentCount = records.filter(r => r.status === 'AUSENTE').length;

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
            onClick={loadAttendance}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Empleados</p>
            <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Presentes</p>
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Ausentes</p>
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <UserX className="w-6 h-6" />
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
                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Entrada</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Salida</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Horas</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando asistencia...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay registros de asistencia para esta fecha.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={record.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{record.employeeName}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {record.employeeId}
                    </td>
                    <td className="p-4 text-center font-mono text-sm text-gray-700">
                      {formatTimeStr(record.checkIn)}
                    </td>
                    <td className="p-4 text-center font-mono text-sm text-gray-700">
                      {formatTimeStr(record.checkOut)}
                    </td>
                    <td className="p-4 text-center text-sm">
                      {record.hoursWorked > 0 ? (
                        <span className="font-medium text-blue-600">{record.hoursWorked}h</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'PRESENTE' 
                          ? 'bg-green-100 text-green-800' 
                          : record.status === 'RETARDO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
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
