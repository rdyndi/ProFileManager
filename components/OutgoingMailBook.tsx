
import React, { useState, useMemo, useEffect } from 'react';
import { OutgoingMail } from '../types';
import { Plus, Search, Trash2, X, Save, Send, Calendar, Mail, BookOpen, ArrowLeft, Printer, Pencil } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface OutgoingMailBookProps {
  mails: OutgoingMail[];
  onSave: (mail: OutgoingMail) => void;
  onDelete: (id: string) => void;
}

export const OutgoingMailBook: React.FC<OutgoingMailBookProps> = ({ mails, onSave, onDelete }) => {
  const [viewState, setViewState] = useState<'list' | 'report'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Report Filter State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  // Form State
  const [formData, setFormData] = useState<Partial<OutgoingMail>>({
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    subject: '',
    recipient: ''
  });

  // Filter Logic for List View
  const filteredMails = useMemo(() => {
    return mails.filter(m => 
      m.fullNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipient.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mails, searchQuery]);

  // Filter Logic for Report View
  const reportData = useMemo(() => {
    return mails.filter(m => {
        const d = new Date(m.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [mails, selectedMonth, selectedYear]);

  // Helper: Roman Numerals for Month
  const getRomanMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return months[date.getMonth()];
  };

  // Helper: Format Preview
  const previewNumber = useMemo(() => {
    if (!formData.date || !formData.referenceNumber) return '.../NPP-NOT/.../...';
    const year = new Date(formData.date).getFullYear();
    const roman = getRomanMonth(formData.date);
    return `${formData.referenceNumber}/NPP-NOT/${roman}/${year}`;
  }, [formData.date, formData.referenceNumber]);

  // Suggest Next Number Logic
  const suggestNextNumber = () => {
    const currentYear = new Date().getFullYear();
    const mailsThisYear = mails.filter(m => new Date(m.date).getFullYear() === currentYear);
    
    if (mailsThisYear.length === 0) return "1";

    // Extract numbers and find max
    let maxNum = 0;
    mailsThisYear.forEach(m => {
        const num = parseInt(m.referenceNumber);
        if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    
    return (maxNum + 1).toString();
  };

  const handleOpenForm = (mail?: OutgoingMail) => {
      if (mail) {
          setEditingId(mail.id);
          setFormData({
              id: mail.id,
              date: mail.date,
              referenceNumber: mail.referenceNumber,
              recipient: mail.recipient,
              subject: mail.subject,
              createdAt: mail.createdAt
          });
      } else {
          setEditingId(null);
          setFormData({
            date: new Date().toISOString().split('T')[0],
            referenceNumber: suggestNextNumber(), // Auto suggest on new
            subject: '',
            recipient: ''
          });
      }
      setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.referenceNumber || !formData.subject) {
        alert("Mohon lengkapi tanggal, nomor urut, dan perihal surat.");
        return;
    }

    const fullNumber = previewNumber;

    const mailToSave: OutgoingMail = {
        id: formData.id || Math.random().toString(36).substr(2, 9),
        date: formData.date,
        referenceNumber: formData.referenceNumber,
        fullNumber: fullNumber,
        recipient: formData.recipient || '',
        subject: formData.subject,
        createdAt: formData.createdAt || Date.now()
    };

    onSave(mailToSave);
    setIsFormOpen(false);
    setFormData({
        date: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        subject: '',
        recipient: ''
    });
    setEditingId(null);
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
                <td style="padding: 5px; border: 1px solid #000; text-align: center; white-space: nowrap;">${new Date(m.date).toLocaleDateString('id-ID')}</td>
                <td style="padding: 5px; border: 1px solid #000;">${m.fullNumber}</td>
                <td style="padding: 5px; border: 1px solid #000;">${m.recipient}</td>
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
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #000; background: #fff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${settings.companyName}</h1>
                <p style="font-size: 12px; margin-bottom: 10px;">${settings.companyAddress}</p>
                <h2 style="font-size: 14px; font-weight: bold; text-decoration: underline; margin-top: 15px;">BUKU AGENDA SURAT KELUAR</h2>
                <p style="font-size: 12px; font-weight: bold;">Bulan: ${monthName} ${selectedYear}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f3f4f6; font-weight: bold; text-align: center;">
                        <th style="padding: 5px; border: 1px solid #000; width: 5%;">No</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 15%;">Tanggal</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 25%;">Nomor Surat</th>
                        <th style="padding: 5px; border: 1px solid #000; width: 20%;">Kepada</th>
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
        filename: `Laporan_Surat_Keluar_${monthName}_${selectedYear}.pdf`,
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
                    <h2 className="text-2xl font-bold text-slate-800">Laporan Surat Keluar</h2>
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
                            <th className="px-6 py-3">Kepada</th>
                            <th className="px-6 py-3">Perihal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportData.length > 0 ? (
                            reportData.map((m, idx) => (
                                <tr key={m.id}>
                                    <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>
                                    <td className="px-6 py-3 text-center">{new Date(m.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-3 font-mono text-xs">{m.fullNumber}</td>
                                    <td className="px-6 py-3">{m.recipient}</td>
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

  // --- LIST VIEW RENDER ---
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Buku Surat Keluar</h2>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setViewState('report')} 
                    className="bg-white border border-slate-300 text-slate-700 p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm"
                >
                    <BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Laporan</span>
                </button>
                <button 
                    onClick={() => handleOpenForm()} 
                    className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Catat Surat Baru</span>
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Cari nomor surat, perihal, atau tujuan..." 
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
                            <th className="px-6 py-3 w-32">Tanggal</th>
                            <th className="px-6 py-3 w-48">Nomor Surat</th>
                            <th className="px-6 py-3 w-48">Tujuan</th>
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
                                        <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                            {mail.fullNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {mail.recipient || '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {mail.subject}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleOpenForm(mail)} 
                                            className="p-2 text-slate-400 hover:text-blue-600 transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { if(window.confirm('Hapus surat ini?')) onDelete(mail.id); }} 
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
                                    Belum ada data surat keluar.
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
                            <Send className="w-4 h-4 text-primary-600" /> {editingId ? 'Edit Surat Keluar' : 'Catat Surat Keluar'}
                        </h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Surat</label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Urut</label>
                                <input
                                    type="text"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                                    placeholder="Contoh: 16"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preview Nomor Surat</label>
                            <p className="text-lg font-mono font-bold text-slate-800">{previewNumber}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Format: Nomor / NPP-NOT / Bulan(Romawi) / Tahun</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan Surat</label>
                            <input
                                type="text"
                                value={formData.recipient}
                                onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                                placeholder="Contoh: Kepala Kantor Pertanahan..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
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
