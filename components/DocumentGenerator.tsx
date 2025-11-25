import React, { useState, useEffect } from 'react';
import { Client, DocType, DocumentData, DocumentItem } from '../types';
import { Printer, Search, Calendar, User, FileCheck, Package, Plus, Trash2, Save, ArrowLeft, UserPlus } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

// ... (printDocument function tetap sama) ...
export const printDocument = (docData: DocumentData) => {
    // ... [KODE PRINTDOCUMENT SAMA SEPERTI SEBELUMNYA] ...
    const { type, referenceNo, date, clientName, clientPic, officerName, items, destination } = docData;
    const title = type === 'RECEIPT' ? 'TANDA TERIMA BERKAS' : 'SURAT JALAN DOKUMEN';
    const docTitle = `${type === 'RECEIPT' ? 'Tanda_Terima' : 'Surat_Jalan'}_${referenceNo.replace(/\//g, '-')}`;
    const settings = getCachedSettings();
    const companyName = settings.companyName;
    const companyAddress = settings.companyAddress;
    const companyContact = `Email: ${settings.companyEmail} | Telp: ${settings.companyPhone}`;
    const clientDisplayName = clientPic 
        ? `<span>${clientPic}</span><br/><span class="text-sm font-normal text-slate-600">(${clientName})</span>` 
        : clientName;
    const fromData = type === 'RECEIPT' ? { name: clientDisplayName } : { name: companyName };
    const toData = type === 'RECEIPT' ? { name: companyName } : { name: clientDisplayName };
    const rightBoxLabel = type === 'DELIVERY' ? 'UNTUK' : 'PENERIMA';
    const rightSignatureName = type === 'DELIVERY' ? '&nbsp;' : officerName;
    
    const printContent = `
      <!DOCTYPE html><html><head><title>${docTitle}</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>
      body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
      
      /* ATURAN HALAMAN A4 */
      @page { 
        size: A4; 
        margin: 0; /* Reset margin browser */
      }
      
      @media print { 
        .no-print { display: none; } 
        body { 
            -webkit-print-color-adjust: exact; 
            margin: 0;
            padding: 15mm; /* Padding halaman manual */
            height: 100vh; /* Paksa tinggi fit viewport cetak */
            overflow: hidden; /* Hindari scrollbar tercetak sebagai halaman baru */
        } 
        
        /* Skala konten jika terlalu banyak item */
        .content-wrapper {
            transform-origin: top center;
        }
      }
      </style></head><body class="bg-white text-slate-900">
      
      <div class="content-wrapper max-w-[21cm] mx-auto relative h-full">
        
        <div class="flex items-center justify-between border-b-4 border-slate-800 pb-3 mb-4">
            <div class="flex items-center gap-4">
                <div>
                    <h1 class="text-xl font-bold text-slate-800 tracking-tight">${companyName}</h1>
                    <p class="text-xs text-slate-600 max-w-md leading-tight">${companyAddress}</p>
                    <p class="text-[10px] text-slate-500 mt-1">${companyContact}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Dokumen Digital</p>
                <p class="font-mono text-sm font-bold text-slate-600">${referenceNo}</p>
            </div>
        </div>

        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-slate-900 uppercase underline underline-offset-4 decoration-2 decoration-slate-400">${title}</h2>
            <p class="text-slate-500 mt-1 text-xs">Tanggal: ${new Date(date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="bg-slate-50 p-3 border border-slate-200 rounded-lg">
                <p class="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">PENGIRIM</p>
                <p class="font-bold text-base text-slate-800 leading-tight">${fromData.name}</p>
            </div>
            <div class="bg-slate-50 p-3 border border-slate-200 rounded-lg">
                <p class="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">${rightBoxLabel}</p>
                <p class="font-bold text-base text-slate-800 leading-tight">${toData.name}</p>
                ${type === 'DELIVERY' && destination ? `<p class="text-xs text-slate-600 mt-1 pt-1 border-t border-slate-200">Tujuan: ${destination}</p>` : ''}
            </div>
        </div>

        <div class="mb-6">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-slate-800 text-white text-xs">
                        <th class="py-1 px-2 text-center w-10 border border-slate-800 font-medium">No</th>
                        <th class="py-1 px-2 text-left border border-slate-800 font-medium">Deskripsi Berkas / Barang</th>
                        <th class="py-1 px-2 text-center w-24 border border-slate-800 font-medium">Keterangan</th>
                    </tr>
                </thead>
                <tbody class="text-slate-700">
                    ${items.map((item, idx) => `
                        <tr class="border-b border-slate-200">
                            <td class="py-2 px-2 text-center border-l border-r border-slate-200">${idx + 1}</td>
                            <td class="py-2 px-2 border-r border-slate-200 font-medium leading-tight">${item.description}</td>
                            <td class="py-2 px-2 text-center border-r border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">${item.type}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                     <tr class="bg-slate-50">
                        <td colspan="3" class="py-1 px-2 border border-slate-200 text-[9px] text-slate-500 text-center italic">
                            Mohon diperiksa kembali kelengkapan dokumen saat diterima.
                        </td>
                     </tr>
                </tfoot>
            </table>
        </div>

        <div class="flex justify-between items-end mt-12 px-4 break-inside-avoid">
            <div class="text-center w-48">
                <p class="mb-16 text-xs text-slate-600">Diserahkan Oleh,</p>
                <div class="border-b border-slate-800 mb-1"></div>
                <p class="font-bold text-slate-900 text-sm uppercase leading-tight">
                    ${type === 'RECEIPT' ? (clientPic || clientName) : officerName}
                </p>
                <p class="text-[9px] text-slate-400">Tanda Tangan & Nama Terang</p>
            </div>
            
            <div class="text-center w-48">
                <p class="mb-1 text-xs text-slate-600">${new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                <p class="mb-16 text-xs text-slate-600">Diterima Oleh,</p>
                <div class="border-b border-slate-800 mb-1"></div>
                <p class="font-bold text-slate-900 text-sm uppercase leading-tight">
                     ${rightSignatureName}
                </p>
                <p class="text-[9px] text-slate-400">Tanda Tangan & Stempel</p>
            </div>
        </div>
        
        <div class="fixed bottom-0 left-0 w-full text-center py-2 text-[8px] text-slate-300 border-t border-slate-100 no-print">
            Dokumen ini dicetak secara otomatis melalui Sistem Notaris Putri Office pada ${new Date().toLocaleString()}
        </div>

      </div>
      <script>
        // Auto-scale content if it overflows
        window.onload = () => {
            const wrapper = document.querySelector('.content-wrapper');
            if (wrapper.scrollHeight > 1050) { // Approximate A4 height in pixels at 96dpi (1123px) minus padding
                const scale = 1050 / wrapper.scrollHeight;
                wrapper.style.transform = 'scale(' + scale + ')';
                wrapper.style.width = (100 / scale) + '%';
            }
            setTimeout(() => { window.print(); }, 500);
        };
      </script>
      </body></html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
};

// --- Component ---

interface DocGeneratorProps {
  type: DocType;
  clients: Client[];
  onSave: (doc: DocumentData) => void;
  onCancel: () => void;
  onAddClient: () => void; 
  initialData?: DocumentData | null;
}

export const DocumentGenerator: React.FC<DocGeneratorProps> = ({ type, clients, onSave, onCancel, onAddClient, initialData }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [docItems, setDocItems] = useState<DocumentItem[]>([
    { description: '', type: 'Asli' }
  ]);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [officerName, setOfficerName] = useState('');
  const [refNo, setRefNo] = useState('');
  const [destination, setDestination] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setSelectedClientId(initialData.clientId);
      setDocItems(initialData.items);
      setDate(initialData.date);
      setOfficerName(initialData.officerName);
      setRefNo(initialData.referenceNo);
      if (initialData.destination) setDestination(initialData.destination);
    } else {
      // Set default ref no for new doc
      setRefNo(`DOC/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`);
    }
  }, [initialData]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const addItem = () => {
    setDocItems([...docItems, { description: '', type: 'Asli' }]);
  };

  const removeItem = (index: number) => {
    if (docItems.length > 1) {
      setDocItems(docItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: string) => {
    const newItems = [...docItems];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setDocItems(newItems);
  };

  const constructDocumentData = (): DocumentData | null => {
    if (!selectedClientId) return null;
    
    const clientName = selectedClient?.name || initialData?.clientName || "Unknown Client";
    const clientPic = selectedClient?.picName || initialData?.clientPic || "";
    const clientAddress = selectedClient?.address || initialData?.clientAddress || "";
    const clientContact = selectedClient?.contactNumber || initialData?.clientContact || "";

    const validItems = docItems.filter(i => i.description.trim() !== '');
    if (validItems.length === 0) {
        alert("Mohon isi setidaknya satu berkas.");
        return null;
    }

    const baseDocData: DocumentData = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        type,
        clientId: selectedClientId,
        clientName,
        clientPic, 
        clientAddress,
        clientContact,
        items: validItems,
        date,
        officerName,
        referenceNo: refNo,
    };

    if (type === 'DELIVERY') {
        baseDocData.destination = destination;
    }

    return baseDocData;
  };

  const handleSaveOnly = () => {
    const docData = constructDocumentData();
    if (docData) {
        onSave(docData);
    }
  };

  const handlePrint = () => {
    const docData = constructDocumentData();
    if (docData) {
        onSave(docData); // Auto save when printing
        printDocument(docData);
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
            <div className={`p-2 rounded-lg ${type === 'RECEIPT' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {type === 'RECEIPT' ? <FileCheck className="w-6 h-6" /> : <Package className="w-6 h-6" />}
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">
                    {initialData ? 'Edit' : 'Buat'} {type === 'RECEIPT' ? 'Tanda Terima' : 'Surat Jalan'}
                </h2>
                <p className="text-sm text-slate-500">{initialData ? 'Perbarui data dokumen' : 'Isi formulir baru'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
            {/* Client Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Klien</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white"
                        disabled={!!initialData} // Lock client on edit
                    >
                        <option value="">-- Pilih Klien dari Database --</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name} {client.picName ? `(${client.picName})` : ''} - {client.type}</option>
                        ))}
                    </select>
                </div>
                {/* Tombol Tambah Klien Cepat */}
                <button 
                    type="button"
                    onClick={onAddClient}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium mt-2 flex items-center gap-1 ml-1"
                >
                    <UserPlus className="w-3 h-3" />
                    Input Klien Baru
                </button>
            </div>

            {selectedClient && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-medium text-slate-900">{selectedClient?.name}</h3>
                    {selectedClient.picName && <p className="text-sm text-slate-700 font-medium">PIC: {selectedClient.picName}</p>}
                    <p className="text-sm text-slate-500">{selectedClient?.address}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Referensi</label>
                    <input
                        type="text"
                        value={refNo}
                        onChange={(e) => setRefNo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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

            {type === 'DELIVERY' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan Pengiriman</label>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={selectedClient?.address || "Masukkan alamat tujuan..."}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Biarkan kosong jika sama dengan alamat klien.</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {type === 'RECEIPT' ? 'Nama Petugas Penerima' : 'Nama Petugas Pengantar'}
                </label>
                <div className="relative">
                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* Dynamic Items List */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Daftar Berkas / Barang</label>
                <div className="space-y-3">
                    {docItems.map((item, index) => (
                        <div key={index} className="flex gap-3">
                            <span className="py-2 text-slate-400 font-mono text-sm w-6 text-center">{index + 1}.</span>
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Deskripsi berkas..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            />
                            <select
                                value={item.type}
                                onChange={(e) => updateItem(index, 'type', e.target.value as 'Asli' | 'Copy')}
                                className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                            >
                                <option value="Asli">Asli</option>
                                <option value="Copy">Copy</option>
                            </select>
                            {docItems.length > 1 && (
                                <button
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Hapus baris"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addItem}
                        className="ml-9 text-sm text-primary-600 font-medium hover:text-primary-800 flex items-center gap-1 py-1"
                    >
                        <Plus className="w-4 h-4" /> Tambah Baris
                    </button>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                 <button
                    onClick={handleSaveOnly}
                    disabled={!selectedClientId || !officerName || docItems.every(i => !i.description)}
                    className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    Simpan Data
                </button>

                <button
                    onClick={handlePrint}
                    disabled={!selectedClientId || !officerName || docItems.every(i => !i.description)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                >
                    <Printer className="w-5 h-5" />
                    Cetak PDF
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
