
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Invoice, InvoiceStatus, Client, Store, Role, User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InvoicingModuleProps {
  currentUser: User;
  stores: Store[];
}

export const InvoicingModule: React.FC<InvoicingModuleProps> = ({ currentUser, stores }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<{ description: string, quantity: number, unitPrice: number, taxRate: number }[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0.16 }
  ]);
  const [invoiceNumber, setInvoiceNumber] = useState(`FAC-${Date.now().toString().slice(-6)}`);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'BS'>('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Client Form State
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    rif: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, clientsRes, settingsRes] = await Promise.all([
        firestoreService.getInvoices(),
        firestoreService.getClients(),
        firestoreService.getSettings()
      ]);
      setInvoices(invRes.invoices);
      setClients(clientsRes);
      if (settingsRes?.exchangeRate) {
        setExchangeRate(settingsRes.exchangeRate);
      }
    } catch (error) {
      showNotification('error', 'Error cargando datos de facturación');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * item.taxRate), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      showNotification('error', 'Debe seleccionar un cliente');
      return;
    }

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const total = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      number: invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientRif: selectedClient.rif,
      clientEmail: selectedClient.email,
      clientAddress: selectedClient.address,
      items: items.map((item, idx) => ({ ...item, id: `ITEM-${idx}`, total: item.quantity * item.unitPrice * (1 + item.taxRate) })),
      subtotal,
      taxAmount,
      total,
      status: InvoiceStatus.DRAFT,
      notes,
      currency,
      exchangeRate,
      storeId: (currentUser.storeIds && currentUser.storeIds.length > 0 ? currentUser.storeIds[0] : (stores[0]?.id || 'MASTER')),
      createdBy: currentUser.id
    };

    try {
      await firestoreService.createInvoice(newInvoice);
      setInvoices([newInvoice, ...invoices]);
      showNotification('success', 'Factura generada con éxito');
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      showNotification('error', 'Error guardando factura');
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientToAdd: Client = {
      ...newClient,
      id: `CLI-${Date.now()}`
    };

    try {
      await firestoreService.createClient(clientToAdd);
      setClients([...clients, clientToAdd]);
      setSelectedClient(clientToAdd);
      setIsClientFormOpen(false);
      showNotification('success', 'Cliente registrado');
    } catch (error) {
      showNotification('error', 'Error registrando cliente');
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.16 }]);
    setInvoiceNumber(`FAC-${Date.now().toString().slice(-6)}`);
    setDueDate('');
    setNotes('');
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('FACTURA ELECTRÓNICA', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Número: ${invoice.number}`, 150, 40);
    doc.text(`Fecha Emisión: ${invoice.issueDate}`, 150, 45);
    doc.text(`Fecha Vencimiento: ${invoice.dueDate}`, 150, 50);

    // Client Info
    doc.setFontSize(12);
    doc.text('CLIENTE:', 15, 40);
    doc.setFontSize(10);
    doc.text(invoice.clientName, 15, 45);
    doc.text(`RIF: ${invoice.clientRif}`, 15, 50);
    doc.text(`Email: ${invoice.clientEmail}`, 15, 55);
    if (invoice.clientAddress) doc.text(`Dirección: ${invoice.clientAddress}`, 15, 60);

    // Items Table
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toLocaleString()}`,
      `${(item.taxRate * 100).toFixed(0)}%`,
      `$${(item.quantity * item.unitPrice).toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: 70,
      head: [['Descripción', 'Cant.', 'P. Unit', 'Iva', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: '#4f46e5' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.text(`Subtotal: $${invoice.subtotal.toLocaleString()}`, 150, finalY);
    doc.text(`IVA: $${invoice.taxAmount.toLocaleString()}`, 150, finalY + 5);
    doc.setFontSize(14);
    doc.text(`TOTAL: $${invoice.total.toLocaleString()}`, 150, finalY + 12);

    if (invoice.currency === 'BS') {
        const totalBs = invoice.total * invoice.exchangeRate;
        doc.setFontSize(10);
        doc.text(`Total en Bs: ${totalBs.toLocaleString()} (Tasa: ${invoice.exchangeRate})`, 150, finalY + 20);
    }

    if (invoice.notes) {
      doc.setFontSize(10);
      doc.text('Notas:', 15, finalY);
      doc.text(invoice.notes, 15, finalY + 5);
    }

    doc.save(`Factura_${invoice.number}.pdf`);
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    showNotification('success', 'Enviando factura por correo...');
    try {
      const response = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.clientEmail,
          subject: `Factura ${invoice.number} - Forza 22`,
          text: `Hola ${invoice.clientName},\n\nSe ha generado la factura ${invoice.number} por un monto de $${invoice.total.toLocaleString()}.\n\nNotas: ${invoice.notes || 'Ninguna'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
              <h2 style="color: #4f46e5;">Nueva Factura Generada</h2>
              <p>Hola <strong>${invoice.clientName}</strong>,</p>
              <p>Adjunto a este correo (simulado) encontrará su factura electrónica.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Factura #:</strong> ${invoice.number}</p>
                <p style="margin: 5px 0;"><strong>Fecha:</strong> ${invoice.issueDate}</p>
                <p style="margin: 5px 0;"><strong>Monto Total:</strong> $${invoice.total.toLocaleString()}</p>
              </div>
              <p style="color: #64748b; font-size: 12px;">Este es un sistema automático de Forza 22.</p>
            </div>
          `
        })
      });

      if (response.ok) {
        showNotification('success', 'Factura enviada correctamente');
        const updatedInvoice = { ...invoice, status: InvoiceStatus.SENT, sentAt: new Date().toISOString() };
        await firestoreService.updateInvoice(updatedInvoice);
        setInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
      } else {
        throw new Error('Error enviando correo');
      }
    } catch (error) {
      showNotification('error', 'Error enviando factura');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.clientRif.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <CreditCard className="text-brand-500" size={32} />
            Facturación Electrónica
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de comprobantes y clientes registrados.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsFormOpen(true)}
                className="btn-primary flex items-center gap-2 group"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Nueva Factura
            </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por número, cliente o RIF..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="All">Todos los estados</option>
            {Object.values(InvoiceStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Número</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Cliente</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Fecha</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Total</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Estado</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{inv.number}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{inv.clientName}</span>
                      <span className="text-xs text-slate-500">{inv.clientRif}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{inv.issueDate}</td>
                  <td className="px-6 py-4 font-black text-brand-600 dark:text-brand-400">
                    ${inv.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      inv.status === InvoiceStatus.PAID ? 'bg-emerald-500/10 text-emerald-500' :
                      inv.status === InvoiceStatus.SENT ? 'bg-blue-500/10 text-blue-500' :
                      inv.status === InvoiceStatus.CANCELLED ? 'bg-red-500/10 text-red-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => generatePDF(inv)}
                            className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-lg transition-all"
                            title="Descargar PDF"
                        >
                            <Download size={18} />
                        </button>
                        <button 
                            onClick={() => handleSendInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-lg transition-all"
                            title="Enviar por Correo"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsFormOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Nueva Factura</h2>
                  <p className="text-sm text-slate-500">Complete los datos del comprobante electrónico.</p>
                </div>
                <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all"
                >
                    <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Invoice Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Número de Factura</label>
                        <input 
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Fecha de Vencimiento</label>
                        <input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Moneda</label>
                        <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as 'USD' | 'BS')}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                            <option value="USD">USD (Dólares)</option>
                            <option value="BS">BS (Bolívares)</option>
                        </select>
                    </div>
                </div>

                {/* Client Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Información del Cliente</h3>
                        <button 
                            type="button"
                            onClick={() => setIsClientFormOpen(true)}
                            className="text-brand-500 hover:text-brand-600 text-sm font-bold flex items-center gap-1"
                        >
                            <UserPlus size={16} />
                            Registrar Cliente
                        </button>
                    </div>
                    <select 
                        value={selectedClient?.id || ''}
                        onChange={(e) => {
                            const client = clients.find(c => c.id === e.target.value);
                            setSelectedClient(client || null);
                        }}
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                        required
                    >
                        <option value="">Seleccione un cliente...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name} ({client.rif})</option>
                        ))}
                    </select>
                    {selectedClient && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl space-y-1"
                        >
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedClient.name}</p>
                            <p className="text-xs text-slate-500">RIF: {selectedClient.rif} | Email: {selectedClient.email}</p>
                            <p className="text-xs text-slate-500">{selectedClient.address}</p>
                        </motion.div>
                    )}
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conceptos</h3>
                    </div>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <div className="col-span-12 md:col-span-5 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Descripción</label>
                                    <input 
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[index].description = e.target.value;
                                            setItems(newItems);
                                        }}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                        placeholder="Ej. Servicio de Consultoría"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cant.</label>
                                    <input 
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[index].quantity = Math.max(1, parseInt(e.target.value) || 0);
                                            setItems(newItems);
                                        }}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">P. Unit</label>
                                    <input 
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[index].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                            setItems(newItems);
                                        }}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-1 text-right">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Subtotal</label>
                                    <div className="p-2.5 font-bold text-slate-900 dark:text-white">
                                        ${(item.quantity * item.unitPrice).toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                                        disabled={items.length === 1}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg disabled:opacity-30"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button"
                        onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.16 }])}
                        className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-all font-bold text-sm"
                    >
                        + Agregar Concepto
                    </button>
                </div>

                {/* Footer Notes & Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Observaciones Internas</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px]"
                            placeholder="Notas para el cliente o internas..."
                        />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span className="font-bold">${calculateSubtotal().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>IVA (16%):</span>
                            <span className="font-bold text-brand-500">${calculateTax().toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Total:</span>
                            <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                                ${calculateTotal().toLocaleString()}
                            </span>
                        </div>
                        {currency === 'BS' && (
                            <div className="pt-2 text-right text-xs font-bold text-slate-400 italic">
                                Equivalente: Bs {(calculateTotal() * exchangeRate).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white dark:bg-slate-950 mt-4 border-t border-slate-100 dark:border-slate-800 pb-2">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black shadow-lg shadow-brand-600/20 active:scale-95 transition-all"
                  >
                    Generar Factura
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Client Modal */}
      <AnimatePresence>
        {isClientFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsClientFormOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Registrar Cliente</h2>
                    <button onClick={() => setIsClientFormOpen(false)} className="text-slate-400"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddClient} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Razón Social / Nombre</label>
                        <input 
                            type="text"
                            value={newClient.name}
                            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">RIF / Cédula</label>
                        <input 
                            type="text"
                            value={newClient.rif}
                            onChange={(e) => setNewClient({...newClient, rif: e.target.value})}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            placeholder="J-00000000-0"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Email</label>
                        <input 
                            type="email"
                            value={newClient.email}
                            onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Dirección</label>
                        <textarea 
                            value={newClient.address}
                            onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-3 rounded-xl bg-brand-600 text-white font-black mt-4 active:scale-95 transition-all"
                    >
                        Guardar Cliente
                    </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
