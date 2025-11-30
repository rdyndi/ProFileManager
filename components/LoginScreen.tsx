
import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, User, ChevronDown } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (status: boolean, username: string) => void;
}

const USERS = [
  { id: 'putri', name: 'Putri', role: 'Notaris', password: 'bandung16' },
  { id: 'azizah', name: 'Azizah', role: 'Staff', password: 'bandung16' },
  { id: 'nendi', name: 'Nendi', role: 'Staff', password: 'bandung15' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Silakan pilih pengguna terlebih dahulu.');
      return;
    }

    const user = USERS.find(u => u.name === selectedUser);

    if (user && user.password === password) {
      onLogin(true, user.name);
    } else {
      setError('Password salah. Silakan coba lagi.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Notaris Putri</h1>
          <p className="text-primary-100 text-sm mt-1">Sistem Manajemen Dokumen</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Pengguna</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none bg-white text-slate-700"
                  required
                >
                  <option value="" disabled>-- Pilih User --</option>
                  {USERS.map(user => (
                    <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Masuk ke Sistem
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">© 2025 Notaris & PPAT Putri Parincha</p>
          </div>
        </div>
      </div>
    </div>
  );
};
