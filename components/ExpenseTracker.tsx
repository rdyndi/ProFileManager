import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Pencil, Calendar, Wallet, TrendingDown, Search, X, Save, Banknote } from 'lucide-react';

interface ExpenseTrackerProps {
    expenses: Expense[];
    onSave: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

const CATEGORIES = ['Operasional Kantor', 'ATK & Cetak', 'Konsumsi', 'Transportasi', 'Gaji Pegawai', 'Listrik & Air', 'Internet & Telepon', 'Pajak & PNBP', 'Lainnya'];

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ expenses, onSave, onDelete }) => {
    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filter State
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    // Form State
    const [formData, setFormData] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Operasional Kantor',
        amount: 0,
        paymentMethod: 'Cash',
        note: ''
    });

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Filter Logic
    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const matchMonth = expDate.getMonth() === filterMonth;
            const matchYear = expDate.getFullYear() === filterYear;
            const matchSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                exp.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchMonth && matchYear && matchSearch;
        });
    }, [expenses, filterMonth, filterYear, searchQuery]);

    // Stats Logic
    const stats = useMemo(() => {
        const totalThisMonth = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const totalAllTime = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        return { totalThisMonth, totalAllTime };
    }, [expenses, filteredExpenses]);

    // Handlers
    const handleOpenForm = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData(expense);
        } else {
            setEditingExpense(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: 'Operasional Kantor',
                amount: 0,
                paymentMethod: 'Cash',
                note: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || formData.amount <= 0) {
            alert("Mohon lengkapi deskripsi dan jumlah biaya.");
            return;
        }

        const expenseToSave: Expense = {
            id: editingExpense?.id || Math.random().toString(36).substr(2, 9),
            date: formData.date!,
            description: formData.description!,
            category: formData.category!,
            amount: Number(formData.amount),
            paymentMethod: formData.paymentMethod as 'Cash' | 'Transfer',
            note: formData.note || '',
            createdAt: editingExpense?.createdAt || Date.now()
        };

        onSave(expenseToSave);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Biaya & Pengeluaran</h2>
                <button 
                    onClick={() => handleOpenForm()} 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Catat Pengeluaran
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran ({months[filterMonth]} {filterYear})</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalThisMonth)}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg"><Wallet className="w-5 h-5 text-red-600" /></div>
                    </div>
                    <p className="text-xs text-slate-500">Filter berdasarkan bulan yang dipilih</p>
                </div>
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran (Semua Waktu)</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalAllTime)}</p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg"><TrendingDown className="w-5 h-5 text-orange-600" /></div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(Number(e.target.value))}
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
                        value={filterYear}
                        onChange={(e) => setFilterYear(Number(e.target.value))}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                    >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                     <label className="block text-xs font-medium text-slate-500 mb-1">Cari Pengeluaran</label>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Cari deskripsi atau kategori..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500" 
                        />
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Deskripsi</th>
                                <th className="px-6 py-3">Kategori</th>
                                <th className="px-6 py-3">Metode</th>
                                <th className="px-6 py-3 text-right">Jumlah</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(exp.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800">{exp.description}</p>
                                            {exp.note && <p className="text-xs text-slate-400 italic">{exp.note}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{exp.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{exp.paymentMethod}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(exp.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenForm(exp)} className="p-2 text-slate-400 hover:text-blue-600 transition"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => { if(window.confirm('Hapus data pengeluaran ini?')) onDelete(exp.id); }} className="p-2 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                        Tidak ada data pengeluaran untuk periode ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                     <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Pengeluaran</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Contoh: Beli Kertas A4, Bayar Listrik, dll"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                                    <input 
                                        type="text" 
                                        value={new Intl.NumberFormat('id-ID').format(Number(formData.amount))}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setFormData({...formData, amount: Number(raw)});
                                        }}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-lg font-semibold text-red-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Metode Bayar</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as 'Cash' | 'Transfer'})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="Cash">Cash / Tunai</option>
                                        <option value="Transfer">Transfer Bank</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    rows={2}
                                    value={formData.note}
                                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-50 mt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex justify-center items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Simpan Data
                                </button>
                            </div>
                        </form>
                     </div>
                </div>
            )}
        </div>
    );
}
