import React, { useState, useMemo } from 'react';
import { Invoice, Expense } from '../types';
import { Calendar, Printer, TrendingUp, TrendingDown, DollarSign, Wallet, FileBarChart, PieChart } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface ProfitLossReportProps {
  invoices: Invoice[];
  expenses: Expense[];
}

interface MonthlyData {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    revenueByClient: Record<string, number>;
    expenseByCategory: Record<string, number>;
    totalCashReceived: number;
}

interface AnnualData {
    revenuePerMonth: number[];
    expensePerMonth: number[];
    expenseByCategoryPerMonth: Record<string, number[]>;
    netProfitPerMonth: number[];
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ invoices, expenses }) => {
  const [reportType, setReportType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

  // --- MONTHLY DATA LOGIC ---
  const monthlyData: MonthlyData = useMemo(() => {
    // 1. Calculate Revenue (Pendapatan)
    const periodInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalRevenue = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Group Revenue by Client
    const revenueByClient: Record<string, number> = {};
    periodInvoices.forEach(inv => {
        revenueByClient[inv.clientName] = (revenueByClient[inv.clientName] || 0) + inv.totalAmount;
    });

    // 2. Calculate Expenses (Beban)
    const periodExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalExpense = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Group Expense by Category
    const expenseByCategory: Record<string, number> = {};
    periodExpenses.forEach(exp => {
        expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    });

    // 3. Cash Flow
    let totalCashReceived = 0;
    invoices.forEach(inv => {
        if (inv.paymentHistory) {
            inv.paymentHistory.forEach(pay => {
                const pd = new Date(pay.date);
                if (pd.getMonth() === selectedMonth && pd.getFullYear() === selectedYear) {
                    totalCashReceived += pay.amount;
                }
            });
        } else if (inv.paymentAmount && inv.paymentDate) {
            const pd = new Date(inv.paymentDate);
             if (pd.getMonth() === selectedMonth && pd.getFullYear() === selectedYear) {
                totalCashReceived += (inv.paymentAmount || 0);
            }
        }
    });

    return {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        revenueByClient,
        expenseByCategory,
        totalCashReceived
    };
  }, [invoices, expenses, selectedMonth, selectedYear]);

  // --- ANNUAL DATA LOGIC ---
  const annualData: AnnualData = useMemo(() => {
    // Initialize Arrays (Index 0-11 for Jan-Dec, Index 12 for Total)
    const revenuePerMonth: number[] = new Array(13).fill(0);
    const expensePerMonth: number[] = new Array(13).fill(0);
    const expenseByCategoryPerMonth: Record<string, number[]> = {};

    // 1. Process Revenue
    invoices.forEach(inv => {
        const d = new Date(inv.date);
        if (d.getFullYear() === selectedYear) {
            const m = d.getMonth();
            revenuePerMonth[m] += inv.totalAmount;
            revenuePerMonth[12] += inv.totalAmount; // Annual Total
        }
    });

    // 2. Process Expenses
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d.getFullYear() === selectedYear) {
            const m = d.getMonth();
            const cat = exp.category;

            // Init category array if not exists
            if (!expenseByCategoryPerMonth[cat]) {
                expenseByCategoryPerMonth[cat] = new Array(13).fill(0);
            }

            expenseByCategoryPerMonth[cat][m] += exp.amount;
            expenseByCategoryPerMonth[cat][12] += exp.amount; // Category Annual Total

            expensePerMonth[m] += exp.amount;
            expensePerMonth[12] += exp.amount; // Grand Total Expense
        }
    });

    // 3. Process Net Profit
    const netProfitPerMonth = revenuePerMonth.map((rev, idx) => rev - expensePerMonth[idx]);

    return {
        revenuePerMonth,
        expensePerMonth,
        expenseByCategoryPerMonth,
        netProfitPerMonth
    };
  }, [invoices, expenses, selectedYear]);


  // --- PRINT HANDLERS ---

  const handlePrintMonthly = () => {
    const settings = getCachedSettings();
    const monthName = months[selectedMonth];

    // Check if html2pdf is loaded
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("Fitur PDF sedang dimuat. Silakan tunggu sebentar atau refresh halaman.");
        return;
    }

    const revenueRows = Object.entries(monthlyData.revenueByClient)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([client, amount]) => `
            <tr>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">${client}</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${currencyFormatter.format(amount as number)}</td>
            </tr>
        `).join('');

    const expenseRows = Object.entries(monthlyData.expenseByCategory)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([cat, amount]) => `
            <tr>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">${cat}</td>
                <td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">(${currencyFormatter.format(amount as number)})</td>
            </tr>
        `).join('');

    // Construct DOM Element for PDF
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; color: #000; width: 100%;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                <h1 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0;">${settings.companyName}</h1>
                <p style="font-size: 12px; color: #555; margin: 5px 0;">${settings.companyAddress}</p>
                <h2 style="font-size: 20px; font-weight: bold; margin-top: 15px; text-decoration: underline;">LAPORAN LABA RUGI</h2>
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 5px;">Periode: ${monthName} ${selectedYear}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 10px;">
                <div style="width: 48%; background-color: #f0fdf4; padding: 15px; border: 1px solid #dcfce7; border-radius: 4px;">
                    <p style="font-size: 10px; font-weight: bold; color: #15803d; text-transform: uppercase; margin: 0;">Total Pendapatan</p>
                    <p style="font-size: 16px; font-weight: bold; color: #166534; margin: 5px 0 0 0;">${currencyFormatter.format(monthlyData.totalRevenue)}</p>
                </div>
                <div style="width: 48%; background-color: #fef2f2; padding: 15px; border: 1px solid #fee2e2; border-radius: 4px; text-align: right;">
                    <p style="font-size: 10px; font-weight: bold; color: #b91c1c; text-transform: uppercase; margin: 0;">Total Beban</p>
                    <p style="font-size: 16px; font-weight: bold; color: #991b1b; margin: 5px 0 0 0;">(${currencyFormatter.format(monthlyData.totalExpense)})</p>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">PENDAPATAN USAHA</h3>
                <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                    ${revenueRows || '<tr><td colspan="2" style="font-style: italic; color: #999; padding: 5px 0;">Tidak ada pendapatan</td></tr>'}
                </table>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">BEBAN OPERASIONAL</h3>
                <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                    ${expenseRows || '<tr><td colspan="2" style="font-style: italic; color: #999; padding: 5px 0;">Tidak ada beban</td></tr>'}
                </table>
            </div>

            <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0;">LABA / (RUGI) BERSIH</h3>
                <p style="font-size: 20px; font-weight: bold; font-family: monospace; color: ${monthlyData.netProfit >= 0 ? '#15803d' : '#b91c1c'}; margin: 0;">
                    ${currencyFormatter.format(monthlyData.netProfit)}
                </p>
            </div>
            
             <div style="text-align: center; margin-top: 40px; font-size: 8px; color: #cbd5e1;">
                Dicetak pada ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `Laporan_Laba_Rugi_${monthName}_${selectedYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().set(opt).from(element).save();
  };

  const handlePrintAnnual = () => {
    const settings = getCachedSettings();
    const headers = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'TOTAL'];
    
    // Generate Header Cells
    const headerHtml = headers.map(h => `<th class="px-1 py-1 border border-slate-300 text-center w-[6%]">${h}</th>`).join('');

    // Generate Revenue Row
    const revenueCells = annualData.revenuePerMonth.map(val => 
        `<td class="px-1 py-1 border border-slate-300 text-right font-mono text-[9px]">${new Intl.NumberFormat('id-ID').format(val)}</td>`
    ).join('');

    // Generate Expense Rows
    const expenseRowsHtml = Object.entries(annualData.expenseByCategoryPerMonth).map(([cat, vals]) => `
        <tr>
            <td class="px-1 py-1 border border-slate-300 font-medium truncate">${cat}</td>
            ${vals.map(val => `<td class="px-1 py-1 border border-slate-300 text-right font-mono text-[9px] text-red-600">${val > 0 ? `(${new Intl.NumberFormat('id-ID').format(val)})` : '-'}</td>`).join('')}
        </tr>
    `).join('');

    // Generate Net Profit Row
    const netProfitCells = annualData.netProfitPerMonth.map(val => 
        `<td class="px-1 py-1 border border-slate-300 text-right font-mono text-[9px] font-bold ${val >= 0 ? 'text-green-700' : 'text-red-700'}">${new Intl.NumberFormat('id-ID').format(val)}</td>`
    ).join('');

    const printContent = `
      <!DOCTYPE html><html><head><title>Laporan Tahunan - ${selectedYear}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
        @page { size: A4 landscape; margin: 10mm; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body class="bg-white p-4 mx-auto text-slate-900 w-full">
        <div class="text-center mb-6">
            <h1 class="text-lg font-bold uppercase">${settings.companyName}</h1>
            <h2 class="text-xl font-bold mt-2 underline decoration-slate-400">LAPORAN LABA RUGI TAHUNAN</h2>
            <p class="text-sm font-medium mt-1 uppercase">Tahun Buku: ${selectedYear}</p>
        </div>
        
        <table class="w-full border-collapse text-[10px]">
            <thead>
                <tr class="bg-slate-100 font-bold uppercase">
                    <th class="px-2 py-1 border border-slate-300 text-left w-[15%]">KETERANGAN</th>
                    ${headerHtml}
                </tr>
            </thead>
            <tbody>
                <!-- PENDAPATAN -->
                <tr class="bg-green-50">
                    <td class="px-2 py-1 border border-slate-300 font-bold text-green-800">TOTAL PENDAPATAN</td>
                    ${revenueCells}
                </tr>
                
                <!-- BEBAN -->
                <tr><td colspan="14" class="px-2 py-1 border border-slate-300 font-bold bg-slate-50 text-slate-500 uppercase">Rincian Beban</td></tr>
                ${expenseRowsHtml}
                
                <tr class="bg-red-50">
                    <td class="px-2 py-1 border border-slate-300 font-bold text-red-800">TOTAL BEBAN</td>
                    ${annualData.expensePerMonth.map(val => `<td class="px-1 py-1 border border-slate-300 text-right font-mono font-bold text-[9px] text-red-700">(${new Intl.NumberFormat('id-ID').format(val)})</td>`).join('')}
                </tr>

                <!-- LABA BERSIH -->
                <tr class="bg-slate-200 border-t-2 border-slate-400">
                    <td class="px-2 py-2 border border-slate-300 font-bold uppercase">LABA / (RUGI) BERSIH</td>
                    ${netProfitCells}
                </tr>
            </tbody>
        </table>

        <div class="fixed bottom-0 left-0 w-full text-center py-2 text-[8px] text-slate-300 no-print">
            Dicetak pada ${new Date().toLocaleString()}
        </div>
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
                 <div className="bg-slate-100 p-1 rounded-lg flex text-sm">
                    <button 
                        onClick={() => setReportType('MONTHLY')}
                        className={`px-3 py-1.5 rounded-md font-medium transition ${reportType === 'MONTHLY' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Bulanan
                    </button>
                    <button 
                         onClick={() => setReportType('ANNUAL')}
                         className={`px-3 py-1.5 rounded-md font-medium transition ${reportType === 'ANNUAL' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tahunan
                    </button>
                 </div>
             </div>
             <button 
                onClick={reportType === 'MONTHLY' ? handlePrintMonthly : handlePrintAnnual}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 transition shadow-sm"
            >
                <Printer className="w-4 h-4" /> 
                <span className="hidden md:inline">Cetak Laporan</span>
                <span className="md:hidden">Download PDF</span>
            </button>
        </div>

        {/* CONTROLS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
            {reportType === 'MONTHLY' && (
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
            )}
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
        </div>

        {/* MONTHLY VIEW */}
        {reportType === 'MONTHLY' && (
            <div className="space-y-6">
                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan (Accrual)</p>
                                 <p className="text-xl font-bold text-green-600 mt-1">{currencyFormatter.format(monthlyData.totalRevenue)}</p>
                             </div>
                             <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                         </div>
                         <p className="text-[10px] text-slate-500">Berdasarkan Invoice dibuat</p>
                     </div>

                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Beban</p>
                                 <p className="text-xl font-bold text-red-600 mt-1">({currencyFormatter.format(monthlyData.totalExpense)})</p>
                             </div>
                             <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                         </div>
                         <p className="text-[10px] text-slate-500">Total Pengeluaran Operasional</p>
                     </div>

                     <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 ${monthlyData.netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laba / (Rugi) Bersih</p>
                                 <p className={`text-xl font-bold mt-1 ${monthlyData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                     {currencyFormatter.format(monthlyData.netProfit)}
                                 </p>
                             </div>
                             <div className={`p-2 rounded-lg ${monthlyData.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                 <PieChart className={`w-5 h-5 ${monthlyData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                             </div>
                         </div>
                         <p className="text-[10px] text-slate-500">Pendapatan - Beban</p>
                     </div>

                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-teal-500">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arus Kas Masuk</p>
                                 <p className="text-xl font-bold text-teal-600 mt-1">{currencyFormatter.format(monthlyData.totalCashReceived)}</p>
                             </div>
                             <div className="p-2 bg-teal-50 rounded-lg"><Wallet className="w-5 h-5 text-teal-600" /></div>
                         </div>
                         <p className="text-[10px] text-slate-500">Total Pembayaran Diterima</p>
                     </div>
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* REVENUE BREAKDOWN */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <FileBarChart className="w-4 h-4 text-green-600" />
                            <h3 className="font-bold text-slate-800 text-sm">Rincian Pendapatan per Klien</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Nama Klien</th>
                                        <th className="px-4 py-2 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.keys(monthlyData.revenueByClient).length > 0 ? (
                                        Object.entries(monthlyData.revenueByClient)
                                            .sort(([,a], [,b]) => (b as number) - (a as number))
                                            .map(([name, amount], idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-slate-700">{name}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-slate-900">{currencyFormatter.format(amount as number)}</td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">Belum ada pendapatan bulan ini.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* EXPENSE BREAKDOWN */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <h3 className="font-bold text-slate-800 text-sm">Rincian Beban per Kategori</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Kategori Biaya</th>
                                        <th className="px-4 py-2 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.keys(monthlyData.expenseByCategory).length > 0 ? (
                                        Object.entries(monthlyData.expenseByCategory)
                                            .sort(([,a], [,b]) => (b as number) - (a as number))
                                            .map(([cat, amount], idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-slate-700">{cat}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-red-600">{currencyFormatter.format(amount as number)}</td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">Belum ada pengeluaran bulan ini.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ANNUAL VIEW */}
        {reportType === 'ANNUAL' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Rekapitulasi Tahunan ({selectedYear})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-100 font-bold text-slate-600 uppercase">
                                <th className="px-4 py-3 text-left sticky left-0 bg-slate-100 border-r border-slate-200 shadow-sm z-10">Keterangan</th>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'TOTAL'].map(m => (
                                    <th key={m} className="px-2 py-3 text-right border-l border-slate-200 min-w-[80px]">{m}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* REVENUE ROW */}
                            <tr className="bg-green-50/50">
                                <td className="px-4 py-3 font-bold text-green-700 sticky left-0 bg-green-50/50 border-r border-green-100">Pendapatan</td>
                                {annualData.revenuePerMonth.map((val, idx) => (
                                    <td key={idx} className="px-2 py-3 text-right font-mono text-slate-800 border-l border-slate-200">
                                        {val > 0 ? new Intl.NumberFormat('id-ID').format(val) : '-'}
                                    </td>
                                ))}
                            </tr>
                            
                            {/* EXPENSE CATEGORIES ROWS */}
                             {Object.entries(annualData.expenseByCategoryPerMonth).map(([cat, vals], idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                     <td className="px-4 py-2 text-slate-600 pl-8 sticky left-0 bg-white border-r border-slate-200 text-[11px] truncate max-w-[150px]" title={cat}>{cat}</td>
                                     {vals.map((val, vIdx) => (
                                        <td key={vIdx} className="px-2 py-2 text-right font-mono text-red-500 border-l border-slate-200 text-[10px]">
                                            {val > 0 ? `(${new Intl.NumberFormat('id-ID').format(val)})` : '-'}
                                        </td>
                                     ))}
                                </tr>
                             ))}

                             {/* TOTAL EXPENSE ROW */}
                             <tr className="bg-red-50/50 font-medium">
                                <td className="px-4 py-3 text-red-700 sticky left-0 bg-red-50/50 border-r border-red-100">Total Beban</td>
                                {annualData.expensePerMonth.map((val, idx) => (
                                    <td key={idx} className="px-2 py-3 text-right font-mono text-red-700 border-l border-slate-200">
                                        {val > 0 ? `(${new Intl.NumberFormat('id-ID').format(val)})` : '-'}
                                    </td>
                                ))}
                            </tr>

                             {/* NET PROFIT ROW */}
                             <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td className="px-4 py-4 text-slate-800 sticky left-0 bg-slate-100 border-r border-slate-300">Laba Bersih</td>
                                {annualData.netProfitPerMonth.map((val, idx) => (
                                    <td key={idx} className={`px-2 py-4 text-right font-mono border-l border-slate-300 ${val >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {new Intl.NumberFormat('id-ID').format(val)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
             </div>
        )}
    </div>
  );
};