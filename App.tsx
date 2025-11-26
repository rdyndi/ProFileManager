import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { ClientForm } from './components/ClientForm';
import { EmployeeForm } from './components/EmployeeForm';
import { DocumentGenerator, printDocument } from './components/DocumentGenerator';
import { DeedForm } from './components/DeedForm';
import { DeedReport } from './components/DeedReport';
import { DeedAlphabeticalReport } from './components/DeedAlphabeticalReport';
import { InvoiceGenerator, printInvoice, calculateItemValues, printReceipt } from './components/InvoiceGenerator';
import { ExpenseTracker } from './components/ExpenseTracker';
import { 
  subscribeClients, saveClient, deleteClient, 
  subscribeDocuments, saveDocument, updateDocument, deleteDocument,
  subscribeSettings, saveSettings, syncSettingsToLocalCache,
  subscribeDeeds, saveDeed, deleteDeed,
  subscribeEmployees, saveEmployee, deleteEmployee,
  subscribeInvoices, saveInvoice, deleteInvoice,
  subscribeExpenses, saveExpense, deleteExpense
} from './services/storage';
import { auth } from './services/firebaseService';
import { signInAnonymously } from "firebase/auth";
import { Client, CompanySettings, DocumentData, DocType, Deed, Employee, Invoice, PaymentRecord, Expense } from './types';
import { Users, Search, Plus, Trash2, Eye, FileText, Briefcase, ArrowUpRight, Save, Pencil, Printer, ScrollText, BookOpen, ArrowDownAZ, ArrowLeft, UserCog, Link as LinkIcon, ExternalLink, MessageCircle, Mail, Truck, TrendingUp, BarChart3, Package, FileCheck, CreditCard, Calendar, User, Banknote, X, Wallet } from 'lucide-react';

// --- Simple Custom SVG Line Chart Component ---
const SimpleLineChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data</div>;

  const height = 250;
  const width = 800;
  const padding = 40;
  
  // Calculate Max Value for Y-Axis Scale
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.clients, d.deeds, d.receipts, d.deliveries))
  ) || 10; // Default to 10 if 0 to avoid division by zero
  
  const scaleY = (val: number) => height - padding - (val / (maxValue * 1.1)) * (height - padding * 2);
  const scaleX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);

  // Generate Paths
  const createPath = (key: string) => {
    return data.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d[key])}`
    ).join(' ');
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = height - padding - (tick * (height - padding * 2));
            return (
                <g key={i}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
                    <text x={0} y={y + 4} fill="#94a3b8" textAnchor="start">{Math.round(maxValue * 1.1 * tick)}</text>
                </g>
            );
        })}

        {/* Lines */}
        <path d={createPath('clients')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('deeds')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('receipts')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('deliveries')} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-Axis Labels */}
        {data.map((d, i) => (
          <text key={i} x={scaleX(i)} y={height - 10} textAnchor="middle" fill="#64748b" className="font-medium">
            {d.month}
          </text>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600">Klien Baru</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-slate-600">Akta</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-slate-600">Tanda Terima</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-slate-600">Surat Jalan</span></div>
      </div>
    </div>
  );
};

// --- Client Detail Component ---
const ClientDetail: React.FC<{
  client: Client;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ client, onBack, onEdit, onDelete }) => {
  
  // Helper to format WhatsApp URL
  const getWaUrl = (number: string) => {
    // Remove non-digits
    let clean = number.replace(/\D/g, '');
    // Replace leading 0 with 62
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{client.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${client.type === 'PT' ? 'bg-blue-100 text-blue-700' : client.type === 'CV' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {client.type}
                    </span>
                    <span>•</span>
                    <span>Sejak {new Date(client.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={onEdit} className="px-4 py-2 flex items-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition">
                <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={onDelete} className="px-4 py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition">
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Hapus</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    Informasi Kontak
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">PIC / Penanggung Jawab</label>
                        <p className="font-medium text-slate-900 mt-1">{client.picName || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Nomor Kontak (WhatsApp)</label>
                        <p className="font-medium text-slate-900 mt-1">
                            <a 
                                href={getWaUrl(client.contactNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline w-fit"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {client.contactNumber}
                            </a>
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</label>
                        <p className="font-medium text-slate-900 mt-1">
                            <a 
                                href={`mailto:${client.email}`}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline w-fit"
                            >
                                <Mail className="w-4 h-4" />
                                {client.email}
                            </a>
                        </p>
                    </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">NIB / SIUP</label>
                        <p className="font-medium text-slate-900 mt-1">{client.nibSiup || '-'}</p>
                    </div>
                     <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Alamat Lengkap</label>
                        <p className="font-medium text-slate-900 mt-1">{client.address}</p>
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    Berkas Lampiran ({client.files?.length || 0})
                </h3>
                {client.files && client.files.length > 0 ? (
                    <div className="space-y-3">
                        {client.files.map((file, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary-200 transition">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2.5 rounded-lg ${file.url ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {file.url ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {file.url ? 'Link Eksternal (G-Drive)' : `Diupload ${new Date(file.uploadDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                {file.url ? (
                                    <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm font-medium hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 flex items-center gap-1"
                                    >
                                        Buka <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    <button className="text-slate-400 text-sm font-medium px-3 py-1 rounded cursor-not-allowed">Local File</button>
                                )}
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Tidak ada berkas lampiran.</p>
                    </div>
                )}
            </div>
        </div>

        <div>
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Ringkasan</h3>
                        <p className="text-slate-400 text-xs mt-1">Aktivitas Klien</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-slate-400 text-xs mb-1">Status Keanggotaan</p>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-400">Aktif</span>
                            <span className="text-xs text-slate-500">Online</span>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                             <p className="text-slate-400 text-[10px] uppercase">Total Akta</p>
                             <p className="text-xl font-bold mt-1">-</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                             <p className="text-slate-400 text-[10px] uppercase">Dokumen</p>
                             <p className="text-xl font-bold mt-1">-</p>
                        </div>
                     </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

// --- Invoice Detail Component (Updated with Payment Logic) ---
const InvoiceDetail: React.FC<{
    invoice: Invoice;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPrint: () => void;
    onUpdateInvoice: (invoice: Invoice) => void; 
}> = ({ invoice, onBack, onEdit, onDelete, onPrint, onUpdateInvoice }) => {
    
    // Hitung ulang total untuk display detail
    let subTotal = 0;
    let totalTax = 0;
    invoice.items.forEach(item => {
        const { grossAmount, taxAmount } = calculateItemValues(item);
        subTotal += grossAmount;
        totalTax += taxAmount;
    });
    const grandTotal = subTotal - totalTax;
    
    // Kalkulasi Total Terbayar dari History (atau fallback ke legacy paymentAmount)
    const historyTotal = invoice.paymentHistory?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const paymentAmount = historyTotal > 0 ? historyTotal : (invoice.paymentAmount || 0);
    const remainingAmount = Math.max(0, grandTotal - paymentAmount);

    // --- State for Add/Edit Payment Modal ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
    const [paymentNote, setPaymentNote] = useState('');
    
    const openAddPayment = () => {
        setEditingPaymentId(null);
        setNewPaymentDate(new Date().toISOString().split('T')[0]);
        setNewPaymentAmount(0);
        setPaymentNote('');
        setIsPaymentModalOpen(true);
    };

    const openEditPayment = (payment: PaymentRecord) => {
        setEditingPaymentId(payment.id);
        setNewPaymentDate(payment.date);
        setNewPaymentAmount(payment.amount);
        setPaymentNote(payment.note || '');
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = () => {
        if (newPaymentAmount <= 0) {
            alert("Jumlah pembayaran harus lebih dari 0");
            return;
        }

        // Get current history or initialize
        let updatedHistory = invoice.paymentHistory ? [...invoice.paymentHistory] : [];
        
        // Handle Legacy Migration if needed (only if not already migrated)
        if (updatedHistory.length === 0 && invoice.paymentAmount && invoice.paymentAmount > 0) {
            updatedHistory.push({
                id: 'legacy-payment',
                date: invoice.paymentDate || invoice.date,
                amount: invoice.paymentAmount,
                note: 'Pembayaran Sebelumnya'
            });
        }

        if (editingPaymentId) {
            // Mode Edit
            const idx = updatedHistory.findIndex(p => p.id === editingPaymentId);
            if (idx >= 0) {
                updatedHistory[idx] = {
                    ...updatedHistory[idx],
                    date: newPaymentDate,
                    amount: newPaymentAmount,
                    note: paymentNote
                };
            } else if (editingPaymentId === 'legacy-payment') {
                // Handle editing the virtual legacy payment
                 updatedHistory = updatedHistory.map(p => p.id === 'legacy-payment' ? {
                    id: 'legacy-payment', // Keep ID or gen new one
                    date: newPaymentDate,
                    amount: newPaymentAmount,
                    note: paymentNote
                 } : p);
            }
        } else {
            // Mode Tambah
            const newPayment: PaymentRecord = {
                id: Math.random().toString(36).substr(2, 9),
                date: newPaymentDate,
                amount: newPaymentAmount,
                note: paymentNote
            };
            updatedHistory.push(newPayment);
        }

        // Recalculate totals
        const newTotalPaid = updatedHistory.reduce((acc, curr) => acc + curr.amount, 0);
        const newStatus = newTotalPaid >= grandTotal ? 'PAID' : 'UNPAID';

        const updatedInvoice: Invoice = {
            ...invoice,
            paymentHistory: updatedHistory,
            paymentAmount: newTotalPaid, 
            paymentDate: newPaymentDate, // Last edited date implies last activity
            status: newStatus
        };

        onUpdateInvoice(updatedInvoice);
        setIsPaymentModalOpen(false);
        setNewPaymentAmount(0);
        setPaymentNote('');
        setEditingPaymentId(null);
    };

    const handleDeletePayment = (paymentId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pembayaran ini?")) return;

        let updatedHistory = invoice.paymentHistory ? [...invoice.paymentHistory] : [];
        
        // Handle legacy case display
        if (updatedHistory.length === 0 && invoice.paymentAmount && invoice.paymentAmount > 0) {
             // If trying to delete the "Manual" legacy payment
             updatedHistory = []; // Clear it implies deleting the legacy amount
        } else {
             updatedHistory = updatedHistory.filter(p => p.id !== paymentId);
        }

        const newTotalPaid = updatedHistory.reduce((acc, curr) => acc + curr.amount, 0);
        const newStatus = newTotalPaid >= grandTotal ? 'PAID' : 'UNPAID';

        // Find the latest date from remaining history, or revert to invoice date
        const latestPayment = updatedHistory.length > 0 
            ? updatedHistory.reduce((prev, current) => (prev.date > current.date) ? prev : current) 
            : null;

        const updatedInvoice: Invoice = {
            ...invoice,
            paymentHistory: updatedHistory,
            paymentAmount: newTotalPaid,
            paymentDate: latestPayment ? latestPayment.date : '',
            status: newStatus
        };

        onUpdateInvoice(updatedInvoice);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto relative">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                         <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-800">Detail Invoice</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {invoice.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                            </span>
                         </div>
                        <p className="text-slate-500 text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onPrint} className="px-4 py-2 flex items-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition">
                        <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Cetak PDF</span>
                    </button>
                    <button onClick={onEdit} className="px-4 py-2 flex items-center gap-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                        <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Edit Invoice</span>
                    </button>
                    <button onClick={onDelete} className="px-4 py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition">
                        <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Hapus</span>
                    </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Ditagihkan Kepada</h3>
                                <p className="text-lg font-bold text-slate-800">{invoice.clientName}</p>
                                <p className="text-slate-600 text-sm mt-1 max-w-sm">{invoice.clientAddress}</p>
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Invoice</h3>
                                    <p className="font-semibold text-slate-700">{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                </div>
                                {invoice.dueDate && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jatuh Tempo</h3>
                                        <p className="font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Rincian Biaya</h3>
                            <table className="w-full text-sm mb-6">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left w-12">No</th>
                                        <th className="px-4 py-2 text-left">Deskripsi</th>
                                        <th className="px-4 py-2 text-right">Jumlah (IDR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items.map((item, idx) => {
                                        const { grossAmount } = calculateItemValues(item);
                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-slate-400 text-center align-top">{idx+1}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className="font-medium text-slate-700">{item.description}</span>
                                                    {item.isTaxed && <div className="text-[10px] text-slate-400 italic mt-0.5">Termasuk Gross Up PPH 21</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700 font-semibold align-top">
                                                    {new Intl.NumberFormat('id-ID').format(grossAmount)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            <div className="flex justify-end border-t border-slate-100 pt-4">
                                <div className="w-full md:w-1/2 space-y-2">
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Sub Total</span>
                                        <span className="font-bold text-slate-800 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subTotal)}</span>
                                    </div>
                                    {totalTax > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-red-600">Pajak PPH 21 (2.5%)</span>
                                            <span className="font-bold text-red-600 font-mono">({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalTax)})</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800 mt-2">
                                        <span className="text-base font-bold text-slate-800">TOTAL TAGIHAN</span>
                                        <span className="text-xl font-bold text-slate-900 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}</span>
                                    </div>
                                    
                                    {paymentAmount > 0 && (
                                        <div className="flex justify-between items-center pt-2 text-sm">
                                            <span className="text-slate-600">Sudah Dibayar</span>
                                            <span className="font-bold text-green-600 font-mono">({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentAmount)})</span>
                                        </div>
                                    )}
                                    
                                    {paymentAmount > 0 && remainingAmount > 0 && (
                                        <div className="flex justify-between items-center pt-2 text-sm font-bold text-red-600">
                                            <span>Sisa Tagihan</span>
                                            <span className="font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remainingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                         {invoice.notes && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Catatan / Info:</p>
                                <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Payment Menu (Replaces Info Status) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Banknote className="w-4 h-4"/> Menu Pembayaran
                            </h3>
                            {/* Allow adding payment only if not fully paid */}
                            {remainingAmount > 0 && (
                                <button 
                                    onClick={openAddPayment}
                                    className="text-[10px] bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1 transition"
                                >
                                    <Plus className="w-3 h-3" /> Tambah
                                </button>
                            )}
                        </div>

                        {/* Mini Stats in Payment Menu */}
                        <div className="p-5 bg-white border-b border-slate-100 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Tagihan</span>
                                <span className="font-bold text-slate-800 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Sudah Dibayar</span>
                                <span className="font-bold text-green-600 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentAmount)}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50">
                                <span className="font-bold text-slate-600">Sisa Kekurangan</span>
                                <span className="font-bold text-red-600 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remainingAmount)}</span>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="p-0">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                                        <th className="px-4 py-2 text-right font-medium">Jumlah</th>
                                        <th className="px-2 py-2 text-right w-16 font-medium">Aksi</th>
                                        <th className="px-2 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.paymentHistory && invoice.paymentHistory.length > 0 ? (
                                        invoice.paymentHistory.map((pay) => (
                                            <tr key={pay.id}>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {new Date(pay.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                                    {pay.note && <div className="text-[9px] text-slate-400 italic truncate max-w-[120px]">{pay.note}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                                                    {new Intl.NumberFormat('id-ID').format(pay.amount)}
                                                </td>
                                                <td className="px-2 py-3 text-right whitespace-nowrap">
                                                    <button 
                                                        onClick={() => openEditPayment(pay)}
                                                        className="text-slate-400 hover:text-blue-600 transition mr-2"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePayment(pay.id)}
                                                        className="text-slate-400 hover:text-red-600 transition"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </td>
                                                <td className="px-2 py-3 text-right">
                                                    <button 
                                                        onClick={() => printReceipt(invoice, pay)}
                                                        className="text-slate-400 hover:text-blue-600 transition"
                                                        title="Cetak Kwitansi"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : paymentAmount > 0 ? (
                                        <tr>
                                            <td className="px-4 py-3 text-slate-700">
                                                {invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString('id-ID') : '-'}
                                                <div className="text-[9px] text-slate-400">Manual</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                                                {new Intl.NumberFormat('id-ID').format(paymentAmount)}
                                            </td>
                                            {/* Allow deleting legacy payment by passing a specific flag or just handle it as part of edit/add flow via migration */}
                                            <td className="px-2 py-3 text-right">
                                                 <button 
                                                    onClick={() => handleDeletePayment('legacy-payment')}
                                                    className="text-slate-400 hover:text-red-600 transition"
                                                    title="Hapus Data Lama"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </td>
                                            <td></td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             </div>

             {/* MODAL TAMBAH / EDIT PEMBAYARAN */}
             {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {editingPaymentId ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pembayaran</label>
                                <input
                                    type="date"
                                    value={newPaymentDate}
                                    onChange={(e) => setNewPaymentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                                    <input 
                                        type="text" 
                                        value={new Intl.NumberFormat('id-ID').format(newPaymentAmount)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setNewPaymentAmount(Number(raw));
                                        }}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-lg font-semibold"
                                    />
                                </div>
                                {!editingPaymentId && (
                                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                        <span>Sisa Tagihan: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remainingAmount)}</span>
                                        <button 
                                            onClick={() => setNewPaymentAmount(remainingAmount)}
                                            className="text-primary-600 font-bold hover:underline"
                                        >
                                            Bayar Lunas
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="Contoh: DP Termin 1, Transfer BCA, dll."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleSavePayment}
                                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
        </div>
    )
};


const App = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State (Real-time synced)
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // UI State
  const [clientViewState, setClientViewState] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Document View State
  const [docViewState, setDocViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Deed View State
  const [deedViewState, setDeedViewState] = useState<'list' | 'create' | 'edit' | 'report_monthly' | 'report_alphabetical'>('list');
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deedSearchQuery, setDeedSearchQuery] = useState('');

  // Employee View State
  const [empViewState, setEmpViewState] = useState<'list' | 'add'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empSearchQuery, setEmpSearchQuery] = useState('');

  // Invoice View State
  const [invoiceViewState, setInvoiceViewState] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  
  // Settings State
  const [settings, setSettings] = useState<CompanySettings>({
      companyName: '',
      companyAddress: '',
      companyEmail: '',
      companyPhone: ''
  });

  // --- Derived Statistics ---
  const stats = useMemo(() => {
    const totalReceipts = documents.filter(d => d.type === 'RECEIPT').length;
    const totalDeliveries = documents.filter(d => d.type === 'DELIVERY').length;
    
    // Chart Data Generation (Last 6 Months)
    const chartData = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.getMonth(); // 0-11
        const yearKey = d.getFullYear();
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        const countClients = clients.filter(c => {
            const cd = new Date(c.createdAt);
            return cd.getMonth() === monthKey && cd.getFullYear() === yearKey;
        }).length;

        const countDeeds = deeds.filter(item => {
            const cd = new Date(item.deedDate);
            return cd.getMonth() === monthKey && cd.getFullYear() === yearKey;
        }).length;

        const countReceipts = documents.filter(item => {
            const cd = new Date(item.date);
            return item.type === 'RECEIPT' && cd.getMonth() === monthKey && cd.getFullYear() === yearKey;
        }).length;

        const countDeliveries = documents.filter(item => {
            const cd = new Date(item.date);
            return item.type === 'DELIVERY' && cd.getMonth() === monthKey && cd.getFullYear() === yearKey;
        }).length;

        chartData.push({
            month: label,
            clients: countClients,
            deeds: countDeeds,
            receipts: countReceipts,
            deliveries: countDeliveries
        });
    }

    return { totalReceipts, totalDeliveries, chartData };
  }, [clients, deeds, documents]);

  // --- Derived Invoice Statistics (Cashflow) ---
  const invoiceStats = useMemo(() => {
    // Filter invoices based on search query first
    const filteredList = invoices.filter(i => 
        i.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) || 
        i.clientName.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
    );

    let totalBilled = 0;
    let totalPaid = 0;
    
    filteredList.forEach(inv => {
        totalBilled += inv.totalAmount;
        // Use paymentHistory sum if available, else legacy paymentAmount
        const historySum = inv.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const paid = historySum > 0 ? historySum : (inv.paymentAmount || 0);
        totalPaid += paid;
    });

    const totalUnpaid = totalBilled - totalPaid;

    return { filteredList, totalBilled, totalPaid, totalUnpaid };
  }, [invoices, invoiceSearchQuery]);

  // --- Login Handler ---
  const handleLogin = (status: boolean) => {
    if (status) {
        localStorage.setItem('isLoggedIn', 'true');
        setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
  };

  // --- Real-time Subscriptions with Auth ---
  useEffect(() => {
    // Only subscribe to data if logged in
    if (!isAuthenticated) return;

    let unsubClients: (() => void) | undefined;
    let unsubDocs: (() => void) | undefined;
    let unsubDeeds: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubEmployees: (() => void) | undefined;
    let unsubInvoices: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;

    const initData = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Status: Signed in anonymously");
      } catch (error) {
        console.warn("Auth Warning: Login anonim gagal.", error);
      }

      try {
        unsubClients = subscribeClients((data) => setClients(data));
        unsubDocs = subscribeDocuments((data) => setDocuments(data));
        unsubDeeds = subscribeDeeds((data) => setDeeds(data));
        unsubEmployees = subscribeEmployees((data) => setEmployees(data));
        unsubInvoices = subscribeInvoices((data) => setInvoices(data));
        unsubExpenses = subscribeExpenses((data) => setExpenses(data));
        unsubSettings = subscribeSettings((data) => {
          setSettings(data);
          syncSettingsToLocalCache(data);
        });
      } catch (e) {
        console.error("Failed to subscribe to Firestore streams:", e);
      }
    };

    initData();

    return () => {
      if (unsubClients) unsubClients();
      if (unsubDocs) unsubDocs();
      if (unsubDeeds) unsubDeeds();
      if (unsubSettings) unsubSettings();
      if (unsubEmployees) unsubEmployees();
      if (unsubInvoices) unsubInvoices();
      if (unsubExpenses) unsubExpenses();
    };
  }, [isAuthenticated]);

  // --- Handlers ---
  const handleSaveClient = async (client: Client) => { try { await saveClient(client); setClientViewState('list'); } catch (e: any) { alert(e.message); } };
  const handleDeleteClient = async (id: string) => { if (window.confirm('Hapus data?')) { try { await deleteClient(id); if(selectedClient?.id === id) setSelectedClient(null); setClientViewState('list'); } catch (e: any) { alert(e.message); } } };
  const handleDirectAddClient = () => { setActiveTab('clients'); setClientViewState('add'); setSelectedClient(null); };
  const handleSaveDocument = async (doc: DocumentData) => { try { if (docViewState === 'edit') await updateDocument(doc); else await saveDocument(doc); alert('Tersimpan!'); setDocViewState('list'); } catch (e: any) { alert(e.message); } };
  const handleDeleteDocument = async (id: string) => { if (window.confirm('Hapus dokumen?')) { try { await deleteDocument(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveDeed = async (deed: Deed) => { try { await saveDeed(deed); alert('Tersimpan!'); setDeedViewState('list'); } catch (e: any) { alert(e.message); } }
  const handleDeleteDeed = async (id: string) => { if (window.confirm('Hapus akta?')) { try { await deleteDeed(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveEmployee = async (emp: Employee) => { try { await saveEmployee(emp); alert('Pegawai tersimpan!'); setEmpViewState('list'); } catch (e: any) { alert(e.message); } }
  const handleDeleteEmployee = async (id: string) => { if (window.confirm('Hapus pegawai?')) { try { await deleteEmployee(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveInvoice = async (inv: Invoice) => { try { await saveInvoice(inv); alert('Invoice tersimpan!'); setInvoiceViewState('list'); } catch (e: any) { alert(e.message); } }
  const handleDeleteInvoice = async (id: string) => { if (window.confirm('Hapus invoice?')) { try { await deleteInvoice(id); if (selectedInvoice?.id === id) { setSelectedInvoice(null); setInvoiceViewState('list'); } } catch (e: any) { alert(e.message); } } }
  const handleSaveExpense = async (exp: Expense) => { try { await saveExpense(exp); alert('Pengeluaran tersimpan!'); } catch (e: any) { alert(e.message); } }
  const handleDeleteExpense = async (id: string) => { try { await deleteExpense(id); } catch (e: any) { alert(e.message); } }
  const handleSaveSettings = async (e: React.FormEvent) => { e.preventDefault(); try { await saveSettings(settings); alert('Tersimpan!'); } catch (e: any) { alert(e.message); } };
  
  // Handler khusus untuk update payment dari Detail View
  const handleUpdateInvoicePayment = async (updatedInvoice: Invoice) => {
      try {
          await saveInvoice(updatedInvoice);
          // Karena pakai subscription real-time, state akan update otomatis via useEffect.
          // Tapi untuk responsivitas UI modal, kita update selectedInvoice juga
          setSelectedInvoice(updatedInvoice);
          alert("Pembayaran berhasil dicatat.");
      } catch (e: any) {
          alert("Gagal update pembayaran: " + e.message);
      }
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.type.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(empSearchQuery.toLowerCase()) || e.role.toLowerCase().includes(empSearchQuery.toLowerCase()));

  // Helper to format WhatsApp URL (Duplicate here for list view usage if needed, or inline)
  const getWaUrl = (number: string) => {
    let clean = number.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  // Document List Helper
  const DocumentList = ({ type }: { type: DocType }) => {
     const filteredDocs = documents
        .filter(d => d.type === type)
        .filter(d => d.clientName.toLowerCase().includes(docSearchQuery.toLowerCase()) || d.referenceNo.toLowerCase().includes(docSearchQuery.toLowerCase()));
     return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{type === 'RECEIPT' ? 'Riwayat Tanda Terima' : 'Riwayat Surat Jalan'}</h2>
                <button onClick={() => { setDocViewState('create'); setSelectedDocument(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"><Plus className="w-4 h-4" /> Buat Baru</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm" value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} /></div></div>
                <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">No. Ref</th><th className="px-6 py-3">Klien</th><th className="px-6 py-3">Petugas</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead><tbody>{filteredDocs.map(doc => (<tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-6 py-4">{new Date(doc.date).toLocaleDateString()}</td><td className="px-6 py-4 font-mono">{doc.referenceNo}</td><td className="px-6 py-4">{doc.clientName}</td><td className="px-6 py-4">{doc.officerName}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => printDocument(doc)} className="p-2 text-slate-400 hover:text-green-600"><Printer className="w-4 h-4" /></button><button onClick={() => { setSelectedDocument(doc); setDocViewState('edit'); }} className="p-2 text-slate-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
            </div>
        </div>
     )
  }

  // --- RENDER CONDITION ---
  if (!isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={(tab) => { 
            setActiveTab(tab); 
            setClientViewState('list'); setSelectedClient(null); 
            setDocViewState('list'); setSelectedDocument(null); 
            setDeedViewState('list'); setSelectedDeed(null); 
            setEmpViewState('list'); setSelectedEmployee(null); 
            setInvoiceViewState('list'); setSelectedInvoice(null);
        }}
        onLogout={handleLogout}
    >
      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && ( 
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Klien</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{clients.length}</h3>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Akta</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{deeds.length}</h3>
                    </div>
                    <div className="bg-violet-50 p-3 rounded-lg text-violet-600">
                        <ScrollText className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Tanda Terima</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalReceipts}</h3>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-green-600">
                        <FileCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Surat Jalan</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalDeliveries}</h3>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                        <Truck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Graphic Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-slate-800">Statistik Bulanan (6 Bulan Terakhir)</h3>
                </div>
                <div className="w-full">
                    <SimpleLineChart data={stats.chartData} />
                </div>
            </div>
        </div> 
      )}

      {activeTab === 'clients' && (<div className="space-y-6">{clientViewState === 'list' && (<><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Klien</h2><button onClick={() => { setClientViewState('add'); setSelectedClient(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex gap-2"><Plus className="w-4 h-4"/> Tambah Klien</button></div><div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border rounded-lg mb-4" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">Nama</th><th className="p-4">Kontak (WhatsApp)</th><th className="p-4">Tipe</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{filteredClients.map(c => (<tr key={c.id} className="border-b"><td className="p-4 font-bold">{c.name}</td><td className="p-4"><a href={getWaUrl(c.contactNumber)} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-green-600 hover:underline flex items-center gap-1 w-fit"><MessageCircle className="w-3 h-3"/>{c.contactNumber}</a></td><td className="p-4">{c.type}</td><td className="p-4 text-right"><button onClick={() => { setClientViewState('detail'); setSelectedClient(c); }} className="text-primary-600">Lihat</button></td></tr>))}</tbody></table></div></>)}{clientViewState === 'add' && <ClientForm onSave={handleSaveClient} onCancel={() => setClientViewState('list')} initialData={selectedClient || undefined} />}{clientViewState === 'detail' && selectedClient && <ClientDetail client={selectedClient} onBack={() => setClientViewState('list')} onEdit={() => setClientViewState('add')} onDelete={() => handleDeleteClient(selectedClient.id)} />}</div>)}

      {/* ... (Akta Tab remains same) ... */}
      {activeTab === 'akta' && (<div className="space-y-6">{deedViewState === 'list' ? (<><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Daftar Akta</h2><div className="flex gap-2"><button onClick={() => setDeedViewState('report_alphabetical')} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><ArrowDownAZ className="w-4 h-4" /> Laporan A-Z</button><button onClick={() => setDeedViewState('report_monthly')} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><BookOpen className="w-4 h-4" /> Laporan Bulanan</button><button onClick={() => { setDeedViewState('create'); setSelectedDeed(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm text-sm"><Plus className="w-4 h-4" /> Buat Akta Baru</button></div></div><div className="bg-white rounded-xl shadow-sm border border-slate-200"><div className="p-4 border-b"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border rounded-lg" value={deedSearchQuery} onChange={e => setDeedSearchQuery(e.target.value)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">No. Akta</th><th className="p-4">Judul</th><th className="p-4">Klien</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{deeds.filter(d => d.deedNumber.toLowerCase().includes(deedSearchQuery.toLowerCase()) || d.deedTitle.toLowerCase().includes(deedSearchQuery.toLowerCase()) || d.clientName.toLowerCase().includes(deedSearchQuery.toLowerCase())).map(d => (<tr key={d.id} className="border-b"><td className="p-4 font-bold">{d.deedNumber}</td><td className="p-4">{d.deedTitle}</td><td className="p-4">{d.clientName}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedDeed(d); setDeedViewState('edit'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteDeed(d.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>))}</tbody></table></div></div></>) : deedViewState === 'report_monthly' ? <DeedReport deeds={deeds} onBack={() => setDeedViewState('list')} /> : deedViewState === 'report_alphabetical' ? <DeedAlphabeticalReport deeds={deeds} onBack={() => setDeedViewState('list')} /> : <DeedForm clients={clients} onSave={handleSaveDeed} onCancel={() => setDeedViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDeed || undefined} />}</div>)}
      
      {/* INVOICE TAB */}
      {activeTab === 'invoice' && (
          <div className="space-y-6">
              {invoiceViewState === 'list' ? (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Daftar Invoice</h2>
                        <button onClick={() => { setInvoiceViewState('create'); setSelectedInvoice(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex gap-2"><Plus className="w-4 h-4"/> Buat Invoice</button>
                    </div>

                    {/* SUMMARY CARD (CASHFLOW) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalBilled)}</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg"><Wallet className="w-5 h-5 text-blue-600" /></div>
                             </div>
                             <p className="text-xs text-slate-500">Akumulasi semua invoice yang tampil</p>
                        </div>
                         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sudah Dibayar</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalPaid)}</p>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg"><Banknote className="w-5 h-5 text-green-600" /></div>
                             </div>
                             <p className="text-xs text-slate-500">Pemasukan yang telah diterima</p>
                        </div>
                         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Piutang</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalUnpaid)}</p>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg"><CreditCard className="w-5 h-5 text-red-600" /></div>
                             </div>
                             <p className="text-xs text-slate-500">Tagihan yang belum dilunasi</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <input type="text" placeholder="Cari No Invoice atau Nama Klien..." className="w-full px-4 py-2 border rounded-lg mb-4" value={invoiceSearchQuery} onChange={e => setInvoiceSearchQuery(e.target.value)} />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">No. Invoice</th>
                                        <th className="p-4">Klien</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 text-right">Sisa Tagihan</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceStats.filteredList.map(inv => {
                                        // Calculate per row
                                        const historySum = inv.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                        const paid = historySum > 0 ? historySum : (inv.paymentAmount || 0);
                                        const remaining = Math.max(0, inv.totalAmount - paid);

                                        return (
                                        <tr key={inv.id} className="border-b hover:bg-slate-50">
                                            <td className="p-4">{new Date(inv.date).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => { setSelectedInvoice(inv); setInvoiceViewState('detail'); }}
                                                    className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {inv.invoiceNumber}
                                                </button>
                                            </td>
                                            <td className="p-4">{inv.clientName}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {inv.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-700">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.totalAmount)}
                                            </td>
                                            <td className="p-4 text-right font-mono text-red-600">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remaining)}
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => printInvoice(inv)} className="p-2 text-slate-400 hover:text-green-600"><Printer className="w-4 h-4" /></button>
                                                <button onClick={() => { setSelectedInvoice(inv); setInvoiceViewState('edit'); }} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                                {/* TABLE FOOTER SUMMARY */}
                                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                    <tr>
                                        <td colSpan={4} className="p-4 text-right uppercase text-xs text-slate-500 tracking-wider">Grand Total (Halaman Ini)</td>
                                        <td className="p-4 text-right text-slate-800">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalBilled)}
                                        </td>
                                        <td className="p-4 text-right text-red-600">
                                             {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalUnpaid)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
              ) : invoiceViewState === 'detail' && selectedInvoice ? (
                 <InvoiceDetail 
                    invoice={selectedInvoice}
                    onBack={() => setInvoiceViewState('list')}
                    onEdit={() => setInvoiceViewState('edit')}
                    onDelete={() => handleDeleteInvoice(selectedInvoice.id)}
                    onPrint={() => printInvoice(selectedInvoice)}
                    onUpdateInvoice={handleUpdateInvoicePayment}
                 />
              ) : (
                <InvoiceGenerator 
                    clients={clients} 
                    existingInvoices={invoices}
                    onSave={handleSaveInvoice} 
                    onCancel={() => setInvoiceViewState('list')} 
                    onAddClient={handleDirectAddClient} 
                    initialData={selectedInvoice} 
                />
              )}
          </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <ExpenseTracker 
            expenses={expenses}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
        />
      )}

      {/* UPDATE: Pass 'documents' prop to Generator to enable Auto-Increment Logic */}
      {activeTab === 'receipt' && docViewState === 'list' && <DocumentList type="RECEIPT" />}
      {activeTab === 'receipt' && docViewState !== 'list' && <DocumentGenerator type="RECEIPT" clients={clients} employees={employees} documents={documents} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}
      
      {activeTab === 'delivery' && docViewState === 'list' && <DocumentList type="DELIVERY" />}
      {activeTab === 'delivery' && docViewState !== 'list' && <DocumentGenerator type="DELIVERY" clients={clients} employees={employees} documents={documents} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}

      {activeTab === 'employees' && (
          <div className="space-y-6">
              {empViewState === 'list' ? (
                  <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Pegawai</h2><button onClick={() => { setEmpViewState('add'); setSelectedEmployee(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex gap-2"><Plus className="w-4 h-4"/> Tambah Pegawai</button></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari pegawai..." className="w-full px-4 py-2 border rounded-lg mb-4" value={empSearchQuery} onChange={e => setEmpSearchQuery(e.target.value)} />
                        <table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">Nama</th><th className="p-4">Jabatan</th><th className="p-4">Telepon</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>
                            {filteredEmployees.map(e => (<tr key={e.id} className="border-b"><td className="p-4 font-medium">{e.name}</td><td className="p-4">{e.role}</td><td className="p-4">{e.phone}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedEmployee(e); setEmpViewState('add'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteEmployee(e.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>))}
                        </tbody></table>
                    </div>
                  </>
              ) : (
                  <EmployeeForm onSave={handleSaveEmployee} onCancel={() => setEmpViewState('list')} initialData={selectedEmployee || undefined} />
              )}
          </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
            <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="space-y-4">
                    <div><label className="text-sm">Nama</label><input type="text" value={settings.companyName} onChange={e=>setSettings({...settings, companyName:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-sm">Alamat</label><textarea value={settings.companyAddress} onChange={e=>setSettings({...settings, companyAddress:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-sm">Email</label><input type="text" value={settings.companyEmail} onChange={e=>setSettings({...settings, companyEmail:e.target.value})} className="w-full border p-2 rounded"/></div><div><label className="text-sm">Telp</label><input type="text" value={settings.companyPhone} onChange={e=>setSettings({...settings, companyPhone:e.target.value})} className="w-full border p-2 rounded"/></div></div>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded mt-4">Simpan</button>
                </div>
            </form>
        </div>
      )}
    </Layout>
  );
};

export default App;
