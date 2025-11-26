
import React, { useState } from 'react';
import { Deed, DeedAppearer } from '../types';
import { Printer, ArrowLeft, Calendar } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface DeedReportProps {
  deeds: Deed[];
  onBack: () => void;
}

export const DeedReport: React.FC<DeedReportProps> = ({ deeds, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filter Data Berdasarkan Bulan & Tahun, lalu urutkan berdasarkan tanggal
  const filteredDeeds = deeds.filter(deed => {
    const d = new Date(deed.deedDate);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }).sort((a, b) => new Date(a.deedDate).getTime() - new Date(b.deedDate).getTime());

  // Helper: Format Nama Penghadap dengan Logic Qq
  // Jika Kuasa: Nama Penghadap Qq Pemberi Kuasa 1 Qq Pemberi Kuasa 2 dst.
  const formatAppearer = (appearer: DeedAppearer): string => {
    let text = `<span class="font-bold uppercase">${appearer.name}</span>`;
    
    if (appearer.role === 'Proxy' && appearer.grantors && appearer.grantors.length > 0) {
        appearer.grantors.forEach(grantor => {
            text += `<br/><span class="ml-2">Qq ${grantor.name.toUpperCase()}</span>`;
        });
    }
    return text;
  };

  const handlePrint = () => {
    const settings = getCachedSettings();
    const monthName = months[selectedMonth];
    
    // Logic Tanggal Tanda Tangan: Bulan Laporan + 1 Bulan
    let signMonthIndex = selectedMonth + 1;
    let signYear = selectedYear;

    // Jika bulan laporan Desember (11), maka tanda tangan Januari (0) tahun depan
    if (signMonthIndex > 11) {
        signMonthIndex = 0;
        signYear = signYear + 1;
    }

    const signMonthName = months[signMonthIndex];
    // Format tanggal tanda tangan: [Tanggal Hari Ini] [Bulan Depan] [Tahun]
    // Menggunakan tanggal '01' agar selalu tanggal satu.
    const signatureDateStr = `01 ${signMonthName} ${signYear}`;

    // Helper to clean notary name from settings for the signature block
    // Removes "Notaris/PPAT" prefix if present to show just the name + titles
    let signatureName = settings.companyName;
    const prefix1 = "Notaris/PPAT ";
    const prefix2 = "Notaris ";
    if (signatureName.toLowerCase().startsWith(prefix1.toLowerCase())) {
        signatureName = signatureName.substring(prefix1.length);
    } else if (signatureName.toLowerCase().startsWith(prefix2.toLowerCase())) {
        signatureName = signatureName.substring(prefix2.length);
    }

    // Generate Rows HTML
    const rowsHtml = filteredDeeds.map((deed, index) => {
        // Gabungkan semua penghadap dalam satu sel, dipisah baris baru
        const appearersHtml = deed.appearers.map(app => 
            `<div class="mb-2 last:mb-0 leading-tight">${formatAppearer(app)}</div>`
        ).join('');

        return `
            <tr class="border-b border-black align-top">
                <td class="py-1 px-1 text-center border-r border-black font-medium">${deed.orderNumber}</td>
                <td class="py-1 px-1 text-center border-r border-black">${index + 1}</td>
                <td class="py-1 px-1 text-center border-r border-black whitespace-nowrap">
                    ${new Date(deed.deedDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                </td>
                <td class="py-1 px-1 text-left border-r border-black font-medium leading-tight">
                    ${deed.deedTitle}
                </td>
                <td class="py-1 px-1 text-left leading-tight">
                    ${appearersHtml}
                </td>
            </tr>
        `;
    }).join('');

    // Filler jika kosong
    const emptyRows = filteredDeeds.length === 0 ? `
        <tr><td colspan="5" class="text-center py-8 italic text-slate-500 border-b border-black">Tidak ada data akta pada bulan ini.</td></tr>
    ` : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Buku Akta - ${monthName} ${selectedYear}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 10mm; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          /* Border tabel tebal solid hitam */
          table, th, td { border-color: black; }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-white text-black p-4">
        
        <div class="mb-4">
            <h1 class="text-md font-bold uppercase mb-1">Salinan Daftar Akta-Akta Notaris ${signatureName}</h1>
            <h2 class="text-sm font-semibold uppercase">Bulan ${monthName} ${selectedYear}</h2>
        </div>

        <table class="w-full border border-black table-fixed">
            <thead>
                <tr class="border-b border-black bg-gray-100 uppercase text-[10px] font-bold tracking-wider text-center">
                    <th class="py-1 px-1 border-r border-black w-[8%]">NOMOR URUT</th>
                    <th class="py-1 px-1 border-r border-black w-[10%]">NOMOR BULANAN</th>
                    <th class="py-1 px-1 border-r border-black w-[12%]">TANGGAL</th>
                    <th class="py-1 px-1 border-r border-black w-[35%]">SIFAT AKTA</th>
                    <th class="py-1 px-1 w-[35%]">NAMA PENGHADAP</th>
                </tr>
            </thead>
            <tbody class="text-[10px]">
                ${rowsHtml}
                ${emptyRows}
            </tbody>
        </table>

        <div class="mt-8 flex justify-end break-inside-avoid">
             <div class="text-center w-1/2">
                <p class="text-xs mb-4 leading-relaxed font-medium">Salinan Daftar Akta-Akta yang telah dibuat oleh saya, Notaris, selama Bulan ${monthName} ${selectedYear}.</p>
                <p class="mb-24 text-sm font-medium">Bandung Barat, ${signatureDateStr}</p>
                <p class="font-bold text-md uppercase underline underline-offset-4">${signatureName}</p>
             </div>
        </div>

        <script>
            setTimeout(() => {
                window.print();
            }, 800);
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Header Navigation */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Laporan Buku Akta</h2>
          </div>
          <button 
             onClick={handlePrint}
             className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"
          >
             <Printer className="w-4 h-4" />
             Cetak Laporan / PDF
          </button>
       </div>

       {/* Filters */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm min-w-[150px]"
                    >
                        {months.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                >
                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 text-right text-sm text-slate-500 pb-2">
                Menampilkan <strong>{filteredDeeds.length}</strong> akta.
            </div>
       </div>

       {/* Preview Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 border-r border-slate-200 w-24 text-center">No. Urut</th>
                            <th className="px-6 py-4 border-r border-slate-200 w-24 text-center">No. Bln</th>
                            <th className="px-6 py-4 border-r border-slate-200 w-32 text-center">Tanggal</th>
                            <th className="px-6 py-4 border-r border-slate-200 w-1/3">Sifat Akta</th>
                            <th className="px-6 py-4">Nama Penghadap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredDeeds.map((deed, index) => (
                            <tr key={deed.id} className="hover:bg-slate-50 align-top">
                                <td className="px-6 py-4 text-center font-mono text-slate-600 border-r border-slate-100">{deed.orderNumber}</td>
                                <td className="px-6 py-4 text-center border-r border-slate-100 font-medium">{index + 1}</td>
                                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-slate-100 text-slate-600">
                                    {new Date(deed.deedDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-800 border-r border-slate-100">{deed.deedTitle}</td>
                                <td className="px-6 py-4">
                                    <div className="space-y-3">
                                        {deed.appearers.map((app, i) => (
                                            <div key={i} className="text-sm leading-tight">
                                                <div className="font-bold text-slate-800 uppercase">{app.name}</div>
                                                {app.role === 'Proxy' && app.grantors && app.grantors.map((g, gi) => (
                                                    <div key={gi} className="ml-2 text-slate-600 uppercase">
                                                        Qq {g.name}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredDeeds.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    Tidak ada data akta untuk periode ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
       </div>
    </div>
  );
};
