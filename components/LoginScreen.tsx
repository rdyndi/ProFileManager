
import React, { useState } from 'react';
import { auth } from "../services/firebaseService";
import { Lock, KeyRound, AlertCircle, Mail, Loader2, Megaphone } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // Login sukses, onAuthStateChanged di App.tsx akan menangani navigasi
    } catch (err: any) {
      console.error("Login Error:", err.code);
      let msg = "Gagal masuk. Periksa koneksi internet Anda.";
      
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          msg = "Email atau kata sandi salah.";
          break;
        case 'auth/invalid-email':
          msg = "Format email tidak valid.";
          break;
        case 'auth/too-many-requests':
          msg = "Terlalu banyak percobaan gagal. Coba lagi nanti.";
          break;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans gap-6">
      
      {/* PENGUMUMAN MIGRASI */}
      <div className="max-w-md w-full bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Megaphone className="w-6 h-6 text-amber-600" />
        </div>
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-amber-800 mb-1 uppercase tracking-wide text-xs">Pengumuman Penting</p>
          <p>
            Untuk mengakses aplikasi silahkan kunjungi{' '}
            <a href="https://notarisputri.pages.dev" className="font-bold underline text-amber-700 hover:text-amber-900 transition-colors">
              notarisputri.pages.dev
            </a>
            , dikarenakan alamat saat ini akan segera dinonaktifkan.
          </p>
        </div>
      </div>

      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-primary-600 p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30 transform rotate-12 scale-150 pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm mb-4 relative z-10">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white relative z-10">Notaris Putri</h1>
          <p className="text-primary-100 text-sm mt-1 relative z-10">Sistem Manajemen Kantor</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Masuk...
                </div>
              ) : (
                "Masuk Aplikasi"
              )}
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
