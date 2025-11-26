
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
  }).sort((a, b) => new Date(a.deedDate).getTime() - new Date(b.deedDate).getTime());

  // 2. Hitung index bulanan kronologis
  const deedMonthlyIndices = new Map<string, number>();
  filteredDeeds.forEach((deed, index) => {
      deedMonthlyIndices.set(deed.id, index + 1);
  });

  // Helper: Cek awal nama
  const isNameStartWith = (name: string, letter: string) => {
      return name.trim().toUpperCase().startsWith(letter);
  };

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
    // Selalu tanggal 01
    const signatureDateStr = `01 ${signMonthName} ${signYear}`;

    // Helper: Clean notary name
    let signatureName = settings.companyName;
    const prefix1 = "Notaris/PPAT ";
    const prefix2 = "Notaris ";
    if (signatureName.toLowerCase().startsWith(prefix1.toLowerCase())) {
        signatureName = signatureName.substring(prefix1.length);
    } else if (signatureName.toLowerCase().startsWith(prefix2.toLowerCase())) {
        signatureName = signatureName.substring(prefix2.length);
    }

    // Column Widths (Optimized for A4 Portrait to prevent overlap)
    // Adjusted widths to ensure headers like "NOMOR BULANAN" can wrap if needed without overflowing
    const w1 = "7%";  // Nomor Urut
    const w2 = "8%";  // Nomor Bulanan
    const w3 = "15%"; // Tanggal
    const w4 = "35%"; // Sifat Akta
    const w5 = "35%"; // Nama Penghadap

    // Shared Header Template
    const tableHeader = `
        <thead>
            <tr class="border-b border-black bg-white font-bold text-center uppercase text-[10px]">
                <th style="width: ${w1}" class="py-1 px-1 border-r border-black break-words">NOMOR URUT</th>
                <th style="width: ${w2}" class="py-1 px-1 border-r border-black break-words">NOMOR BULANAN</th>
                <th style="width: ${w3}" class="py-1 px-1 border-r border-black break-words">TANGGAL</th>
                <th style="width: ${w4}" class="py-1 px-1 border-r border-black break-words">SIFAT AKTA</th>
                <th style="width: ${w5}" class="py-1 px-1 break-words">NAMA PENGHADAP</th>
            </tr>
        </thead>
    `;
    
    // Generate HTML per Huruf
    const contentHtml = alphabet.map(letter => {
        const deedsForLetter = filteredDeeds.filter(d => 
            d.appearers.some(app => isNameStartWith(app.name, letter))
        );

        let sectionContent = '';

        if (deedsForLetter.length === 0) {
            // Tampilan NIHIL
            sectionContent = `
                <table class="w-full border border-black text-[10px] mb-4">
                    ${tableHeader}
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
            const rows = deedsForLetter.map((deed) => {
                const monthlyIndex = deedMonthlyIndices.get(deed.id);
                const relevantAppearers = deed.appearers.filter(app => isNameStartWith(app.name, letter));
                
                const appearersHtml = relevantAppearers.map(app => 
                    `<div class="mb-2 last:mb-0 leading-tight">${formatAppearer(app)}</div>`
                ).join('');

                return `
                    <tr class="border-b border-black align-top">
                        <td class="py-1 px-1 text-center border-r border-black font-medium break-words">${deed.orderNumber}</td>
                        <td class="py-1 px-1 text-center border-r border-black break-words">${monthlyIndex}</td>
                        <td class="py-1 px-1 text-center border-r border-black break-words">
                            ${new Date(deed.deedDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                        </td>
                        <td class="py-1 px-1 text-left border-r border-black font-medium leading-tight break-words">
                            ${deed.deedTitle}
                        </td>
                        <td class="py-1 px-1 text-left leading-tight break-words">
                            ${appearersHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            sectionContent = `
                <table class="w-full border border-black text-[10px] mb-4">
                    ${tableHeader}
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }

        return `
            <div class="break-inside-avoid">
                <div class="text-left font-bold text-sm mb-1 uppercase">${letter}</div>
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
          @page { size: A4 portrait; margin: 10mm; }
          /* table-layout: fixed Ensures columns respect width percentages and don't expand to overflow */
          table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
          table, th, td { border-color: black; }
          /* Ensure words break if they are too long for the column */
          td, th { word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; vertical-align: top; }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-white text-black">
        <div class="mb-4">
            <h1 class="text-sm font-bold uppercase text-left">Salinan Daftar Akta-Akta Notaris ${signatureName} Bulan ${monthName} ${selectedYear}</h1>
        </div>
        
        <div>
            ${contentHtml}
        </div>

        <div class="mt-8 flex justify-end break-inside-avoid">
             <div class="text-center w-1/2">
                <p class="text-xs mb-4 leading-relaxed font-medium">Salinan Daftar Klapper dari Akta-Akta yang telah dibuat dihadapan saya, Notaris, selama bulan ${monthName} ${selectedYear}.</p>
                <p class="mb-24 text-sm font-medium">Bandung Barat, ${signatureDateStr}</p>
                <p class="font-bold text-md uppercase underline underline-offset-4">${signatureName}</p>
             </div>
        </div>

        <script>setTimeout(() => { window.print(); }, 1000);</script>
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
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Daftar Klapper Akta (A-Z)</h2>
          </div>
          <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"><Printer className="w-4 h-4" /> Cetak Laporan</button>
       </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm min-w-[150px]">
                        {months.map((m, idx) => (<option key={idx} value={idx}>{m}</option>))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm">
                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
            </div>
            <div className="flex-1 text-right text-sm text-slate-500 pb-2">Menampilkan data akta A-Z untuk periode ini.</div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {alphabet.map(letter => {
                    const count = filteredDeeds.filter(d => d.appearers.some(app => isNameStartWith(app.name, letter))).length;
                    return (
                        <div key={letter} className={`p-3 rounded-lg border text-center ${count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-lg font-bold text-slate-700">{letter}</div>
                            <div className={`text-xs mt-1 ${count > 0 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>{count > 0 ? `${count} Data` : 'Nihil'}</div>
                        </div>
                    );
                })}
            </div>
       </div>
    </div>
  );
};
