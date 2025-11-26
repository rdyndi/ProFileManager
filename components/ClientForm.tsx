
import React, { useState } from 'react';
import { Client, EntityType, AttachedFile } from '../types';
import { Save, X, Upload, Link as LinkIcon, Plus } from 'lucide-react';

interface ClientFormProps {
  onSave: (client: Client) => void;
  onCancel: () => void;
  initialData?: Client;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Client>>(initialData || {
    type: 'PT',
    files: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State untuk Input Link Manual
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((f: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        uploadDate: Date.now()
      }));
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...newFiles]
      }));
    }
  };

  const handleAddLink = () => {
    if (!newLinkName || !newLinkUrl) {
        alert("Nama berkas dan URL wajib diisi!");
        return;
    }

    const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: newLinkName,
        uploadDate: Date.now(),
        url: newLinkUrl
    };

    setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), newFile]
    }));

    setNewLinkName('');
    setNewLinkUrl('');
    setShowLinkInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Nama wajib diisi';
    if (!formData.address) newErrors.address = 'Alamat wajib diisi';
    if (!formData.contactNumber) newErrors.contactNumber = 'Nomor kontak wajib diisi';
    if (!formData.email) newErrors.email = 'Email wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Logika Prefix Nama Badan Usaha
    let finalName = formData.name || '';
    const type = formData.type as string; 

    const prefixMap: Record<string, string> = {
        'PT': 'PT ',
        'CV': 'CV ',
        'YAYASAN': 'YAYASAN ',
        'PERKUMPULAN': 'PERKUMPULAN '
    };

    if (prefixMap[type]) {
        const prefix = prefixMap[type];
        if (!finalName.toUpperCase().startsWith(prefix.trim())) {
            finalName = `${prefix}${finalName}`;
        }
    }

    const clientToSave: Client = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      name: finalName,
      picName: formData.picName || '', 
      type: formData.type as EntityType,
      address: formData.address!,
      contactNumber: formData.contactNumber!,
      email: formData.email!,
      nibSiup: formData.nibSiup || '',
      createdAt: formData.createdAt || Date.now(),
      files: formData.files || []
    };

    onSave(clientToSave);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">
          {initialData ? 'Edit Data Klien' : 'Input Klien Baru'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Badan Usaha</label>
            <select 
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="PT">Perseroan Terbatas (PT)</option>
              <option value="CV">Persekutuan Komanditer (CV)</option>
              <option value="YAYASAN">Yayasan</option>
              <option value="PERKUMPULAN">Perkumpulan</option>
              <option value="Perorangan">Perorangan / Pribadi</option>
              <option value="Lainnya">Badan Usaha Lainnya</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama {formData.type === 'Perorangan' ? 'Lengkap' : 'Perusahaan'}</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder={formData.type === 'Perorangan' ? "Nama Pemilik" : "Nama Perusahaan (Tanpa PT/CV)"}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-primary-500'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="col-span-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama PIC / Penanggung Jawab</label>
            <input
              type="text"
              name="picName"
              value={formData.picName || ''}
              onChange={handleChange}
              placeholder="Contoh: Budi Santoso (Direktur)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
            <textarea
              name="address"
              rows={3}
              value={formData.address || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.address ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-primary-500'}`}
            />
             {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Kontak / HP</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.contactNumber ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-primary-500'}`}
            />
             {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-primary-500'}`}
            />
             {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor NIB / SIUP (Opsional)</label>
            <input
              type="text"
              name="nibSiup"
              value={formData.nibSiup || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

           <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Dokumen Pendukung</label>
            
            {/* Opsi Upload atau Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 mb-2 text-slate-400" />
                    <p className="text-xs font-medium text-center">Upload File Lokal<br/><span className="text-[10px] text-slate-400">(Drag & Drop)</span></p>
                </div>

                <div 
                    onClick={() => setShowLinkInput(true)}
                    className="border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                    <LinkIcon className="w-6 h-6 mb-2 text-blue-400" />
                    <p className="text-xs font-medium text-center">Tambah Link G-Drive<br/><span className="text-[10px] text-blue-400">(URL Eksternal)</span></p>
                </div>
            </div>

            {/* Input Link Form */}
            {showLinkInput && (
                <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Input Link Dokumen
                    </h4>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Nama Dokumen (Contoh: Akta Pendirian.pdf)"
                            value={newLinkName}
                            onChange={(e) => setNewLinkName(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="URL Link (Contoh: https://drive.google.com/...)"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowLinkInput(false)}
                                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddLink}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Tambah Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List File */}
            {formData.files && formData.files.length > 0 && (
              <div className="space-y-2">
                {formData.files.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-sm">
                     <div className="flex items-center gap-2 overflow-hidden">
                        {file.url ? (
                            <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        ) : (
                            <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-slate-700">{file.name}</span>
                        {file.url && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Link</span>}
                     </div>
                     <button 
                        type="button"
                        onClick={() => {
                            const newFiles = formData.files?.filter((_, i) => i !== idx);
                            setFormData({...formData, files: newFiles});
                        }}
                        className="text-slate-400 hover:text-red-500 px-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Data
          </button>
        </div>
      </form>
    </div>
  );
};
