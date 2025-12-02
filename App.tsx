
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
// import { LoginScreen } from './components/LoginScreen';
import { ClientForm } from './components/ClientForm';
import { EmployeeForm } from './components/EmployeeForm';
import { DocumentGenerator, printDocument } from './components/DocumentGenerator';
import { DeedForm } from './components/DeedForm';
import { DeedReport } from './components/DeedReport';
import { DeedAlphabeticalReport } from './components/DeedAlphabeticalReport';
import { InvoiceGenerator, printInvoice, calculateItemValues, printReceipt } from './components/InvoiceGenerator';
import { ExpenseTracker } from './components/ExpenseTracker';
import { ProfitLossReport } from './components/ProfitLossReport';
import { OutgoingMailBook } from './components/OutgoingMailBook';
import { IncomingMailBook } from './components/IncomingMailBook';
import { PPATCostCalculator } from './components/PPATCostCalculator';
import { TrackingJobBook } from './components/TrackingJobBook'; 
import { 
  subscribeClients, saveClient, deleteClient, 
  subscribeDocuments, saveDocument, updateDocument, deleteDocument,
  subscribeSettings, saveSettings, syncSettingsToLocalCache,
  subscribeDeeds, saveDeed, deleteDeed,
  subscribeEmployees, saveEmployee, deleteEmployee,
  subscribeInvoices, saveInvoice, deleteInvoice,
  subscribeExpenses, saveExpense, deleteExpense,
  subscribeOutgoingMails, saveOutgoingMail, deleteOutgoingMail,
  subscribeIncomingMails, saveIncomingMail, deleteIncomingMail,
  subscribePPATRecords, savePPATRecord, deletePPATRecord,
  subscribeTrackingJobs, saveTrackingJob, deleteTrackingJob
} from './services/storage';
// import { auth } from './services/firebaseService';
// import { signInAnonymously } from "firebase/auth";
import { Client, CompanySettings, DocumentData, DocType, Deed, Employee, Invoice, PaymentRecord, Expense, OutgoingMail, IncomingMail, PPATRecord, TrackingJob } from './types';
import { Users, Search, Plus, Trash2, FileText, Briefcase, Save, Pencil, Printer, ScrollText, BookOpen, ArrowDownAZ, ArrowLeft, UserCog, Link as LinkIcon, ExternalLink, MessageCircle, Mail, Truck, TrendingUp, CreditCard, Banknote, X, Wallet, Send, PieChart, Inbox, FileCheck, Calculator, ClipboardList } from 'lucide-react';

// --- Simple Custom SVG Line Chart Component ---
const SimpleLineChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data</div>;

  const height = 250;
  const width = 800;
  const padding = 40;
  
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.clients || 0, d.deeds || 0, d.receipts || 0, d.deliveries || 0))
  ) || 10;
  
  const scaleY = (val: number) => height - padding - (val / (maxValue * 1.1)) * (height - padding * 2);
  const scaleX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);

  const createPath = (key: string) => {
    return data.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d[key] || 0)}`
    ).join(' ');
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs">
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = height - padding - (tick * (height - padding * 2));
            return (
                <g key={i}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
                    <text x={0} y={y + 4} fill="#94a3b8" textAnchor="start">{Math.round(maxValue * 1.1 * tick)}</text>
                </g>
            );
        })}
        <path d={createPath('clients')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('deeds')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('receipts')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath('deliveries')} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <text key={i} x={scaleX(i)} y={height - 10} textAnchor="middle" fill="#64748b" className="font-medium">
            {d.month}
          </text>
        ))}
      </svg>
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
  if (!client) return null;
  const getWaUrl = (number: string) => {
    let clean = number.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
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
            <button onClick={onEdit} className="p-2 md:px-4 md:py-2 flex items-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition">
                <Pencil className="w-4 h-4" /> <span className="hidden md:inline">Edit</span>
            </button>
            <button onClick={onDelete} className="p-2 md:px-4 md:py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition">
                <Trash2 className="w-4 h-4" /> <span className="hidden md:inline">Hapus</span>
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
                            <a href={getWaUrl(client.contactNumber)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline w-fit">
                                <MessageCircle className="w-4 h-4" /> {client.contactNumber}
                            </a>
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</label>
                        <p className="font-medium text-slate-900 mt-1">{client.email}</p>
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
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
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
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

// ... InvoiceDetail component ...
const InvoiceDetail: React.FC<{
    invoice: Invoice;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPrint: () => void;
    onUpdateInvoice: (invoice: Invoice) => void; 
}> = ({ invoice, onBack, onEdit, onDelete, onPrint, onUpdateInvoice }) => {
    if (!invoice) return null;
    
    let subTotal = 0;
    let totalTax = 0;
    (invoice.items || []).forEach(item => {
        const { grossAmount, taxAmount } = calculateItemValues(item);
        subTotal += grossAmount;
        totalTax += taxAmount;
    });
    const grandTotal = subTotal - totalTax;
    
    const historyTotal = invoice.paymentHistory?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const paymentAmount = historyTotal > 0 ? historyTotal : (invoice.paymentAmount || 0);
    const remainingAmount = Math.max(0, grandTotal - paymentAmount);

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

    const handleSavePayment = () => {
        if (newPaymentAmount <= 0) {
            alert("Jumlah pembayaran harus lebih dari 0");
            return;
        }
        let updatedHistory = invoice.paymentHistory ? [...invoice.paymentHistory] : [];
        if (updatedHistory.length === 0 && invoice.paymentAmount && invoice.paymentAmount > 0) {
            updatedHistory.push({
                id: 'legacy-payment',
                date: invoice.paymentDate || invoice.date,
                amount: invoice.paymentAmount,
                note: 'Pembayaran Sebelumnya'
            });
        }
        if (editingPaymentId) {
            const idx = updatedHistory.findIndex(p => p.id === editingPaymentId);
            if (idx >= 0) {
                updatedHistory[idx] = { ...updatedHistory[idx], date: newPaymentDate, amount: newPaymentAmount, note: paymentNote };
            } else if (editingPaymentId === 'legacy-payment') {
                 updatedHistory = updatedHistory.map(p => p.id === 'legacy-payment' ? { id: 'legacy-payment', date: newPaymentDate, amount: newPaymentAmount, note: paymentNote } : p);
            }
        } else {
            updatedHistory.push({ id: Math.random().toString(36).substr(2, 9), date: newPaymentDate, amount: newPaymentAmount, note: paymentNote });
        }
        const newTotalPaid = updatedHistory.reduce((acc, curr) => acc + curr.amount, 0);
        const newStatus = newTotalPaid >= grandTotal ? 'PAID' : 'UNPAID';
        const updatedInvoice: Invoice = { ...invoice, paymentHistory: updatedHistory, paymentAmount: newTotalPaid, paymentDate: newPaymentDate, status: newStatus };
        onUpdateInvoice(updatedInvoice);
        setIsPaymentModalOpen(false);
    };

    const handleDeletePayment = (paymentId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pembayaran ini?")) return;
        let updatedHistory = invoice.paymentHistory ? [...invoice.paymentHistory] : [];
        if (updatedHistory.length === 0 && invoice.paymentAmount && invoice.paymentAmount > 0) {
             updatedHistory = [];
        } else {
             updatedHistory = updatedHistory.filter(p => p.id !== paymentId);
        }
        const newTotalPaid = updatedHistory.reduce((acc, curr) => acc + curr.amount, 0);
        const newStatus = newTotalPaid >= grandTotal ? 'PAID' : 'UNPAID';
        const updatedInvoice: Invoice = { ...invoice, paymentHistory: updatedHistory, paymentAmount: newTotalPaid, status: newStatus };
        onUpdateInvoice(updatedInvoice);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto relative pb-20 md:pb-0">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                         <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Detail Invoice</h2>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {invoice.status === 'PAID' ? 'LUNAS' : 'BELUM'}
                            </span>
                         </div>
                        <p className="text-slate-500 text-xs md:text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button onClick={onPrint} className="p-2 md:px-3 md:py-2 flex items-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-sm whitespace-nowrap"><Printer className="w-4 h-4" /> <span className="hidden md:inline">Cetak</span></button>
                    <button onClick={onEdit} className="p-2 md:px-3 md:py-2 flex items-center gap-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm whitespace-nowrap"><Pencil className="w-4 h-4" /> <span className="hidden md:inline">Edit</span></button>
                    <button onClick={onDelete} className="p-2 md:px-3 md:py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 text-sm whitespace-nowrap"><Trash2 className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ditagihkan Kepada</h3>
                                <p className="text-base font-bold text-slate-800">{invoice.clientName}</p>
                                <p className="text-slate-600 text-xs mt-1 max-w-sm">{invoice.clientAddress}</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Rincian Biaya</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm mb-6">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr><th className="px-4 py-2 text-left w-10">#</th><th className="px-4 py-2 text-left">Deskripsi</th><th className="px-4 py-2 text-right">Jumlah</th></tr>
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
                            </div>
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
                                        <span className="text-base font-bold text-slate-800">TOTAL</span>
                                        <span className="text-lg font-bold text-slate-900 font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}</span>
                                    </div>
                                    {paymentAmount > 0 && remainingAmount > 0 && (
                                        <div className="flex justify-between items-center pt-2 text-sm font-bold text-red-600">
                                            <span>Sisa</span>
                                            <span className="font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remainingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Banknote className="w-4 h-4"/> Pembayaran</h3>
                            {remainingAmount > 0 && (
                                <button onClick={openAddPayment} className="text-[10px] bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1 transition"><Plus className="w-3 h-3" /> Tambah</button>
                            )}
                        </div>
                        <div className="p-0">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                    <tr><th className="px-4 py-2 text-left font-medium">Tgl</th><th className="px-4 py-2 text-right font-medium">Jumlah</th><th className="px-2 py-2 text-right w-16 font-medium"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.paymentHistory && invoice.paymentHistory.length > 0 ? (
                                        invoice.paymentHistory.map((pay) => (
                                            <tr key={pay.id}>
                                                <td className="px-4 py-3 text-slate-700">{new Date(pay.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'numeric', year: '2-digit'})}</td>
                                                <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">{new Intl.NumberFormat('id-ID').format(pay.amount)}</td>
                                                <td className="px-2 py-3 text-right whitespace-nowrap">
                                                     <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleDeletePayment(pay.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                                        <button onClick={() => printReceipt(invoice, pay)} className="text-blue-400 hover:text-blue-600"><Printer className="w-3 h-3" /></button>
                                                     </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">Belum ada pembayaran.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
             </div>

             {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{editingPaymentId ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                <input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
                                <input type="text" value={new Intl.NumberFormat('id-ID').format(newPaymentAmount)} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setNewPaymentAmount(Number(raw)); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-bold" />
                                {!editingPaymentId && <button onClick={() => setNewPaymentAmount(remainingAmount)} className="text-xs text-primary-600 font-bold mt-1 hover:underline">Bayar Lunas: {new Intl.NumberFormat('id-ID').format(remainingAmount)}</button>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Batal</button>
                                <button onClick={handleSavePayment} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
        </div>
    )
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const getInitialTab = () => {
      const hash = window.location.hash.replace('#', '');
      return hash || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    const handlePopState = () => {
        const currentHash = window.location.hash.replace('#', '');
        setActiveTab(currentHash || 'dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
      if (activeTab === tabId) return;
      setActiveTab(tabId);
      window.history.pushState(null, '', `#${tabId}`);
      window.scrollTo(0, 0);

      setClientViewState('list'); setSelectedClient(null); 
      setDocViewState('list'); setSelectedDocument(null); 
      setDeedViewState('list'); setSelectedDeed(null); 
      setEmpViewState('list'); setSelectedEmployee(null); 
      setInvoiceViewState('list'); setSelectedInvoice(null);
  };
  
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outgoingMails, setOutgoingMails] = useState<OutgoingMail[]>([]);
  const [incomingMails, setIncomingMails] = useState<IncomingMail[]>([]);
  const [ppatRecords, setPpatRecords] = useState<PPATRecord[]>([]); 
  const [trackingJobs, setTrackingJobs] = useState<TrackingJob[]>([]); // New State
  
  const [clientViewState, setClientViewState] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docViewState, setDocViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [deedViewState, setDeedViewState] = useState<'list' | 'create' | 'edit' | 'report_monthly' | 'report_alphabetical'>('list');
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deedSearchQuery, setDeedSearchQuery] = useState('');
  const [empViewState, setEmpViewState] = useState<'list' | 'add'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [invoiceViewState, setInvoiceViewState] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [settings, setSettings] = useState<CompanySettings>({ companyName: '', companyAddress: '', companyEmail: '', companyPhone: '' });

  const stats = useMemo(() => {
    // Robust null checks for all arrays
    const safeDocs = documents || [];
    const safeMails = outgoingMails || [];
    const safeClients = clients || [];
    const safeDeeds = deeds || [];

    const totalReceipts = safeDocs.filter(d => d && d.type === 'RECEIPT').length;
    const totalDeliveries = safeDocs.filter(d => d && d.type === 'DELIVERY').length;
    const currentYear = new Date().getFullYear();
    const mailsThisYear = safeMails.filter(m => m && new Date(m.date).getFullYear() === currentYear);
    
    let lastMailNumber = '-';
    let nextMailNumber = '1';

    if (mailsThisYear.length > 0) {
        mailsThisYear.sort((a, b) => (parseInt(b.referenceNumber) || 0) - (parseInt(a.referenceNumber) || 0));
        const lastMail = mailsThisYear[0];
        lastMailNumber = lastMail.fullNumber;
        const maxNum = parseInt(lastMail.referenceNumber) || 0;
        nextMailNumber = (maxNum + 1).toString();
    }

    const chartData = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.getMonth();
        const yearKey = d.getFullYear();
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

        const countClients = safeClients.filter(c => { if(!c) return false; const cd = new Date(c.createdAt); return cd.getMonth() === monthKey && cd.getFullYear() === yearKey; }).length;
        const countDeeds = safeDeeds.filter(item => { if(!item) return false; const cd = new Date(item.deedDate); return cd.getMonth() === monthKey && cd.getFullYear() === yearKey; }).length;
        const countReceipts = safeDocs.filter(item => { if(!item) return false; const cd = new Date(item.date); return item.type === 'RECEIPT' && cd.getMonth() === monthKey && cd.getFullYear() === yearKey; }).length;
        const countDeliveries = safeDocs.filter(item => { if(!item) return false; const cd = new Date(item.date); return item.type === 'DELIVERY' && cd.getMonth() === monthKey && cd.getFullYear() === yearKey; }).length;

        chartData.push({ month: label, clients: countClients, deeds: countDeeds, receipts: countReceipts, deliveries: countDeliveries });
    }

    return { totalReceipts, totalDeliveries, chartData, lastMailNumber, nextMailNumber };
  }, [clients, deeds, documents, outgoingMails]);

  const invoiceStats = useMemo(() => {
    const safeInvoices = invoices || [];
    const filteredList = safeInvoices.filter(i => {
        if(!i) return false;
        const term = invoiceSearchQuery.toLowerCase();
        return (i.invoiceNumber || '').toLowerCase().includes(term) || (i.clientName || '').toLowerCase().includes(term);
    });
    let totalBilled = 0;
    let totalPaid = 0;
    filteredList.forEach(inv => {
        totalBilled += (inv.totalAmount || 0);
        const historySum = (inv.paymentHistory || []).reduce((sum, p) => sum + (p?.amount || 0), 0);
        const paid = historySum > 0 ? historySum : (inv.paymentAmount || 0);
        totalPaid += paid;
    });
    const totalUnpaid = totalBilled - totalPaid;
    return { filteredList, totalBilled, totalPaid, totalUnpaid };
  }, [invoices, invoiceSearchQuery]);

  const handleLogin = (status: boolean, username?: string) => {
    if (status) {
        localStorage.setItem('isLoggedIn', 'true');
        if (username) localStorage.setItem('currentUser', username);
        setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // if (!isAuthenticated) return; // Removed Auth check logic as it's disabled now
    // signInAnonymously(auth).catch((error) => console.warn("Auth Warning: Login anonim gagal.", error));

    const unsubClients = subscribeClients(setClients);
    const unsubDocs = subscribeDocuments(setDocuments);
    const unsubDeeds = subscribeDeeds(setDeeds);
    const unsubEmployees = subscribeEmployees(setEmployees);
    const unsubInvoices = subscribeInvoices(setInvoices);
    const unsubExpenses = subscribeExpenses(setExpenses);
    const unsubOutgoingMails = subscribeOutgoingMails(setOutgoingMails);
    const unsubIncomingMails = subscribeIncomingMails(setIncomingMails);
    const unsubPpat = subscribePPATRecords(setPpatRecords);
    const unsubTracking = subscribeTrackingJobs(setTrackingJobs); 
    const unsubSettings = subscribeSettings((data) => { setSettings(data); syncSettingsToLocalCache(data); });

    return () => {
      unsubClients(); unsubDocs(); unsubDeeds(); unsubSettings(); unsubEmployees(); unsubInvoices(); unsubExpenses(); unsubOutgoingMails(); unsubIncomingMails(); unsubPpat(); unsubTracking();
    };
  }, []);

  const handleSaveClient = async (client: Client) => { try { await saveClient(client); setClientViewState('list'); } catch (e: any) { alert(e.message); } };
  const handleDeleteClient = async (id: string) => { if (window.confirm('Hapus data?')) { try { await deleteClient(id); if(selectedClient?.id === id) setSelectedClient(null); setClientViewState('list'); } catch (e: any) { alert(e.message); } } };
  const handleDirectAddClient = () => { handleTabChange('clients'); setClientViewState('add'); setSelectedClient(null); };
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
  const handleSaveOutgoingMail = async (mail: OutgoingMail) => { try { await saveOutgoingMail(mail); alert('Surat keluar tersimpan!'); } catch (e: any) { alert(e.message); } }
  const handleDeleteOutgoingMail = async (id: string) => { try { await deleteOutgoingMail(id); } catch (e: any) { alert(e.message); } }
  const handleSaveIncomingMail = async (mail: IncomingMail) => { try { await saveIncomingMail(mail); alert('Surat masuk tersimpan!'); } catch (e: any) { alert(e.message); } }
  const handleDeleteIncomingMail = async (id: string) => { try { await deleteIncomingMail(id); } catch (e: any) { alert(e.message); } }
  const handleSaveSettings = async (e: React.FormEvent) => { e.preventDefault(); try { await saveSettings(settings); alert('Tersimpan!'); } catch (e: any) { alert(e.message); } };
  const handleUpdateInvoicePayment = async (updatedInvoice: Invoice) => { try { await saveInvoice(updatedInvoice); setSelectedInvoice(updatedInvoice); alert("Pembayaran berhasil dicatat."); } catch (e: any) { alert("Gagal update: " + e.message); } };
  
  // PPAT Handlers
  const handleSavePPATRecord = async (record: PPATRecord) => { try { await savePPATRecord(record); alert('Rincian tersimpan!'); } catch (e: any) { alert(e.message); } };
  const handleDeletePPATRecord = async (id: string) => { try { await deletePPATRecord(id); } catch (e: any) { alert(e.message); } };

  // Tracking Handlers
  const handleSaveTrackingJob = async (job: TrackingJob) => { try { await saveTrackingJob(job); alert('Pekerjaan tersimpan!'); } catch (e: any) { alert(e.message); } };
  const handleDeleteTrackingJob = async (id: string) => { try { await deleteTrackingJob(id); } catch (e: any) { alert(e.message); } };

  const filteredClients = (clients || []).filter(c => c && ((c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.type || '').toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredEmployees = (employees || []).filter(e => e && ((e.name || '').toLowerCase().includes(empSearchQuery.toLowerCase()) || (e.role || '').toLowerCase().includes(empSearchQuery.toLowerCase())));
  const getWaUrl = (number: string) => { let clean = number.replace(/\D/g, ''); if (clean.startsWith('0')) clean = '62' + clean.slice(1); return `https://wa.me/${clean}`; };

  const DocumentList = ({ type }: { type: DocType }) => {
     const safeDocs = documents || [];
     const filteredDocs = safeDocs.filter(d => d && d.type === type).filter(d => (d.clientName || '').toLowerCase().includes(docSearchQuery.toLowerCase()) || (d.referenceNo || '').toLowerCase().includes(docSearchQuery.toLowerCase()));
     return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{type === 'RECEIPT' ? 'Riwayat Tanda Terima' : 'Riwayat Surat Jalan'}</h2>
                <button onClick={() => { setDocViewState('create'); setSelectedDocument(null); }} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"><Plus className="w-4 h-4" /> <span className="hidden md:inline">Buat Baru</span></button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm bg-white text-slate-900" value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} /></div></div>
                <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 font-medium text-slate-500"><tr><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">No. Ref</th><th className="px-6 py-3">Klien</th><th className="px-6 py-3">Petugas</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead><tbody>{filteredDocs.map(doc => (<tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-6 py-4">{new Date(doc.date).toLocaleDateString()}</td><td className="px-6 py-4 font-mono">{doc.referenceNo}</td><td className="px-6 py-4">{doc.clientName}</td><td className="px-6 py-4">{doc.officerName}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => printDocument(doc)} className="p-2 text-slate-400 hover:text-green-600"><Printer className="w-4 h-4" /></button><button onClick={() => { setSelectedDocument(doc); setDocViewState('edit'); }} className="p-2 text-slate-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
            </div>
        </div>
     )
  }

  const defaultMobileFeatures = [
      { id: 'clients', label: 'Klien', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
      { id: 'tracking', label: 'Tracking', icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-100' }, // Added
      { id: 'akta', label: 'Akta', icon: ScrollText, color: 'text-violet-600', bg: 'bg-violet-100' },
      { id: 'adm_ppat', label: 'ADM PPAT', icon: Calculator, color: 'text-rose-600', bg: 'bg-rose-100' },
      { id: 'outgoing_mail', label: 'Surat Keluar', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { id: 'incoming_mail', label: 'Surat Masuk', icon: Inbox, color: 'text-cyan-600', bg: 'bg-cyan-100' },
      { id: 'invoice', label: 'Tagihan', icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-100' },
      { id: 'expenses', label: 'Biaya', icon: Wallet, color: 'text-red-600', bg: 'bg-red-100' },
      { id: 'reports', label: 'Laporan', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-100' },
      { id: 'receipt', label: 'Tanda Terima', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
      { id: 'delivery', label: 'Surat Jalan', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
      { id: 'employees', label: 'Pegawai', icon: UserCog, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  const [menuItems, setMenuItems] = useState(() => {
    try {
        const saved = localStorage.getItem('app_menu_order');
        if (saved) {
            const savedOrder = JSON.parse(saved);
            const merged = [...defaultMobileFeatures];
            merged.sort((a, b) => {
                const idxA = savedOrder.indexOf(a.id);
                const idxB = savedOrder.indexOf(b.id);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
            return merged;
        }
    } catch(e) {}
    return defaultMobileFeatures;
  });

  useEffect(() => { const ids = menuItems.map(m => m.id); localStorage.setItem('app_menu_order', JSON.stringify(ids)); }, [menuItems]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const longPressTimer = useRef<any>(null);

  const handleTouchStart = (index: number) => {
    longPressTimer.current = setTimeout(() => { setDraggingIndex(index); if (navigator.vibrate) navigator.vibrate(50); }, 500); 
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); setDraggingIndex(null); };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) { if (longPressTimer.current) clearTimeout(longPressTimer.current); return; }
    e.preventDefault(); 
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = target?.closest('button[data-menu-index]');
    if (button) {
        const targetIndex = parseInt(button.getAttribute('data-menu-index') || '-1');
        if (targetIndex !== -1 && targetIndex !== draggingIndex) {
            const newItems = [...menuItems];
            const itemDragged = newItems[draggingIndex];
            newItems.splice(draggingIndex, 1);
            newItems.splice(targetIndex, 0, itemDragged);
            setMenuItems(newItems);
            setDraggingIndex(targetIndex);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }
  };

  // if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />; // Auth Disabled

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout}>
      {activeTab === 'dashboard' && ( 
        <div className="space-y-6">
            <div className="md:hidden select-none">
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">Menu Utama</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {menuItems.map((item, index) => (
                        <button key={item.id} data-menu-index={index} onTouchStart={() => handleTouchStart(index)} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove} onClick={() => { if (draggingIndex === null) handleTabChange(item.id); }} className={`flex flex-col items-center gap-2 transition-all duration-200 ${draggingIndex === index ? 'scale-110 opacity-80 z-50' : ''}`} style={{ touchAction: draggingIndex !== null ? 'none' : 'auto' }}>
                            <div className={`${item.bg} p-3.5 rounded-2xl shadow-sm transition-transform duration-200 ${draggingIndex === index ? 'shadow-lg ring-2 ring-primary-300 ring-offset-2' : 'active:scale-95'}`}><item.icon className={`w-6 h-6 ${item.color}`} /></div>
                            <span className="text-[11px] font-medium text-slate-700 text-center leading-tight line-clamp-2 min-h-[2.5em]">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Ringkasan</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <div onClick={() => handleTabChange('clients')} className="bg-blue-50 p-4 md:p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-95"><div><p className="text-[10px] md:text-sm text-blue-600 font-medium uppercase">Klien</p><h3 className="text-xl md:text-3xl font-bold text-blue-800 mt-1">{clients.length}</h3></div><div className="bg-white p-2 md:p-3 rounded-lg text-blue-600 shadow-sm"><Users className="w-5 h-5 md:w-6 md:h-6" /></div></div>
                <div className="bg-violet-50 p-4 md:p-6 rounded-xl shadow-sm border border-violet-100 flex items-center justify-between"><div><p className="text-[10px] md:text-sm text-violet-600 font-medium uppercase">Akta</p><h3 className="text-xl md:text-3xl font-bold text-violet-800 mt-1">{deeds.length}</h3></div><div className="bg-white p-2 md:p-3 rounded-lg text-violet-600 shadow-sm"><ScrollText className="w-5 h-5 md:w-6 md:h-6" /></div></div>
                <div className="bg-green-50 p-4 md:p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between"><div><p className="text-[10px] md:text-sm text-green-600 font-medium uppercase">Tanda Terima</p><h3 className="text-xl md:text-3xl font-bold text-green-800 mt-1">{stats.totalReceipts}</h3></div><div className="bg-white p-2 md:p-3 rounded-lg text-green-600 shadow-sm"><FileCheck className="w-5 h-5 md:w-6 md:h-6" /></div></div>
                <div className="bg-orange-50 p-4 md:p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between"><div><p className="text-[10px] md:text-sm text-orange-600 font-medium uppercase">Surat Jalan</p><h3 className="text-xl md:text-3xl font-bold text-orange-800 mt-1">{stats.totalDeliveries}</h3></div><div className="bg-white p-2 md:p-3 rounded-lg text-orange-600 shadow-sm"><Truck className="w-5 h-5 md:w-6 md:h-6" /></div></div>
                <div className="bg-indigo-50 p-4 md:p-6 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between"><div><p className="text-[10px] md:text-sm text-indigo-600 font-medium uppercase">Surat Keluar</p><div className="flex flex-col mt-1"><span className="text-sm md:text-base font-bold text-indigo-800">Next: {stats.nextMailNumber}</span><span className="text-[10px] text-indigo-400 truncate max-w-[100px]" title={stats.lastMailNumber}>Last: {stats.lastMailNumber}</span></div></div><div className="bg-white p-2 md:p-3 rounded-lg text-indigo-600 shadow-sm"><Send className="w-5 h-5 md:w-6 md:h-6" /></div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hidden md:block">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4"><TrendingUp className="w-5 h-5 text-primary-600" /><h3 className="text-lg font-bold text-slate-800">Statistik Bulanan (6 Bulan Terakhir)</h3></div>
                <div className="w-full"><SimpleLineChart data={stats.chartData} /></div>
            </div>
        </div> 
      )}
      
      {activeTab === 'clients' && (
        <div className="space-y-6">
            {clientViewState === 'list' && (
                <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Klien</h2><button onClick={() => { setClientViewState('add'); setSelectedClient(null); }} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg flex gap-2 text-sm items-center hover:bg-primary-700 transition"><Plus className="w-4 h-4"/> <span className="hidden md:inline">Tambah</span></button></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 text-slate-700"><tr><th className="p-4">Nama</th><th className="p-4 hidden md:table-cell">Kontak</th><th className="p-4 hidden md:table-cell">Tipe</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{filteredClients.map(c => {
                        if (!c) return null;
                        return (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-bold text-slate-800"><div>{c.name}</div><div className="md:hidden text-xs font-normal text-slate-500">{c.type}</div></td><td className="p-4 hidden md:table-cell"><a href={getWaUrl(c.contactNumber)} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-green-600 hover:underline flex items-center gap-1 w-fit"><MessageCircle className="w-3 h-3"/>{c.contactNumber}</a></td><td className="p-4 hidden md:table-cell">{c.type}</td><td className="p-4 text-right"><button onClick={() => { setClientViewState('detail'); setSelectedClient(c); }} className="text-primary-600 text-xs bg-primary-50 px-3 py-1 rounded-full hover:bg-primary-100">Lihat</button></td></tr>)
                    })}</tbody></table></div>
                </>
            )}
            {clientViewState === 'add' && <ClientForm onSave={handleSaveClient} onCancel={() => setClientViewState('list')} initialData={selectedClient || undefined} />}
            {clientViewState === 'detail' && selectedClient && <ClientDetail client={selectedClient} onBack={() => setClientViewState('list')} onEdit={() => setClientViewState('add')} onDelete={() => handleDeleteClient(selectedClient.id)} />}
        </div>
      )}

      {/* TRACKING PEKERJAAN TAB */}
      {activeTab === 'tracking' && <TrackingJobBook jobs={trackingJobs || []} clients={clients || []} onSave={handleSaveTrackingJob} onDelete={handleDeleteTrackingJob} />}

      {activeTab === 'akta' && (
        <div className="space-y-6">
            {deedViewState === 'list' ? (
                <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Daftar Akta</h2>
                    <div className="flex gap-2"><button onClick={() => setDeedViewState('report_alphabetical')} className="bg-white border border-slate-300 text-slate-700 p-2 md:px-3 md:py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><ArrowDownAZ className="w-4 h-4" /> <span className="hidden md:inline">A-Z</span></button><button onClick={() => setDeedViewState('report_monthly')} className="bg-white border border-slate-300 text-slate-700 p-2 md:px-3 md:py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Laporan</span></button><button onClick={() => { setDeedViewState('create'); setSelectedDeed(null); }} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm text-sm"><Plus className="w-4 h-4" /> <span className="hidden md:inline">Baru</span></button></div></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200"><div className="p-4 border-b border-slate-100"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary-500" value={deedSearchQuery} onChange={e => setDeedSearchQuery(e.target.value)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 text-slate-700"><tr><th className="p-4">No. Akta</th><th className="p-4">Judul</th><th className="p-4 hidden md:table-cell">Klien</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{(deeds || []).filter(d => d && ((d.deedNumber || '').toLowerCase().includes(deedSearchQuery.toLowerCase()) || (d.deedTitle || '').toLowerCase().includes(deedSearchQuery.toLowerCase()) || (d.clientName || '').toLowerCase().includes(deedSearchQuery.toLowerCase()))).map(d => (<tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-bold font-mono text-slate-800">{d.deedNumber}</td><td className="p-4"><div className="line-clamp-2">{d.deedTitle}</div><div className="md:hidden text-xs text-slate-500 mt-1">{d.clientName}</div></td><td className="p-4 hidden md:table-cell">{d.clientName}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedDeed(d); setDeedViewState('edit'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteDeed(d.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>))}</tbody></table></div></div>
                </>
            ) : deedViewState === 'report_monthly' ? <DeedReport deeds={deeds || []} onBack={() => setDeedViewState('list')} /> : deedViewState === 'report_alphabetical' ? <DeedAlphabeticalReport deeds={deeds || []} onBack={() => setDeedViewState('list')} /> : <DeedForm clients={clients || []} deeds={deeds || []} onSave={handleSaveDeed} onCancel={() => setDeedViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDeed || undefined} />}
        </div>
      )}
      
      {activeTab === 'invoice' && (
          <div className="space-y-6">
              {invoiceViewState === 'list' ? (
                <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Daftar Invoice</h2><button onClick={() => { setInvoiceViewState('create'); setSelectedInvoice(null); }} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg flex gap-2 text-sm items-center hover:bg-primary-700 transition"><Plus className="w-4 h-4"/> <span className="hidden md:inline">Buat Invoice</span></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-2 md:pb-0">
                        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 min-w-[240px]"><div className="flex justify-between items-start mb-2"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</p><p className="text-lg md:text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalBilled)}</p></div><div className="p-2 bg-blue-50 rounded-lg"><Wallet className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div></div></div>
                        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500 min-w-[240px]"><div className="flex justify-between items-start mb-2"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sudah Dibayar</p><p className="text-lg md:text-2xl font-bold text-green-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalPaid)}</p></div><div className="p-2 bg-green-50 rounded-lg"><Banknote className="w-4 h-4 md:w-5 md:h-5 text-green-600" /></div></div></div>
                        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500 min-w-[240px]"><div className="flex justify-between items-start mb-2"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Piutang</p><p className="text-lg md:text-2xl font-bold text-red-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceStats.totalUnpaid)}</p></div><div className="p-2 bg-red-50 rounded-lg"><CreditCard className="w-4 h-4 md:w-5 md:h-5 text-red-600" /></div></div></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary-500" value={invoiceSearchQuery} onChange={e => setInvoiceSearchQuery(e.target.value)} />
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 text-slate-700"><tr><th className="p-4 hidden md:table-cell">Tanggal</th><th className="p-4">No. Invoice</th><th className="p-4 hidden md:table-cell">Klien</th><th className="p-4 hidden md:table-cell">Status</th><th className="p-4 text-right">Sisa Tagihan</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{invoiceStats.filteredList.map(inv => { 
                            if (!inv) return null;
                            const historySum = (inv.paymentHistory || []).reduce((sum, p) => sum + (p?.amount || 0), 0); 
                            const paid = historySum > 0 ? historySum : (inv.paymentAmount || 0); 
                            const remaining = Math.max(0, inv.totalAmount - paid); 
                            return (<tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 hidden md:table-cell">{new Date(inv.date).toLocaleDateString()}</td><td className="p-4"><button onClick={() => { setSelectedInvoice(inv); setInvoiceViewState('detail'); }} className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline">{inv.invoiceNumber}</button><div className="md:hidden text-xs text-slate-500 mt-1">{inv.clientName}</div><div className="md:hidden mt-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{inv.status === 'PAID' ? 'LUNAS' : 'BELUM'}</span></div></td><td className="p-4 hidden md:table-cell">{inv.clientName}</td><td className="p-4 hidden md:table-cell"><span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{inv.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}</span></td><td className="p-4 text-right font-mono text-red-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remaining)}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedInvoice(inv); setInvoiceViewState('edit'); }} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)})}</tbody></table></div>
                    </div>
                </>
              ) : invoiceViewState === 'detail' && selectedInvoice ? (
                 <InvoiceDetail invoice={selectedInvoice} onBack={() => setInvoiceViewState('list')} onEdit={() => setInvoiceViewState('edit')} onDelete={() => handleDeleteInvoice(selectedInvoice.id)} onPrint={() => printInvoice(selectedInvoice)} onUpdateInvoice={handleUpdateInvoicePayment} />
              ) : (
                <InvoiceGenerator clients={clients || []} existingInvoices={invoices || []} onSave={handleSaveInvoice} onCancel={() => setInvoiceViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedInvoice} />
              )}
          </div>
      )}

      {activeTab === 'expenses' && <ExpenseTracker expenses={expenses || []} onSave={handleSaveExpense} onDelete={handleDeleteExpense} />}
      {activeTab === 'outgoing_mail' && <OutgoingMailBook mails={outgoingMails || []} onSave={handleSaveOutgoingMail} onDelete={handleDeleteOutgoingMail} />}
      {activeTab === 'incoming_mail' && <IncomingMailBook mails={incomingMails || []} onSave={handleSaveIncomingMail} onDelete={handleDeleteIncomingMail} />}
      
      {/* PPAT TAB */}
      {activeTab === 'adm_ppat' && <PPATCostCalculator records={ppatRecords || []} onSave={handleSavePPATRecord} onDelete={handleDeletePPATRecord} />}
      
      {activeTab === 'reports' && <ProfitLossReport invoices={invoices || []} expenses={expenses || []} />}

      {activeTab === 'receipt' && docViewState === 'list' && <DocumentList type="RECEIPT" />}
      {activeTab === 'receipt' && docViewState !== 'list' && <DocumentGenerator type="RECEIPT" clients={clients || []} employees={employees || []} documents={documents || []} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}
      
      {activeTab === 'delivery' && docViewState === 'list' && <DocumentList type="DELIVERY" />}
      {activeTab === 'delivery' && docViewState !== 'list' && <DocumentGenerator type="DELIVERY" clients={clients || []} employees={employees || []} documents={documents || []} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}

      {activeTab === 'employees' && (
          <div className="space-y-6">
              {empViewState === 'list' ? (
                  <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Pegawai</h2><button onClick={() => { setEmpViewState('add'); setSelectedEmployee(null); }} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg flex gap-2 text-sm items-center hover:bg-primary-700 transition"><Plus className="w-4 h-4"/> <span className="hidden md:inline">Tambah</span></button></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary-500" value={empSearchQuery} onChange={e => setEmpSearchQuery(e.target.value)} />
                        <table className="w-full text-sm text-left text-slate-600"><thead className="bg-slate-50 text-slate-700"><tr><th className="p-4">Nama</th><th className="p-4 hidden md:table-cell">Jabatan</th><th className="p-4 hidden md:table-cell">Telepon</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{filteredEmployees.map(e => {
                            if (!e) return null;
                            return (<tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-medium"><div>{e.name}</div><div className="md:hidden text-xs text-slate-500">{e.role}</div></td><td className="p-4 hidden md:table-cell">{e.role}</td><td className="p-4 hidden md:table-cell">{e.phone}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedEmployee(e); setEmpViewState('add'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteEmployee(e.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>)
                        })}</tbody></table>
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
                    <div><label className="text-sm text-slate-700 font-medium">Nama</label><input type="text" value={settings.companyName} onChange={e=>setSettings({...settings, companyName:e.target.value})} className="w-full border border-slate-300 p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"/></div>
                    <div><label className="text-sm text-slate-700 font-medium">Alamat</label><textarea value={settings.companyAddress} onChange={e=>setSettings({...settings, companyAddress:e.target.value})} className="w-full border border-slate-300 p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-sm text-slate-700 font-medium">Email</label><input type="text" value={settings.companyEmail} onChange={e=>setSettings({...settings, companyEmail:e.target.value})} className="w-full border border-slate-300 p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"/></div><div><label className="text-sm text-slate-700 font-medium">Telp</label><input type="text" value={settings.companyPhone} onChange={e=>setSettings({...settings, companyPhone:e.target.value})} className="w-full border border-slate-300 p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"/></div></div>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded mt-4 w-full md:w-auto hover:bg-primary-700 transition">Simpan</button>
                </div>
            </form>
            <button onClick={handleLogout} className="w-full md:hidden bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex justify-center items-center gap-2 font-medium hover:bg-red-100 transition"><X className="w-4 h-4" /> Keluar Aplikasi</button>
        </div>
      )}
    </Layout>
  );
};

export default App;
