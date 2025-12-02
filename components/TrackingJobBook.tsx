
import React, { useState, useMemo } from 'react';
import { TrackingJob, Client, TrackingDeedStatus, TrackingMinutesStatus, TrackingAHUStatus, TrackingStatus } from '../types';
import { Plus, Search, Pencil, Trash2, X, Save, ArrowLeft, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';

interface TrackingJobBookProps {
  jobs: TrackingJob[];
  clients: Client[];
  onSave: (job: TrackingJob) => void;
  onDelete: (id: string) => void;
}

export const TrackingJobBook: React.FC<TrackingJobBookProps> = ({ jobs, clients, onSave, onDelete }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Default Form State
  const initialFormState: Partial<TrackingJob> = {
    clientId: '',
    clientName: '',
    jobName: '',
    needsDeed: false,
    deedStatus: 'Draft Sedang Proses',
    deedNumber: '',
    deedDate: new Date().toISOString().split('T')[0],
    minutesStatus: 'Tidak Perlu',
    inputAHU: false,
    ahuStatus: 'Sedang Diinput',
    printNPWP: false,
    npwpStatus: 'Belum Terbit',
    issueNIB: false,
    nibStatus: 'Belum Terbit',
    nibConstraint: '',
    isJobDelivered: false,
    isMinuteReturned: false,
    isMinuteFinished: false,
    manualProgress: '',
  };

  const [formData, setFormData] = useState<Partial<TrackingJob>>(initialFormState);

  // Filter Logic - SAFEGUARDED against null/undefined
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter(j => {
        if (!j) return false;
        const cName = j.clientName || '';
        const jName = j.jobName || '';
        return cName.toLowerCase().includes(searchQuery.toLowerCase()) || 
               jName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [jobs, searchQuery]);

  // Handlers
  const handleOpenForm = (job?: TrackingJob) => {
    if (job) {
        setEditingId(job.id);
        setFormData(job);
    } else {
        setEditingId(null);
        setFormData(initialFormState);
    }
    setViewState('form');
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = (clients || []).find(c => c && c.id === clientId);
    setFormData({
        ...formData,
        clientId,
        clientName: client ? client.name : ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.jobName) {
        alert("Nama Klien dan Nama Pekerjaan wajib diisi!");
        return;
    }

    const jobToSave: TrackingJob = {
        // Required fields
        id: editingId || Math.random().toString(36).substr(2, 9),
        clientId: formData.clientId || '',
        clientName: formData.clientName || '',
        jobName: formData.jobName || '',
        createdAt: formData.createdAt || Date.now(),
        updatedAt: Date.now(),
        
        // Booleans & Defaults
        needsDeed: !!formData.needsDeed,
        inputAHU: !!formData.inputAHU,
        printNPWP: !!formData.printNPWP,
        issueNIB: !!formData.issueNIB,
        isJobDelivered: !!formData.isJobDelivered,
        isMinuteReturned: !!formData.isMinuteReturned,
        isMinuteFinished: !!formData.isMinuteFinished,

        // Conditionals (Optional based on boolean)
        deedStatus: formData.deedStatus,
        deedNumber: formData.deedNumber,
        deedDate: formData.deedDate,
        minutesStatus: formData.minutesStatus,
        ahuStatus: formData.ahuStatus,
        npwpStatus: formData.npwpStatus,
        nibStatus: formData.nibStatus,
        nibConstraint: formData.nibConstraint,
        manualProgress: formData.manualProgress || '',
    };

    onSave(jobToSave);
    setViewState('list');
  };

  // --- LIST VIEW ---
  if (viewState === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Tracking Pekerjaan</h2>
                <button 
                    onClick={() => handleOpenForm()} 
                    className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Pekerjaan Baru</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Cari nama klien atau pekerjaan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map(job => {
                        if (!job) return null; // Safe check against null items
                        
                        // Calculate Status: 
                        // If Needs Deed: All 3 (Delivered, Returned, Finished) must be checked.
                        // If No Deed: Only Delivered must be checked.
                        const isFinished = job.needsDeed 
                            ? (job.isJobDelivered && job.isMinuteReturned && job.isMinuteFinished)
                            : job.isJobDelivered;

                        return (
                        <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-primary-300 transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800 text-lg">{job.clientName}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${isFinished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {isFinished ? 'Selesai' : 'Belum Selesai'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">{job.jobName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenForm(job)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded hover:bg-blue-50 transition"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => { if(window.confirm('Hapus tracking ini?')) onDelete(job.id); }} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                                {/* Status Chips */}
                                <div className="space-y-1">
                                    <span className="block text-slate-400 font-medium">Status Akta</span>
                                    {job.needsDeed ? (
                                        <span className={`px-2 py-1 rounded font-medium ${job.deedStatus === 'Akta Sudah Dicetak' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {job.deedStatus}
                                        </span>
                                    ) : <span className="text-slate-400 font-medium italic">Tidak Ada Akta</span>}
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-slate-400 font-medium">AHU</span>
                                    {job.inputAHU ? (
                                        <span className={`px-2 py-1 rounded font-medium ${job.ahuStatus === 'Sudah Dicetak' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {job.ahuStatus}
                                        </span>
                                    ) : <span className="text-slate-400">-</span>}
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-slate-400 font-medium">Pajak/NIB</span>
                                    <div className="flex flex-col gap-1">
                                        {job.printNPWP && <span className="text-xs">NPWP: {job.npwpStatus}</span>}
                                        {job.issueNIB && <span className={`text-xs ${job.nibStatus === 'Belum Terbit' ? 'text-red-500' : 'text-green-600'}`}>NIB: {job.nibStatus}</span>}
                                        {!job.printNPWP && !job.issueNIB && <span className="text-slate-400">-</span>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-slate-400 font-medium">Progress</span>
                                    <div className="flex items-center gap-2">
                                        {job.needsDeed && (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${job.isMinuteFinished ? 'bg-green-500' : 'bg-slate-300'}`} title="Minuta Selesai"></div>
                                                <div className={`w-2 h-2 rounded-full ${job.isMinuteReturned ? 'bg-green-500' : 'bg-slate-300'}`} title="Minuta Dikembalikan"></div>
                                            </>
                                        )}
                                        <div className={`w-2 h-2 rounded-full ${job.isJobDelivered ? 'bg-green-500' : 'bg-slate-300'}`} title="Pekerjaan Dikirim"></div>
                                        <span className={`ml-1 font-bold ${isFinished ? 'text-green-600' : 'text-slate-500'}`}>{isFinished ? 'Selesai' : 'Proses'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Manual Progress Preview */}
                            {job.manualProgress && (
                                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 italic flex gap-2">
                                    <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                                    <span className="line-clamp-2">{job.manualProgress}</span>
                                </div>
                            )}
                        </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                        Belum ada data tracking pekerjaan.
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- FORM VIEW ---
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => setViewState('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Pekerjaan' : 'Input Pekerjaan Baru'}</h2>
            </div>
            <button onClick={handleSubmit} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition shadow-sm">
                <Save className="w-4 h-4" /> <span className="hidden md:inline">Simpan Data</span>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* DATA UTAMA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Klien</label>
                        <select 
                            value={formData.clientId} 
                            onChange={handleClientChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">-- Pilih Klien --</option>
                            {(clients || []).map(c => {
                                if (!c) return null;
                                return <option key={c.id} value={c.id}>{c.name}</option>
                            })}
                        </select>
                         {/* Fallback Input if client not in list or custom name needed */}
                        {!formData.clientId && (
                             <input 
                                type="text" 
                                placeholder="Atau ketik nama klien manual..."
                                value={formData.clientName}
                                onChange={e => setFormData({...formData, clientName: e.target.value})}
                                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pekerjaan</label>
                        <input 
                            type="text" 
                            value={formData.jobName}
                            onChange={e => setFormData({...formData, jobName: e.target.value})}
                            placeholder="Contoh: Pendirian PT Maju Jaya"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* AKTA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800">Dokumen Akta</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 mr-2">Butuh mencetak Akta?</label>
                        <div className="flex bg-slate-100 rounded p-1">
                            <button type="button" onClick={() => setFormData({...formData, needsDeed: true})} className={`px-3 py-1 rounded text-xs font-medium transition ${formData.needsDeed ? 'bg-white shadow text-primary-600' : 'text-slate-500'}`}>Ya</button>
                            <button type="button" onClick={() => setFormData({...formData, needsDeed: false})} className={`px-3 py-1 rounded text-xs font-medium transition ${!formData.needsDeed ? 'bg-white shadow text-slate-600' : 'text-slate-500'}`}>Tidak</button>
                        </div>
                    </div>
                </div>

                {formData.needsDeed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status Akta</label>
                            <select 
                                value={formData.deedStatus} 
                                onChange={e => setFormData({...formData, deedStatus: e.target.value as TrackingDeedStatus})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                            >
                                <option value="Sudah Dibuat">Sudah Dibuat</option>
                                <option value="Draft Sedang Proses">Draft Sedang Proses</option>
                                <option value="Draft Dikirim">Draft Dikirim</option>
                                <option value="Draft Masih Ditinjau">Draft Masih Ditinjau</option>
                                <option value="Draft Disetujui (Belum Cetak)">Draft Disetujui (Belum Cetak)</option>
                                <option value="Akta Sudah Dicetak">Akta Sudah Dicetak</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status Notulen</label>
                            <select 
                                value={formData.minutesStatus} 
                                onChange={e => setFormData({...formData, minutesStatus: e.target.value as TrackingMinutesStatus})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                            >
                                <option value="Tidak Perlu">Tidak Perlu</option>
                                <option value="Sedang Proses">Sedang Proses</option>
                                <option value="Sudah Dikirim">Sudah Dikirim</option>
                                <option value="Sedang Ditandatangani">Sedang Ditandatangani</option>
                                <option value="Sudah Dikirim (Proses Akta)">Sudah Dikirim (Proses Akta)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Akta</label>
                            <input 
                                type="text" 
                                value={formData.deedNumber}
                                onChange={e => setFormData({...formData, deedNumber: e.target.value})}
                                placeholder="Kosongkan jika belum ada"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Akta</label>
                            <input 
                                type="date" 
                                value={formData.deedDate}
                                onChange={e => setFormData({...formData, deedDate: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* AHU (CONDITIONAL) */}
            {formData.needsDeed && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800">Sistem AHU</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 mr-2">Input di AHU?</label>
                        <div className="flex bg-slate-100 rounded p-1">
                            <button type="button" onClick={() => setFormData({...formData, inputAHU: true})} className={`px-3 py-1 rounded text-xs font-medium transition ${formData.inputAHU ? 'bg-white shadow text-primary-600' : 'text-slate-500'}`}>Ya</button>
                            <button type="button" onClick={() => setFormData({...formData, inputAHU: false})} className={`px-3 py-1 rounded text-xs font-medium transition ${!formData.inputAHU ? 'bg-white shadow text-slate-600' : 'text-slate-500'}`}>Tidak</button>
                        </div>
                    </div>
                </div>
                
                {formData.inputAHU && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status di AHU</label>
                        <select 
                            value={formData.ahuStatus} 
                            onChange={e => setFormData({...formData, ahuStatus: e.target.value as TrackingAHUStatus})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                            <option value="Sedang Diinput">Sedang Diinput</option>
                            <option value="Peninjauan">Peninjauan</option>
                            <option value="Sudah Dicetak">Sudah Dicetak</option>
                        </select>
                    </div>
                )}
            </div>
            )}

            {/* PAJAK & NIB (CONDITIONAL) */}
            {formData.needsDeed && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Pajak & Perizinan (OSS)</h3>
                
                {/* NPWP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="printNPWP" 
                                checked={formData.printNPWP}
                                onChange={e => setFormData({...formData, printNPWP: e.target.checked})}
                                className="w-4 h-4 text-primary-600 rounded"
                            />
                            <label htmlFor="printNPWP" className="text-sm font-medium text-slate-700">Mencetak NPWP?</label>
                        </div>
                        {formData.printNPWP && (
                            <div className="pl-6 animate-in fade-in">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status NPWP</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="radio" name="npwpStatus" value="Sudah Terbit" checked={formData.npwpStatus === 'Sudah Terbit'} onChange={e => setFormData({...formData, npwpStatus: 'Sudah Terbit'})} className="text-green-600" />
                                        <span>Sudah Terbit</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="radio" name="npwpStatus" value="Belum Terbit" checked={formData.npwpStatus === 'Belum Terbit'} onChange={e => setFormData({...formData, npwpStatus: 'Belum Terbit'})} className="text-slate-600" />
                                        <span>Belum Terbit</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NIB */}
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="issueNIB" 
                                checked={formData.issueNIB}
                                onChange={e => setFormData({...formData, issueNIB: e.target.checked})}
                                className="w-4 h-4 text-primary-600 rounded"
                            />
                            <label htmlFor="issueNIB" className="text-sm font-medium text-slate-700">Menerbitkan NIB?</label>
                        </div>
                        {formData.issueNIB && (
                            <div className="pl-6 animate-in fade-in space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Status NIB</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="nibStatus" value="Sudah Terbit" checked={formData.nibStatus === 'Sudah Terbit'} onChange={e => setFormData({...formData, nibStatus: 'Sudah Terbit'})} className="text-green-600" />
                                            <span>Sudah Terbit</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="radio" name="nibStatus" value="Belum Terbit" checked={formData.nibStatus === 'Belum Terbit'} onChange={e => setFormData({...formData, nibStatus: 'Belum Terbit'})} className="text-slate-600" />
                                            <span>Belum Terbit</span>
                                        </label>
                                    </div>
                                </div>
                                {formData.nibStatus === 'Belum Terbit' && (
                                    <div>
                                        <label className="block text-xs font-medium text-red-500 mb-1">Kendala / Masalah</label>
                                        <textarea 
                                            rows={2}
                                            placeholder="Tulis kendala pengurusan NIB..."
                                            value={formData.nibConstraint}
                                            onChange={e => setFormData({...formData, nibConstraint: e.target.value})}
                                            className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg outline-none text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* CHECKLIST FINAL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Status Akhir</h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isJobDelivered ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                            {formData.isJobDelivered && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={formData.isJobDelivered} onChange={e => setFormData({...formData, isJobDelivered: e.target.checked})} />
                        <span className="text-sm font-medium text-slate-700">Hasil Pekerjaan sudah dikirim ke klien?</span>
                    </label>
                    
                    {formData.needsDeed && (
                        <>
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer animate-in fade-in">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isMinuteReturned ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                                    {formData.isMinuteReturned && <CheckCircle className="w-3.5 h-3.5" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.isMinuteReturned} onChange={e => setFormData({...formData, isMinuteReturned: e.target.checked})} />
                                <span className="text-sm font-medium text-slate-700">Minuta sudah dikembalikan?</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer animate-in fade-in">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isMinuteFinished ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                                    {formData.isMinuteFinished && <CheckCircle className="w-3.5 h-3.5" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.isMinuteFinished} onChange={e => setFormData({...formData, isMinuteFinished: e.target.checked})} />
                                <span className="text-sm font-medium text-slate-700">Minuta sudah selesai (Arsip)?</span>
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* CATATAN PROGRES MANUAL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-600"/>
                    Catatan Progres Manual
                </h3>
                <textarea 
                    rows={4}
                    placeholder="Tuliskan detail progres, kendala, atau catatan tambahan di sini..."
                    value={formData.manualProgress}
                    onChange={e => setFormData({...formData, manualProgress: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
            </div>

        </form>
    </div>
  );
};
