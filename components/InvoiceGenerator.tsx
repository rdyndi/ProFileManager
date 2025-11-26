
import React, { useState, useEffect } from 'react';
import { Client, Invoice, InvoiceItem } from '../types';
import { Printer, Search, Calendar, Plus, Trash2, Save, ArrowLeft, CreditCard } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

// --- Helper Rupiah Formatter ---
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// --- Standalone Print Function ---
export const printInvoice = (invoice: Invoice) => {
    const { invoiceNumber, date, clientName, clientAddress, items, totalAmount, notes, status } = invoice;
    const settings = getCachedSettings();
    const companyName = settings.companyName;
    const companyAddress = settings.companyAddress;
    const companyContact = `Email: ${settings.companyEmail} | Telp: ${settings.companyPhone}`;

    const printContent = `
      <!DOCTYPE html><html><head><title>Invoice - ${invoiceNumber}</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>
      body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
      @page { size: A4; margin: 10mm 15mm; } 
      @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; } }
      </style></head><body class="bg-white text-slate-900 p-4 max-w-[21cm] mx-auto relative">
        
        <div class="flex items-start justify-between border-b-4 border-slate-800 pb-6 mb-8">
            <div class="max-w-[60%]">
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight mb-2">${companyName}</h1>
                <p class="text-xs text-slate-600 leading-relaxed">${companyAddress}</p>
                <p class="text-xs text-slate-500 mt-1">${companyContact}</p>
            </div>
            <div class="text-right">
                <h2 class="text-3xl font-bold text-slate-800 uppercase tracking-widest text-primary-700">INVOICE</h2>
                <p class="text-sm font-medium text-slate-500 mt-1">#${invoiceNumber}</p>
                ${status === 'PAID' ? '<span class="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-200">LUNAS / PAID</span>' : '<span class="inline-block mt-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">BELUM LUNAS</span>'}
            </div>
        </div>

        <div class="grid grid-cols-2 gap-12 mb-10">
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">DITAGIHKAN KEPADA:</p>
                <h3 class="text-lg font-bold text-slate-800">${clientName}</h3>
                <p class="text-sm text-slate-600 mt-1 max-w-xs">${clientAddress}</p>
            </div>
            <div class="text-right">
                <div class="mb-2">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">TANGGAL INVOICE</p>
                    <p class="text-sm font-semibold text-slate-800">${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
        </div>

        <div class="mb-8">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-slate-800 text-white text-xs uppercase">
                        <th class="py-3 px-4 text-left rounded-tl-lg rounded-bl-lg w-16">No</th>
                        <th class="py-3 px-4 text-left">Deskripsi Layanan / Biaya</th>
                        <th class="py-3 px-4 text-right rounded-tr-lg rounded-br-lg w-48">Jumlah (IDR)</th>
                    </tr>
                </thead>
                <tbody class="text-slate-700 text-sm">
                    ${items.map((item, idx) => `
                        <tr class="border-b border-slate-100">
                            <td class="py-3 px-4 font-mono text-slate-500">${idx + 1}</td>
                            <td class="py-3 px-4 font-medium">${item.description}</td>
                            <td class="py-3 px-4 text-right font-mono font-semibold">${new Intl.NumberFormat('id-ID').format(item.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="flex justify-end mb-12">
            <div class="w-64">
                <div class="flex justify-between items-center py-3 border-t-2 border-slate-800">
                    <span class="text-base font-bold text-slate-800">TOTAL TAGIHAN</span>
                    <span class="text-xl font-bold text-slate-900">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 break-inside-avoid">
             <div>
                <h4 class="text-sm font-bold text-slate-800 mb-2">Catatan / Info Pembayaran:</h4>
                <p class="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    ${notes || "Mohon melakukan pembayaran sebelum tanggal jatuh tempo.\nTerima kasih atas kepercayaan Anda."}
                </p>
             </div>
             <div class="text-center">
                 <p class="mb-20 text-sm text-slate-600">Hormat Kami,</p>
                 <div class="border-b border-slate-800 w-48 mx-auto mb-2"></div>
                 <p class="font-bold text-slate-800 text-sm uppercase">${companyName}</p>
             </div>
        </div>
        
        <div class="fixed bottom-0 left-0 w-full text-center py-2 text-[8px] text-slate-300 no-print">
            Dicetak otomatis melalui Sistem Notaris Putri Office pada ${new Date().toLocaleString()}
        </div>

      </div>
      <script>
        setTimeout(() => { window.print(); }, 800);
      </script>
      </body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
};

interface InvoiceGeneratorProps {
  clients: Client[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  onAddClient: () => void;
  initialData?: Invoice | null;
  existingInvoices: Invoice[]; // To generate number
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ clients, onSave, onCancel, onAddClient, initialData, existingInvoices }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', amount: 0 }]);
  const [status, setStatus] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [notes, setNotes] = useState('');

  // Auto-generate number on mount
  useEffect(() => {
    if (initialData) {
        setSelectedClientId(initialData.clientId);
        setDate(initialData.date);
        setInvoiceNumber(initialData.invoiceNumber);
        setItems(initialData.items);
        setStatus(initialData.status);
        setNotes(initialData.notes || '');
    } else {
        const year = new Date().getFullYear();
        const count = existingInvoices.length + 1;
        setInvoiceNumber(`INV/${year}/${String(count).padStart(3, '0')}`);
    }
  }, [initialData, existingInvoices]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

  const constructInvoiceData = (): Invoice | null => {
    if (!selectedClientId) {
        alert("Pilih klien terlebih dahulu");
        return null;
    }
    
    if (items.some(i => !i.description || i.amount <= 0)) {
        alert("Mohon lengkapi deskripsi dan jumlah nominal (harus > 0) untuk setiap item.");
        return null;
    }

    const client = clients.find(c => c.id === selectedClientId);

    return {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        invoiceNumber,
        date,
        clientId: selectedClientId,
        clientName: client?.name || initialData?.clientName || "Unknown",
        clientAddress: client?.address || initialData?.clientAddress || "",
        items: items.map(i => ({...i, amount: Number(i.amount)})),
        totalAmount,
        status,
        notes,
        createdAt: initialData?.createdAt || Date.now()
    };
  };

  const handleSaveOnly = () => {
    const data = constructInvoiceData();
    if (data) onSave(data);
  };

  const handlePrint = () => {
    const data = constructInvoiceData();
    if (data) {
        onSave(data);
        printInvoice(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="mr-2 p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {initialData ? 'Edit Invoice' : 'Buat Invoice Baru'}
                        </h2>
                        <p className="text-sm text-slate-500">Kelola tagihan klien</p>
                    </div>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold font-mono">
                    Total: {formatRupiah(totalAmount)}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Klien</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                disabled={!!initialData}
                            >
                                <option value="">-- Pilih Klien --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                         <button onClick={onAddClient} className="text-xs text-primary-600 font-medium mt-2 ml-1">
                            + Input Klien Baru
                        </button>
                         {selectedClient && (
                            <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                {selectedClient.address}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Invoice</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Status Pembayaran</label>
                             <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'UNPAID' | 'PAID')}
                                className={`w-full px-3 py-2 border rounded-lg outline-none font-medium ${status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                             >
                                <option value="UNPAID">BELUM LUNAS (UNPAID)</option>
                                <option value="PAID">LUNAS (PAID)</option>
                             </select>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rincian Biaya</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 text-left w-12">No</th>
                                    <th className="px-4 py-2 text-left">Deskripsi</th>
                                    <th className="px-4 py-2 text-right w-48">Jumlah (Rp)</th>
                                    <th className="px-4 py-2 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 text-center text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                placeholder="Contoh: Jasa Pembuatan Akta..."
                                                className="w-full px-2 py-1 outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                                                className="w-full px-2 py-1 text-right outline-none border-b border-transparent focus:border-indigo-300 transition-colors font-mono"
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {items.length > 1 && (
                                                <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addItem} className="w-full py-2 bg-slate-50 text-slate-500 text-xs font-medium hover:bg-slate-100 border-t border-slate-100 flex items-center justify-center gap-1">
                            <Plus className="w-3 h-3" /> Tambah Baris
                        </button>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan / Info Rekening</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Masukkan informasi rekening bank atau catatan kaki untuk invoice..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button onClick={handleSaveOnly} className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Simpan
                    </button>
                    <button onClick={handlePrint} className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Cetak PDF
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
