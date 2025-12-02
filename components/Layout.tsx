import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Truck, Settings, Briefcase, ScrollText, UserCog, LogOut, CreditCard, Wallet, PieChart, Send, Home, ChevronDown, Inbox, Calculator, ClipboardList } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const currentUser = localStorage.getItem('currentUser') || 'Notaris Putri';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracking', label: 'Tracking Pekerjaan', icon: ClipboardList }, // Added Tracking
    { id: 'clients', label: 'Data Klien', icon: Users },
    { id: 'akta', label: 'Akta', icon: ScrollText },
    { id: 'adm_ppat', label: 'ADM PPAT', icon: Calculator },
    { id: 'outgoing_mail', label: 'Surat Keluar', icon: Send },
    { id: 'incoming_mail', label: 'Surat Masuk', icon: Inbox },
    { id: 'invoice', label: 'Invoice', icon: CreditCard },
    { id: 'expenses', label: 'Biaya', icon: Wallet },
    { id: 'reports', label: 'Laporan', icon: PieChart },
    { id: 'receipt', label: 'Tanda Terima', icon: FileText },
    { id: 'delivery', label: 'Surat Jalan', icon: Truck },
    { id: 'employees', label: 'Pegawai', icon: UserCog },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  // Mobile Bottom Nav Items (Main Features)
  const mobileNavItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'tracking', label: 'Tracking', icon: ClipboardList },
    { id: 'clients', label: 'Klien', icon: Users },
    { id: 'akta', label: 'Akta', icon: ScrollText },
    { id: 'invoice', label: 'Tagihan', icon: CreditCard },
  ];

  const handleLogout = () => {
    if (window.confirm('Apakah anda yakin ingin keluar dari sistem?')) {
        onLogout();
    }
  }

  // Generate Avatar URL based on current user
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=eff6ff&color=2563eb&size=128`;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-900 no-print font-sans overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
                <h1 className="font-bold text-lg text-slate-800 leading-tight">Notaris Putri</h1>
                <span className="text-primary-600 text-sm font-bold">Office</span>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === item.id 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4 shrink-0">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Keluar Sistem
            </button>
            
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Versi Sistem</p>
              <p className="text-xs font-semibold text-slate-700">v1.2.0 Super App</p>
            </div>
        </div>
      </aside>

      {/* --- MOBILE TOP HEADER (Fixed / Static) --- */}
      {/* Moved OUTSIDE <main> so it doesn't scroll */}
      <div className="md:hidden bg-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm border-b border-slate-100 z-30">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-200">
                   <Briefcase className="w-4 h-4" />
                </div>
                <div>
                   <h1 className="font-bold text-slate-800 text-sm leading-tight">Halo, {currentUser}</h1>
                   <p className="text-[10px] text-slate-500">Selamat hari {todayName}, selamat bekerja!</p>
                </div>
             </div>
             
             {/* Mobile Profile Dropdown */}
             <div className="relative">
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                    <img 
                        src={avatarUrl}
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                        <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-800">{currentUser}</p>
                            <p className="text-[10px] text-slate-500">{currentUser === 'Putri' ? 'Notaris' : 'Staff Admin'}</p>
                        </div>
                        
                        <button 
                            onClick={() => {
                                onTabChange('settings');
                                setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            Pengaturan Akun
                        </button>
                        <button 
                            onClick={() => {
                                setIsProfileMenuOpen(false);
                                handleLogout();
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Keluar Sistem
                        </button>
                    </div>
                )}
             </div>
      </div>

      {/* --- MAIN CONTENT (Scrollable) --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50 relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION (Fixed / Static) --- */}
      <div className="md:hidden bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom">
         {mobileNavItems.map((item) => (
             <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 min-w-[60px]"
             >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-primary-100 text-primary-600 -translate-y-1' : 'text-slate-400'}`}>
                    <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium ${activeTab === item.id ? 'text-primary-700' : 'text-slate-400'}`}>
                    {item.label}
                </span>
             </button>
         ))}
      </div>

    </div>
  );
};