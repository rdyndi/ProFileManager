import React, { useState } from 'react';
import { Employee } from '../types';
import { Save, X } from 'lucide-react';

interface EmployeeFormProps {
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  initialData?: Employee;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Employee>>(initialData || {
    name: '',
    role: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Nama pegawai wajib diisi");
    if (!formData.role) return alert("Jabatan wajib diisi");

    const employeeToSave: Employee = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      role: formData.role!,
      phone: formData.phone || ''
    };

    onSave(employeeToSave);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-lg mx-auto">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800">
          {initialData ? 'Edit Data Pegawai' : 'Input Pegawai Baru'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Contoh: Ahmad Fadillah"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
            <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Contoh: Staff Admin / Kurir"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon (Opsional)</label>
            <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};
