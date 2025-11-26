
import React, { useState, useMemo } from 'react';
import { Invoice, Expense } from '../types';
import { Calendar, Printer, TrendingUp, TrendingDown, DollarSign, Wallet, FileBarChart, PieChart } from 'lucide-react';
import { getCachedSettings } from '../services/storage';

interface ProfitLossReportProps {
  invoices: Invoice[];
  expenses: Expense[];
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
  const monthlyData = useMemo(() => {
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
  const annualData = useMemo(() => {
    // Initialize Arrays (Index 0-11 for Jan-Dec, Index 12 for Total)
    const revenuePerMonth = new Array(13).fill(0);
    const expensePerMonth = new Array(13).fill(0);
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

    const revenueRows = Object.entries(monthlyData.revenueByClient)
        .sort(([, a], [, b]) => b - a)
        .map(([client, amount]) => `
            <tr>
                <td class="py-1 px-2 border-b border-slate-200">${client}</td>
                <td class="py-1 px-2 border-b border-slate-200 text-right">${currencyFormatter.format(amount)}</td>
            </tr>
        `).join('');

    const expenseRows = Object.entries(monthlyData.expenseByCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount]) => `
            <tr>
                <td class="py-1 px-2 border-b border-slate-200">${cat}</td>
                <td class="py-1 px-2 border-b border-slate-200 text-right text-red-600">(${currencyFormatter.format(amount)})</td>
            </tr>
        `).join('');

    const printContent = `
      <!DOCTYPE html><html><head><title>Laporan Laba Rugi - ${monthName} ${selectedYear}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>body { font-family: 'Inter', sans-serif; } @media print { .no-print { display: none; } }</style>
      </head><body class="bg-white p-8 max-w-[21cm] mx-auto text-slate-900">
        <div class="text-center mb-8 border-b-2 border-slate-800 pb-4">
            <h1 class="text-xl font-bold uppercase">${settings.companyName}</h1>
            <p class="text-sm text-slate-600">${settings.companyAddress}</p>
            <h2 class="text-2xl font-bold mt-4 underline decoration-slate-400 underline-offset-4">LAPORAN LABA RUGI</h2>
            <p class="text-sm font-medium mt-1 uppercase">Periode: ${monthName} ${selectedYear}</p>
        </div>
        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-green-50 p-4 rounded border border-green-100">
                <p class="text-xs font-bold text-green-700 uppercase">Total Pendapatan</p>
                <p class="text-xl font-bold text-green-800">${currencyFormatter.format(monthlyData.totalRevenue)}</p>
            </div>
            <div class="bg-red-50 p-4 rounded border border-red-100 text-right">
                <p class="text-xs font-bold text-red-700 uppercase">Total Beban</p>
                <p class="text-xl font-bold text-red-800">(${currencyFormatter.format(monthlyData.totalExpense)})</p>
            </div>
        </div>
        <div class="mb-6">
            <h3 class="font-bold text-slate-800 border-b border-slate-800 mb-2 pb-1">PENDAPATAN USAHA</h3>
            <table class="w-full text-sm mb-4">
                ${revenueRows || '<tr><td colspan="2" class="italic text-slate-400 py-2">Tidak ada pendapatan periode ini.</td></tr>'}
                <tr class="font-bold bg-slate-50">
                    <td class="py-2 px-2 text-right">Total Pendapatan</td>
                    <td class="py-2 px-2 text-right">${currencyFormatter.format(monthlyData.totalRevenue)}</td>
                </tr>
            </table>
        </div>
        <div class="mb-6">
            <h3 class="font-bold text-slate-800 border-b border-slate-800 mb-2 pb-1">BEBAN OPERASIONAL</h3>
            <table class="w-full text-sm mb-4">
                ${expenseRows || '<tr><td colspan="2" class="italic text-slate-400 py-2">Tidak ada pengeluaran periode ini.</td></tr>'}
                <tr class="font-bold bg-slate-50">
                    <td class="py-2 px-2 text-right">Total Beban</td>
                    <td class="py-2 px-2 text-right text-red-600">(${currencyFormatter.format(monthlyData.totalExpense)})</td>
                </tr>
            </table>
        </div>
        <div class="border-t-4 border-double border-slate-800 pt-4 flex justify-between items-center">
            <div class="text-sm font-medium text-slate-500 uppercase">Laba / (Rugi) Bersih</div>
            <div class="text-2xl font-bold ${monthlyData.netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}">
                ${currencyFormatter.format(monthlyData.netProfit)}
            </div>
        </div>
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(printContent); printWindow.document.close(); }
  };

  const handlePrintAnnual = () => {
    const settings = getCachedSettings();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Generate Expense Category Rows
    const expenseRows = Object.entries(annualData.expenseByCategoryPerMonth).map(([cat, amounts]) => {
        const cols = amounts.slice(0, 12).map(amt => `<td class="text-right px-1 py-1 border-r border-slate-300 text-[8px]">${amt > 0 ? new Intl.NumberFormat('id-ID').format(amt) : '-'}</td>`).join('');
        const total = `<td class="text-right px-1 py-1 font-bold text-[8px] bg-slate-50">${new Intl.NumberFormat('id-ID').format(amounts[12])}</td>`;
        return `<tr><td class="px-1 py-1 border-r border-slate-300 font-medium text-[8px] truncate max-w-[100px]">${cat}</td>${cols}${total}</tr>`;
    }).join('');

    // Generate Month Headers
    const monthHeaders = shortMonths.map(m => `<th class="px-1 py-1 border-r border-slate-400 w-[6%]">${m}</th>`).join('');

    // Totals Rows
    const revenueCols = annualData.revenuePerMonth.slice(0, 12).map(amt => `<td class="text-right px-1 py-1 border-r border-slate-300 text-[8px] font-bold text-green-700 bg-green-50">${amt > 0 ? new Intl.NumberFormat('id-ID').format(amt) : '-'}</td>`).join('');
    const revenueTotal = `<td class="text-right px-1 py-1 font-bold text-[8px] bg-green-100 text-green-800">${new Intl.NumberFormat('id-ID').format(annualData.revenuePerMonth[12])}</td>`;
    
    const expenseTotalCols = annualData.expensePerMonth.slice(0, 12).map(amt => `<td class="text-right px-1 py-1 border-r border-slate-300 text-[8px] font-bold text-red-700 bg-red-50">${amt > 0 ? '(' + new Intl.NumberFormat('id-ID').format(amt) + ')' : '-'}</td>`).join('');
    const expenseTotalAll = `<td class="text-right px-1 py-1 font-bold text-[8px] bg-red-100 text-red-800">(${new Intl.NumberFormat('id-ID').format(annualData.expensePerMonth[12])})</td>`;
    
    const profitCols = annualData.netProfitPerMonth.slice(0, 12).map(amt => `<td class="text-right px-1 py-1 border-r border-slate-300 text-[8px] font-bold ${amt < 0 ? 'text-red-600' : 'text-slate-900'}">${new Intl.NumberFormat('id-ID').format(amt)}</td>`).join('');
    const profitTotal = `<td class="text-right px-1 py-1 font-bold text-[8px] bg-slate-200 border border-slate-300">${new Intl.NumberFormat('id-ID').format(annualData.netProfitPerMonth[12])}</td>`;

    const printContent = `
      <!DOCTYPE html><html><head><title>Laporan Tahunan - ${selectedYear}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
        @page { size: A4 landscape; margin: 10mm; }
        @media print { .no-print { display: none; } }
        table { border-collapse: collapse; width: 100%; }
        td, th { white-space: nowrap; }
      </style>
      </head><body class="bg-white p-4 mx-auto text-slate-900">
        <div class="text-center mb-6 border-b-2 border-slate-800 pb-2">
            <h1 class="text-lg font-bold uppercase">${settings.companyName}</h1>
            <h2 class="text-xl font-bold mt-1 underline">LAPORAN LABA RUGI TAHUNAN</h2>
            <p class="text-sm font-medium mt-1">Tahun Buku: ${selectedYear}</p>
        </div>

        <table class="w-full border border-slate-400">
            <thead>
                <tr class="bg-slate-800 text-white text-[9px] uppercase">
                    <th class="px-2 py-2 text-left border-r border-slate-400 w-[15%]">Keterangan</th>
                    ${monthHeaders}
                    <th class="px-2 py-2 w-[8%] bg-slate-700">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                <!-- PENDAPATAN -->
                <tr class="bg-slate-100"><td colspan="14" class="px-1 py-1 font-bold text-[9px] border-b border-slate-300">A. PENDAPATAN USAHA</td></tr>
                <tr class="border-b border-slate-300">
                    <td class="px-1 py-1 border-r border-slate-300 font-medium text-[8px]">Total Pendapatan (Invoice)</td>
                    ${revenueCols}
                    ${revenueTotal}
                </tr>

                <!-- BEBAN -->
                <tr class="bg-slate-100"><td colspan="14" class="px-1 py-1 font-bold text-[9px] border-b border-slate-300 mt-2">B. BEBAN OPERASIONAL</td></tr>
                ${expenseRows}
                <tr class="border-t-2 border-slate-400 bg-slate-50">
                    <td class="px-1 py-1 border-r border-slate-300 font-bold text-[8px] uppercase">Total Beban</td>
                    ${expenseTotalCols}
                    ${expenseTotalAll}
                </tr>

                <!-- LABA BERSIH -->
                 <tr class="bg-slate-200 border-t-2 border-slate-800">
                    <td class="px-1 py-2 border-r border-slate-400 font-bold text-[9px] uppercase">Laba / (Rugi) Bersih</td>
                    ${profitCols}
                    ${profitTotal}
                </tr>
            </tbody>
        </table>
        
        <div class="mt-4 text-[8px] text-slate-400 italic text-right">Dicetak pada ${new Date().toLocaleString('id-ID')}</div>
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(printContent); printWindow.document.close(); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
            <p className="text-sm text-slate-500">Analisa laba rugi perusahaan</p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setReportType('MONTHLY')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${reportType === 'MONTHLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <PieChart className="w-4 h-4" /> Laporan Bulanan
            </button>
            <button 
                onClick={() => setReportType('ANNUAL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${reportType === 'ANNUAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileBarChart className="w-4 h-4" /> Laporan Tahunan
            </button>
        </div>

        <button 
            onClick={reportType === 'MONTHLY' ? handlePrintMonthly : handlePrintAnnual}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-2 shadow-sm transition"
        >
            <Printer className="w-4 h-4" /> Cetak PDF
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
            {reportType === 'MONTHLY' && (
                <div className="animate-in fade-in">
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

       {/* --- MONTHLY REPORT VIEW --- */}
       {reportType === 'MONTHLY' && (
           <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
               {/* Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan (Tagihan)</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {currencyFormatter.format(monthlyData.totalRevenue)}
                                </p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                            <Wallet className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">Kas Masuk (Real): <span className="font-semibold text-slate-700">{new Intl.NumberFormat('id-ID').format(monthlyData.totalCashReceived)}</span></p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Beban / Biaya</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {currencyFormatter.format(monthlyData.totalExpense)}
                                </p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="w-6 h-6 text-red-600" /></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Akumulasi pengeluaran operasional</p>
                    </div>

                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Laba / (Rugi) Bersih</p>
                            <p className={`text-3xl font-bold mt-1 ${monthlyData.netProfit >= 0 ? 'text-white' : 'text-red-300'}`}>
                                {currencyFormatter.format(monthlyData.netProfit)}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Pendapatan - Beban</p>
                        </div>
                        <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 z-0" />
                    </div>
               </div>

               {/* Detailed Breakdown */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" /> Rincian Pendapatan (per Klien)
                            </h3>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(monthlyData.revenueByClient).length > 0 ? (
                                        Object.entries(monthlyData.revenueByClient)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([client, amount], idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 text-slate-700">{client}</td>
                                                <td className="px-6 py-3 text-right font-medium text-slate-900">
                                                    {new Intl.NumberFormat('id-ID').format(amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">Belum ada pendapatan bulan ini.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-600" /> Rincian Biaya (per Kategori)
                            </h3>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(monthlyData.expenseByCategory).length > 0 ? (
                                        Object.entries(monthlyData.expenseByCategory)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([cat, amount], idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 text-slate-700">{cat}</td>
                                                <td className="px-6 py-3 text-right font-medium text-red-600">
                                                    {new Intl.NumberFormat('id-ID').format(amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">Belum ada pengeluaran bulan ini.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
               </div>
           </div>
       )}

       {/* --- ANNUAL REPORT VIEW --- */}
       {reportType === 'ANNUAL' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-4 duration-300">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Rincian Laba Rugi Tahunan ({selectedYear})</h3>
                    <div className="text-xs text-slate-500 italic">Geser tabel untuk melihat seluruh bulan</div>
               </div>
               <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                        <thead className="bg-slate-800 text-white uppercase font-bold">
                            <tr>
                                <th className="px-4 py-3 sticky left-0 bg-slate-800 z-10 w-48">Kategori</th>
                                {months.map((m) => <th key={m} className="px-3 py-3 text-right min-w-[80px]">{m.substring(0,3)}</th>)}
                                <th className="px-4 py-3 text-right bg-slate-700 font-bold min-w-[100px]">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Revenue Row */}
                            <tr className="bg-green-50/50">
                                <td className="px-4 py-3 font-bold text-slate-800 sticky left-0 bg-green-50/50 z-10 border-r border-green-100">Pendapatan Usaha</td>
                                {annualData.revenuePerMonth.slice(0, 12).map((amt, idx) => (
                                    <td key={idx} className="px-3 py-3 text-right font-medium text-green-700">
                                        {amt !== 0 ? new Intl.NumberFormat('id-ID').format(amt) : '-'}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-bold text-green-800 bg-green-100">
                                    {new Intl.NumberFormat('id-ID').format(annualData.revenuePerMonth[12])}
                                </td>
                            </tr>

                            {/* Separator */}
                            <tr className="bg-slate-100"><td colSpan={14} className="px-4 py-2 font-bold text-slate-500 text-[10px] uppercase sticky left-0 bg-slate-100">Beban Operasional</td></tr>

                            {/* Expense Rows */}
                            {Object.entries(annualData.expenseByCategoryPerMonth).length > 0 ? (
                                Object.entries(annualData.expenseByCategoryPerMonth).map(([cat, amounts]) => (
                                    <tr key={cat} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-600 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100">{cat}</td>
                                        {amounts.slice(0, 12).map((amt, idx) => (
                                            <td key={idx} className="px-3 py-2 text-right text-slate-500">
                                                {amt !== 0 ? new Intl.NumberFormat('id-ID').format(amt) : '-'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-bold text-slate-700 bg-slate-50">
                                            {new Intl.NumberFormat('id-ID').format(amounts[12])}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={14} className="px-4 py-4 text-center text-slate-400 italic">Tidak ada data pengeluaran tahun ini.</td></tr>
                            )}

                            {/* Total Expense Row */}
                            <tr className="bg-red-50/50 border-t border-red-100">
                                <td className="px-4 py-3 font-bold text-slate-800 sticky left-0 bg-red-50/50 z-10 border-r border-red-100">Total Beban</td>
                                {annualData.expensePerMonth.slice(0, 12).map((amt, idx) => (
                                    <td key={idx} className="px-3 py-3 text-right font-bold text-red-600">
                                        {amt !== 0 ? `(${new Intl.NumberFormat('id-ID').format(amt)})` : '-'}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-bold text-red-800 bg-red-100">
                                    ({new Intl.NumberFormat('id-ID').format(annualData.expensePerMonth[12])})
                                </td>
                            </tr>

                            {/* Net Profit Row */}
                             <tr className="bg-slate-800 text-white border-t-2 border-slate-900">
                                <td className="px-4 py-4 font-bold uppercase sticky left-0 bg-slate-800 z-10 border-r border-slate-700">Laba / (Rugi) Bersih</td>
                                {annualData.netProfitPerMonth.slice(0, 12).map((amt, idx) => (
                                    <td key={idx} className={`px-3 py-4 text-right font-bold ${amt < 0 ? 'text-red-300' : 'text-green-300'}`}>
                                        {new Intl.NumberFormat('id-ID').format(amt)}
                                    </td>
                                ))}
                                <td className="px-4 py-4 text-right font-bold text-white bg-slate-700">
                                    {new Intl.NumberFormat('id-ID').format(annualData.netProfitPerMonth[12])}
                                </td>
                            </tr>
                        </tbody>
                    </table>
               </div>
           </div>
       )}
    </div>
  );
};
