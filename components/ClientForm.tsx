import React, { useState } from 'react';
import { Client, EntityType } from '../types';
import { Save, X, Upload } from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Fix: Explicitly type 'f' as File to resolve 'unknown' type error
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

    const clientToSave: Client = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      picName: formData.picName || '', // Simpan Nama PIC
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
              <option value="Perorangan">Perorangan / Pribadi</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama {formData.type === 'Perorangan' ? 'Lengkap' : 'Perusahaan'}</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder={formData.type === 'Perorangan' ? "Nama Pemilik" : "Nama Perusahaan"}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-primary-500'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Kolom Input PIC */}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Dokumen Pendukung</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mb-2 text-slate-400" />
              <p className="text-sm">Klik atau drag file ke sini</p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
            </div>
            {formData.files && formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.files.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm text-blue-700">
                     <span>{file.name}</span>
                     <button 
                        type="button"
                        onClick={() => {
                            const newFiles = formData.files?.filter((_, i) => i !== idx);
                            setFormData({...formData, files: newFiles});
                        }}
                        className="text-blue-400 hover:text-blue-600 font-bold px-2"
                      >
                        ×
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