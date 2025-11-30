
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
    let text = `<span style="font-weight: bold; text-transform: uppercase;">${appearer.name}</span>`;
    if (appearer.role === 'Proxy' && appearer.grantors && appearer.grantors.length > 0) {
        appearer.grantors.forEach(grantor => {
            text += `<br/><span style="margin-left: 8px;">Qq ${grantor.name.toUpperCase()}</span>`;
        });
    }
    return text;
  };

  const handlePrint = () => {
    // Check if html2pdf is loaded
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("Fitur PDF sedang dimuat. Silakan tunggu sebentar atau refresh halaman.");
        return;
    }

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

    // Shared Header Template
    const tableHeader = `
        <thead>
            <tr style="border-bottom: 1px solid #000; background-color: #fff; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 10px;">
                <th style="width: 7%; padding: 4px; border-right: 1px solid #000;">NO. URUT</th>
                <th style="width: 8%; padding: 4px; border-right: 1px solid #000;">NO. BLN</th>
                <th style="width: 15%; padding: 4px; border-right: 1px solid #000;">TANGGAL</th>
                <th style="width: 35%; padding: 4px; border-right: 1px solid #000;">SIFAT AKTA</th>
                <th style="width: 35%; padding: 4px;">NAMA PENGHADAP</th>
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
                <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    ${tableHeader}
                    <tbody>
                        <tr>
                            <td style="padding: 4px; border-right: 1px solid #000; text-align: center; font-weight: bold;">N</td>
                            <td style="padding: 4px; border-right: 1px solid #000; text-align: center; font-weight: bold;">I</td>
                            <td style="padding: 4px; border-right: 1px solid #000; text-align: center; font-weight: bold;">H</td>
                            <td style="padding: 4px; border-right: 1px solid #000; text-align: center; font-weight: bold;">I</td>
                            <td style="padding: 4px; text-align: center; font-weight: bold;">L</td>
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
                    `<div style="margin-bottom: 5px; line-height: 1.2;">${formatAppearer(app)}</div>`
                ).join('');

                return `
                    <tr style="border-bottom: 1px solid #000; vertical-align: top;">
                        <td style="padding: 4px; text-align: center; border-right: 1px solid #000;">${deed.orderNumber}</td>
                        <td style="padding: 4px; text-align: center; border-right: 1px solid #000;">${monthlyIndex}</td>
                        <td style="padding: 4px; text-align: center; border-right: 1px solid #000;">
                            ${new Date(deed.deedDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                        </td>
                        <td style="padding: 4px; text-align: left; border-right: 1px solid #000; font-weight: 500; line-height: 1.2;">
                            ${deed.deedTitle}
                        </td>
                        <td style="padding: 4px; text-align: left; line-height: 1.2;">
                            ${appearersHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            sectionContent = `
                <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    ${tableHeader}
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;
        }

        return `
            <div style="page-break-inside: avoid; margin-bottom: 10px;">
                <div style="text-align: left; font-weight: bold; font-size: 14px; margin-bottom: 4px; text-transform: uppercase;">${letter}</div>
                ${sectionContent}
            </div>
        `;
    }).join('');

    // Construct DOM Element for PDF
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #000; width: 100%;">
            <div style="margin-bottom: 20px;">
                <h1 style="font-size: 14px; font-weight: bold; text-transform: uppercase; text-align: left;">Salinan Daftar Akta-Akta Notaris ${signatureName} Bulan ${monthName} ${selectedYear}</h1>
            </div>
            
            <div>
                ${contentHtml}
            </div>

            <div style="margin-top: 30px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
                 <div style="text-align: center; width: 50%;">
                    <p style="font-size: 12px; margin-bottom: 15px; line-height: 1.5; font-weight: 500;">Salinan Daftar Klapper dari Akta-Akta yang telah dibuat dihadapan saya, Notaris, selama bulan ${monthName} ${selectedYear}.</p>
                    <p style="margin-bottom: 80px; font-size: 12px; font-weight: 500;">Bandung Barat, ${signatureDateStr}</p>
                    <p style="font-weight: bold; font-size: 14px; text-transform: uppercase; text-decoration: underline; text-underline-offset: 4px;">${signatureName}</p>
                 </div>
            </div>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `Klapper_Akta_${monthName}_${selectedYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ArrowLeft className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-800">Daftar Klapper Akta (A-Z)</h2>
          </div>
          <button 
            onClick={handlePrint} 
            className="bg-slate-800 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> 
            <span className="hidden md:inline">Download PDF</span>
          </button>
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
