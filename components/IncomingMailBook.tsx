
import React, { useState, useMemo } from 'react';
import { IncomingMail } from '../types';
import { Plus, Search, Trash2, X, Save, Inbox, Calendar, Mail, User, BookOpen, ArrowLeft, Printer } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface IncomingMailBookProps {
  mails: IncomingMail[];
  onSave: (mail: IncomingMail) => void;
  onDelete: (id: string) => void;
}

export const IncomingMailBook: React.FC<IncomingMailBookProps> = ({ mails, onSave, onDelete }) => {
  const [viewState, setViewState] = useState<'list' | 'report'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Report Filter State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Form State
  const [formData, setFormData] = useState<Partial<IncomingMail>>({
    date: new Date().toISOString().split('T')[0],
    mailNumber: '',
    sender: '',
    subject: ''
  });

  // Filter Logic
  const filteredMails = useMemo(() => {
    return mails.filter(m => 
      m.mailNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mails, searchQuery]);

  // Report Data
  const reportData = useMemo(() => {
    return mails.filter(m => {
        const d = new Date(m.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [mails, selectedMonth, selectedYear]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.mailNumber || !formData.subject || !formData.sender) {
        alert("Mohon lengkapi semua data surat masuk.");
        return;
    }

    const mailToSave: IncomingMail = {
        id: formData.id || Math.random().toString(36).substr(2, 9),
        date: formData.date,
        mailNumber: formData.mailNumber, // Manual input
        sender: formData.sender,
        subject: formData.subject,
        createdAt: formData.createdAt || Date.now()
    };

    onSave(mailToSave);
    setIsFormOpen(false);
    setFormData({
        date: new Date().toISOString().split('T')[0],
        mailNumber: '',
        sender: '',
        subject: ''
    });
  };

  const handlePrintReport = () => {
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("Fitur PDF sedang dimuat. Silakan tunggu sebentar.");
        return;
    }

    const settings = getCachedSettings();
    const monthName = months[selectedMonth];
    
    // Signature Date (Next Month, 1st)
    let signMonthIndex = selectedMonth + 1;
    let signYear = selectedYear;
    if (signMonthIndex > 11) {
        signMonthIndex = 0;
        signYear = signYear + 1;
    }
    const signMonthName = months[signMonthIndex];
    const signatureDateStr = `01 ${signMonthName} ${signYear}`;

    // Rows Generation
    let rowsHtml = '';
    if (reportData.length > 0) {
        rowsHtml = reportData.map((m, idx) => `
            <tr>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">${idx + 1}</td>
                <td style="padding: 5px; border: 1px solid #000; text-align: center;">${new Date(m.date).toLocaleDateString('id-ID')}</td>
                <td style="padding: 5px; border: 1px solid #000;">${m.mailNumber}</td>
                <td style="padding: 5px; border: 1px solid #000;">${m.sender}</td>
                <td style="padding: 5px; border: 1px solid #000;">${m.subject}</td>
            </tr>
        `).join('');
    } else {
        // NIHIL State
        rowsHtml = `
            <tr>
                <td colspan="5" style="padding: 10px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2px;">NIHIL</td>
            </tr>
        `;
    }

    const content = `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #000;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${settings.companyName}</h1>
                <p style="font-size: 12px; margin-bottom: 10px;">${settings.companyAddress}</p>
                <h2 style="font-size: 14px; font-weight: bold; text-decoration: underline; margin-top: 15px;">BUKU AGENDA SURAT MASUK</h2>
                <p style="font-size: 12px; font-weight: bold;">Bulan: ${monthName} ${selectedYear}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f3f4f6; font-weight: bold; text-align: center;">
                        <th style="padding: 5px; border: 1px solid #000; width: 5%;">No</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 15%;">Tanggal Terima</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 25%;">Nomor Surat</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 20%;">Pengirim</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 35%;">Perihal</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
                 <div style="text-align: center; width: 40%;">
                    <p style="font-size: 12px; margin-bottom: 60px;">Bandung Barat, ${signatureDateStr}</p>
                    <p style="font-weight: bold; font-size: 12px; text-decoration: underline;">${settings.companyName.replace('Notaris/PPAT ', '')}</p>
                 </div>
            </div>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `Laporan_Surat_Masuk_${monthName}_${selectedYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().set(opt).from(content).save();
  };

  // --- REPORT VIEW RENDER ---
  if (viewState === 'report') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewState('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800">Laporan Surat Masuk</h2>
                </div>
                <button 
                    onClick={handlePrintReport}
                    className="bg-slate-800 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"
                >
                    <Printer className="w-4 h-4" /> <span className="hidden md:inline">Download PDF</span>
                </button>
            </div>

             {/* Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm min-w-[150px]"
                    >
                        {months.map((m, idx) => (<option key={idx} value={idx}>{m}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-center w-16">No</th>
                            <th className="px-6 py-3 text-center w-32">Tanggal</th>
                            <th className="px-6 py-3">Nomor Surat</th>
                            <th className="px-6 py-3">Pengirim</th>
                            <th className="px-6 py-3">Perihal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.length > 0 ? (
                            reportData.map((m, idx) => (
                                <tr key={m.id}>
                                    <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>
                                    <td className="px-6 py-3 text-center">{new Date(m.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-3 font-mono text-xs">{m.mailNumber}</td>
                                    <td className="px-6 py-3">{m.sender}</td>
                                    <td className="px-6 py-3">{m.subject}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center font-bold text-slate-400 bg-slate-50">
                                    NIHIL
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Buku Surat Masuk</h2>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setViewState('report')} 
                    className="bg-white border border-slate-300 text-slate-700 p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm"
                >
                    <BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Laporan</span>
                </button>
                <button 
                    onClick={() => setIsFormOpen(true)} 
                    className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Catat Surat Masuk</span>
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Cari nomor surat, pengirim, atau perihal..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500" 
                />
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 w-32">Tanggal Terima</th>
                            <th className="px-6 py-3 w-48">Nomor Surat</th>
                            <th className="px-6 py-3 w-48">Pengirim / Dari</th>
                            <th className="px-6 py-3">Perihal / Judul</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMails.length > 0 ? (
                            filteredMails.map(mail => (
                                <tr key={mail.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(mail.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                            {mail.mailNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {mail.sender || '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {mail.subject}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => { if(window.confirm('Hapus data surat masuk ini?')) onDelete(mail.id); }} 
                                            className="p-2 text-slate-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                    Belum ada data surat masuk.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal Form */}
        {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Inbox className="w-4 h-4 text-primary-600" /> Catat Surat Masuk
                        </h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Terima</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat (Manual)</label>
                                <input
                                    type="text"
                                    value={formData.mailNumber}
                                    onChange={(e) => setFormData({...formData, mailNumber: e.target.value})}
                                    placeholder="Nomor pada surat fisik..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Surat Dari / Pengirim</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={formData.sender}
                                    onChange={(e) => setFormData({...formData, sender: e.target.value})}
                                    placeholder="Contoh: Dinas Kependudukan..."
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Perihal / Judul Surat</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <textarea
                                    rows={3}
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    placeholder="Isi perihal surat..."
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex justify-center items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
