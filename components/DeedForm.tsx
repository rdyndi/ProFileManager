
import React, { useState, useEffect } from 'react';
import { Client, Deed, DeedAppearer, DeedGrantor } from '../types';
import { Save, X, Plus, Trash2, Search, User, UserPlus } from 'lucide-react';

interface DeedFormProps {
  clients: Client[];
  deeds: Deed[]; // Add deeds to props for auto-numbering
  onSave: (deed: Deed) => void;
  onCancel: () => void;
  onAddClient: () => void;
  initialData?: Deed;
}

export const DeedForm: React.FC<DeedFormProps> = ({ clients, deeds, onSave, onCancel, onAddClient, initialData }) => {
  const [formData, setFormData] = useState<Partial<Deed>>(initialData || {
    orderNumber: '',
    deedNumber: '',
    deedDate: new Date().toISOString().split('T')[0],
    deedTitle: '',
    appearers: []
  });

  const [appearers, setAppearers] = useState<DeedAppearer[]>(initialData?.appearers || [
    { id: Math.random().toString(36).substr(2, 9), name: '', role: 'Self' }
  ]);

  const [selectedClientId, setSelectedClientId] = useState<string>(initialData?.clientId || '');

  // --- Auto Numbering Logic ---
  useEffect(() => {
    // Only run this logic if we are CREATING a new deed (not editing)
    if (initialData) return;

    const date = new Date(formData.deedDate || new Date());
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11

    // 1. Calculate Deed Number (Nomor Akta) - Resets Monthly
    // Filter deeds for specific Month & Year
    const deedsInMonth = deeds.filter(d => {
        const dDate = new Date(d.deedDate);
        return dDate.getFullYear() === year && dDate.getMonth() === month;
    });

    let maxDeedNum = 0;
    deedsInMonth.forEach(d => {
        // Extract number from string (e.g. "01" -> 1)
        const num = parseInt(d.deedNumber.replace(/\D/g, '')) || 0;
        if (num > maxDeedNum) maxDeedNum = num;
    });
    
    // Auto increment from last, or start at 1 if new month
    const nextDeedNum = maxDeedNum + 1;
    // Format: 2 digits if < 10 (e.g. 01, 09, 10, 100)
    const formattedDeedNum = nextDeedNum < 10 ? `0${nextDeedNum}` : `${nextDeedNum}`;


    // 2. Calculate Order Number (Nomor Urut) - Resets Yearly
    // Filter deeds for specific Year
    const deedsInYear = deeds.filter(d => {
        const dDate = new Date(d.deedDate);
        return dDate.getFullYear() === year;
    });

    let maxOrderNum = 0;
    deedsInYear.forEach(d => {
        // Parse int directly. parseInt("001") -> 1. parseInt("005/2024") -> 5.
        // This handles both old format (with year) and new format (without year) correctly.
        const num = parseInt(d.orderNumber) || 0;
        if (num > maxOrderNum) maxOrderNum = num;
    });

    const nextOrderNum = maxOrderNum + 1;
    // Format: 001 (Just the number, 3 digits padded)
    const formattedOrderNum = nextOrderNum.toString().padStart(3, '0');

    // Update state without overwriting user manual edits if they differ significantly? 
    // For now, we overwrite on date change as per standard "auto" behavior.
    setFormData(prev => ({
        ...prev,
        deedNumber: formattedDeedNum,
        orderNumber: formattedOrderNum
    }));

  }, [formData.deedDate, deeds, initialData]);


  // --- Handlers for Appearers (Penghadap) ---

  const addAppearer = () => {
    setAppearers([
      ...appearers,
      { id: Math.random().toString(36).substr(2, 9), name: '', role: 'Self' }
    ]);
  };

  const removeAppearer = (index: number) => {
    if (appearers.length > 1) {
      setAppearers(appearers.filter((_, i) => i !== index));
    }
  };

  const updateAppearer = (index: number, field: keyof DeedAppearer, value: any) => {
    const newAppearers = [...appearers];
    // @ts-ignore
    newAppearers[index] = { ...newAppearers[index], [field]: value };
    
    if (field === 'role' && value === 'Self') {
        delete newAppearers[index].grantors;
    }
    if (field === 'role' && value === 'Proxy' && !newAppearers[index].grantors) {
        newAppearers[index].grantors = [{ id: Math.random().toString(36).substr(2, 9), name: '' }];
    }

    setAppearers(newAppearers);
  };

  // --- Handlers for Grantors (Pemberi Kuasa) ---

  const addGrantor = (appearerIndex: number) => {
    const newAppearers = [...appearers];
    if (!newAppearers[appearerIndex].grantors) {
        newAppearers[appearerIndex].grantors = [];
    }
    newAppearers[appearerIndex].grantors?.push({
        id: Math.random().toString(36).substr(2, 9), name: ''
    });
    setAppearers(newAppearers);
  };

  const removeGrantor = (appearerIndex: number, grantorIndex: number) => {
    const newAppearers = [...appearers];
    const grantors = newAppearers[appearerIndex].grantors;
    if (grantors && grantors.length > 1) {
        newAppearers[appearerIndex].grantors = grantors.filter((_, i) => i !== grantorIndex);
        setAppearers(newAppearers);
    }
  };

  const updateGrantor = (appearerIndex: number, grantorIndex: number, value: string) => {
    const newAppearers = [...appearers];
    if (newAppearers[appearerIndex].grantors) {
        // @ts-ignore
        newAppearers[appearerIndex].grantors[grantorIndex].name = value;
        setAppearers(newAppearers);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderNumber) return alert("Nomor Urut wajib diisi");
    if (!selectedClientId) return alert("Pilih Klien wajib diisi");
    if (!formData.deedNumber) return alert("Nomor Akta wajib diisi");
    if (!formData.deedDate) return alert("Tanggal Akta wajib diisi");
    if (!formData.deedTitle) return alert("Judul Akta wajib diisi");
    
    for (const app of appearers) {
        if (!app.name) return alert("Nama Penghadap wajib diisi");
        if (app.role === 'Proxy') {
            if (!app.grantors || app.grantors.length === 0) return alert("Nama Pemberi Kuasa wajib diisi untuk penghadap Kuasa");
            for (const gr of app.grantors) {
                if (!gr.name) return alert("Semua kolom Nama Pemberi Kuasa wajib diisi");
            }
        }
    }

    const client = clients.find(c => c.id === selectedClientId);

    const deedToSave: Deed = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      orderNumber: formData.orderNumber!,
      clientId: selectedClientId,
      clientName: client?.name || "Unknown",
      deedNumber: formData.deedNumber!,
      deedDate: formData.deedDate!,
      deedTitle: formData.deedTitle!,
      appearers: appearers,
      createdAt: formData.createdAt || Date.now()
    };

    onSave(deedToSave);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">
          {initialData ? 'Edit Data Akta' : 'Input Akta Baru'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* DATA UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Data Dokumen</h3>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Urut <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                      type="text"
                      value={formData.orderNumber || ''}
                      onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                      placeholder="Contoh: 001"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  {!initialData && <p className="text-[10px] text-slate-400 mt-1 absolute right-0 -bottom-5">Otomatis (Max + 1)</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Klien <span className="text-red-500">*</span></label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                        <option value="">-- Pilih Klien --</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name} - {client.type}</option>
                        ))}
                    </select>
                </div>
                {/* Tombol Tambah Klien Cepat */}
                <button 
                    type="button"
                    onClick={onAddClient}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium mt-2 flex items-center gap-1 ml-1"
                >
                    <UserPlus className="w-3 h-3" />
                    Input Klien Baru
                </button>
            </div>

            {/* ... Sisa form ... */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Akta <span className="text-red-500">*</span></label>
                 <div className="relative">
                    <input
                        type="text"
                        value={formData.deedNumber || ''}
                        onChange={(e) => setFormData({...formData, deedNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                     {!initialData && <p className="text-[10px] text-slate-400 mt-1 absolute right-0 -bottom-5">Otomatis Reset Bulanan</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Akta <span className="text-red-500">*</span></label>
                <input
                    type="date"
                    value={formData.deedDate || ''}
                    onChange={(e) => setFormData({...formData, deedDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Akta <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.deedTitle || ''}
                    onChange={(e) => setFormData({...formData, deedTitle: e.target.value})}
                    placeholder="Contoh: Akta Pendirian PT..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>
        </div>

        {/* DATA PENGHADAP */}
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Para Penghadap</h3>
                <button
                    type="button"
                    onClick={addAppearer}
                    className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-medium hover:bg-primary-100 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Tambah Penghadap
                </button>
            </div>
            
            <div className="space-y-4">
                {appearers.map((appearer, idx) => (
                    <div key={appearer.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative">
                         {appearers.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeAppearer(idx)}
                                className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Penghadap {idx + 1}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={appearer.name}
                                        onChange={(e) => updateAppearer(idx, 'name', e.target.value)}
                                        placeholder="Nama Lengkap"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Bertindak Sebagai</label>
                                <select
                                    value={appearer.role}
                                    onChange={(e) => updateAppearer(idx, 'role', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none text-sm bg-white"
                                >
                                    <option value="Self">Diri Sendiri</option>
                                    <option value="Proxy">Kuasa</option>
                                </select>
                            </div>
                        </div>

                        {/* SECTION KUASA */}
                        {appearer.role === 'Proxy' && (
                            <div className="mt-4 pl-4 border-l-2 border-primary-200 bg-white p-3 rounded-r-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-semibold text-primary-700">Bertindak untuk dan atas nama (Pemberi Kuasa):</h4>
                                    <button
                                        type="button"
                                        onClick={() => addGrantor(idx)}
                                        className="text-[10px] bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Tambah Pemberi Kuasa
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {appearer.grantors?.map((grantor, gIdx) => (
                                        <div key={grantor.id} className="flex gap-2 items-center">
                                            <span className="text-xs text-slate-400 font-mono w-4">{gIdx + 1}.</span>
                                            <input
                                                type="text"
                                                value={grantor.name}
                                                onChange={(e) => updateGrantor(idx, gIdx, e.target.value)}
                                                placeholder="Nama Pemberi Kuasa"
                                                className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:border-primary-500 outline-none"
                                            />
                                            {appearer.grantors!.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeGrantor(idx, gIdx)}
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Akta
          </button>
        </div>
      </form>
    </div>
  );
};
