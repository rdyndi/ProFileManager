import React, { useState } from 'react';
import { Deed, DeedAppearer } from '../types';
import { Printer, ArrowLeft, Calendar } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface DeedAlphabeticalReportProps {
  deeds: Deed[];
  onBack: () => void;
}

export const DeedAlphabeticalReport: React.FC<DeedAlphabeticalReportProps> = ({ deeds, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 1. Filter Data Berdasarkan Bulan & Tahun
  const filteredDeeds = deeds.filter(deed => {
    const d = new Date(deed.deedDate);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Helper: Format Nama Penghadap
  const formatAppearer = (appearer: DeedAppearer): string => {
    let text = `<span class="font-bold uppercase">${appearer.name}</span>`;
    if (appearer.role === 'Proxy' && appearer.grantors && appearer.grantors.length > 0) {
        appearer.grantors.forEach(grantor => {
            text += `<br/><span class="ml-2">Qq ${grantor.name.toUpperCase()}</span>`;
        });
    }
    return text;
  };

  // Helper: Dapatkan huruf depan dari penghadap pertama
  const getFirstLetter = (deed: Deed): string => {
      if (deed.appearers && deed.appearers.length > 0) {
          return deed.appearers[0].name.charAt(0).toUpperCase();
      }
      return '#';
  };

  const handlePrint = () => {
    // UPDATE: Tanggal, Nama Notaris, Table NIHIL
    const monthName = months[selectedMonth];
    const reportDateString = `01 ${monthName} ${selectedYear}`;
    const notarisName = "Notaris Nukantini Putri Parincha,SH.,M.kn";
    
    // Generate HTML per Huruf
    const contentHtml = alphabet.map(letter => {
        // Filter akta yang huruf depannya sesuai
        const deedsForLetter = filteredDeeds.filter(d => getFirstLetter(d) === letter)
            .sort((a, b) => new Date(a.deedDate).getTime() - new Date(b.deedDate).getTime());

        let sectionContent = '';

        if (deedsForLetter.length === 0) {
            // UPDATE: Tampilan NIHIL (N-I-H-I-L pada kolom masing-masing)
            sectionContent = `
                <table class="w-full border border-black mb-4 text-xs">
                    <thead>
                        <tr class="border-b border-black bg-gray-100 font-bold text-center uppercase">
                            <th class="py-1 px-1 border-r border-black w-16">No. Urut</th>
                            <th class="py-1 px-1 border-r border-black w-16">No. Bln</th>
                            <th class="py-1 px-1 border-r border-black w-24">Tanggal</th>
                            <th class="py-1 px-1 border-r border-black">Sifat Akta</th>
                            <th class="py-1 px-1">Nama Penghadap</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="py-1 px-1 border-r border-black text-center font-bold">N</td>
                            <td class="py-1 px-1 border-r border-black text-center font-bold">I</td>
                            <td class="py-1 px-1 border-r border-black text-center font-bold">H</td>
                            <td class="py-1 px-1 border-r border-black text-center font-bold">I</td>
                            <td class="py-1 px-1 text-center font-bold">L</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else {
            // Tampilan Tabel Data
            const rows = deedsForLetter.map((deed, idx) => {
                const appearersHtml = deed.appearers.map(app => 
                    `<div class="mb-2 last:mb-0 leading-tight">${formatAppearer(app)}</div>`
                ).join('');

                return `
                    <tr class="border-b border-black align-top">
                        <td class="py-1 px-1 text-center border-r border-black font-medium">${deed.orderNumber}</td>
                        <td class="py-1 px-1 text-center border-r border-black">${idx + 1}</td>
                        <td class="py-1 px-1 text-center border-r border-black whitespace-nowrap">
                            ${new Date(deed.deedDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </td>
                        <td class="py-1 px-1 text-left border-r border-black font-medium w-1/3">
                            ${deed.deedTitle}
                        </td>
                        <td class="py-1 px-1 text-left">
                            ${appearersHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            sectionContent = `
                <table class="w-full border border-black mb-4 text-xs">
                    <thead>
                        <tr class="border-b border-black bg-gray-100 font-bold text-center uppercase">
                            <th class="py-1 px-1 border-r border-black w-16">No. Urut</th>
                            <th class="py-1 px-1 border-r border-black w-16">No. Bln</th>
                            <th class="py-1 px-1 border-r border-black w-24">Tanggal</th>
                            <th class="py-1 px-1 border-r border-black">Sifat Akta</th>
                            <th class="py-1 px-1">Nama Penghadap</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }

        // Wrapper per Huruf
        return `
            <div class="break-inside-avoid mb-6">
                <h3 class="font-bold text-lg mb-1 ml-1 border-b-2 border-black inline-block px-2">${letter}</h3>
                ${sectionContent}
            </div>
        `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Klapper Akta - ${monthName} ${selectedYear}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 1.5cm; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          table, th, td { border-color: black; }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-white text-black p-8">
        
        <div class="mb-8 text-center">
            <h1 class="text-lg font-bold uppercase mb-1">Salinan Daftar Klapper Akta ${notarisName}</h1>
            <h2 class="text-md font-semibold uppercase">Bulan ${monthName} ${selectedYear}</h2>
        </div>

        <div class="space-y-4">
            ${contentHtml}
        </div>

        <div class="mt-8 pt-4 break-inside-avoid">
             <p class="text-xs mb-8">Salinan Daftar Akta-Akta (Klapper) yang telah dibuat oleh saya, Notaris, selama Bulan ${monthName} ${selectedYear}.</p>
             
             <div class="flex justify-end mt-12 px-4">
                <div class="text-center w-64">
                    <p class="mb-24 text-xs font-medium">Bandung Barat, ${reportDateString}</p>
                    <p class="font-bold text-sm uppercase underline underline-offset-2">${notarisName}</p>
                    <p class="font-bold text-xs mt-1">Notaris di Kabupaten Bandung Barat</p>
                </div>
             </div>
        </div>

        <script>
            setTimeout(() => {
                window.print();
            }, 1000);
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
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Daftar Klapper Akta (A-Z)</h2>
          </div>
          <button 
             onClick={handlePrint}
             className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"
          >
             <Printer className="w-4 h-4" />
             Cetak Laporan
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
                Menampilkan data akta A-Z untuk periode ini.
            </div>
       </div>

       {/* Preview (Simple List of Letters) */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {alphabet.map(letter => {
                    const count = filteredDeeds.filter(d => getFirstLetter(d) === letter).length;
                    return (
                        <div key={letter} className={`p-3 rounded-lg border text-center ${count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-lg font-bold text-slate-700">{letter}</div>
                            <div className={`text-xs mt-1 ${count > 0 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                                {count > 0 ? `${count} Akta` : 'Nihil'}
                            </div>
                        </div>
                    );
                })}
            </div>
       </div>
    </div>
  );
};