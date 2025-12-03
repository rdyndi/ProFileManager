
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Truck, Settings, Briefcase, ScrollText, LogOut, CreditCard, Wallet, PieChart, Send, Home, ChevronDown, Inbox, Calculator, ClipboardList, ChevronRight, PanelLeftClose, ChevronUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Mobile Header Menu
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false); // Desktop Sidebar Menu
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({}); // Sidebar Groups State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar Expand/Collapse State
  const desktopProfileRef = useRef<HTMLDivElement>(null);

  const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const currentUser = localStorage.getItem('currentUser') || 'Notaris Putri';
  
  // Close desktop profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopProfileRef.current && !desktopProfileRef.current.contains(event.target as Node)) {
        setIsDesktopProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Defined Navigation Groups
  const navGroups = [
    {
      title: 'Menu Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tracking', label: 'Tracking Pekerjaan', icon: ClipboardList },
        { id: 'clients', label: 'Data Klien', icon: Users },
        { id: 'akta', label: 'Akta', icon: ScrollText },
        { id: 'adm_ppat', label: 'ADM PPAT', icon: Calculator },
      ]
    },
    {
      title: 'Buku Surat',
      items: [
        { id: 'incoming_mail', label: 'Surat Masuk', icon: Inbox },
        { id: 'outgoing_mail', label: 'Surat Keluar', icon: Send },
      ]
    },
    {
      title: 'Keuangan',
      items: [
        { id: 'invoice', label: 'Invoice', icon: CreditCard },
        { id: 'expenses', label: 'Biaya', icon: Wallet },
        { id: 'reports', label: 'Laporan', icon: PieChart },
      ]
    },
    {
      title: 'Tanda Terima',
      items: [
         { id: 'receipt', label: 'Tanda Terima', icon: FileText },
         { id: 'delivery', label: 'Surat Jalan', icon: Truck },
      ]
    }
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

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Generate Avatar URL based on current user
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=eff6ff&color=2563eb&size=128`;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-900 no-print font-sans overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-full shrink-0 relative z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 shrink-0 h-16`}>
            {!isSidebarCollapsed && (
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-200 shrink-0">
                    <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-lg text-slate-800 leading-tight truncate">Notaris Putri</h1>
                        <span className="text-primary-600 text-[10px] font-bold uppercase tracking-wider block truncate">Office System v1.2</span>
                    </div>
                </div>
            )}
            {isSidebarCollapsed && (
                 <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-200 shrink-0">
                    <Briefcase className="w-5 h-5" />
                </div>
            )}
            
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors ${isSidebarCollapsed ? 'absolute -right-3 top-6 bg-white border border-slate-200 shadow-sm rounded-full w-6 h-6 flex items-center justify-center z-50' : ''}`}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-2">
            {navGroups.map((group, gIdx) => {
              const isCollapsed = collapsedGroups[group.title];
              
              // Jika sidebar collapsed, kita sembunyikan Group Title dan tampilkan item langsung (atau separator)
              if (isSidebarCollapsed) {
                  return (
                      <div key={gIdx} className="mb-2 border-b border-slate-100 pb-2 last:border-0">
                          {group.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                title={item.label}
                                className={`
                                  w-full flex justify-center p-2.5 rounded-lg mb-1 transition-all duration-200 relative group
                                  ${activeTab === item.id 
                                    ? 'bg-primary-50 text-primary-600 shadow-sm' 
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                              >
                                <item.icon className="w-5 h-5" />
                                {/* Tooltip on Hover for Collapsed Mode */}
                                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {item.label}
                                </span>
                              </button>
                          ))}
                      </div>
                  )
              }

              // Normal Mode (Sidebar Expanded)
              return (
                <div key={gIdx} className="mb-2">
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <span>{group.title}</span>
                    {isCollapsed ? 
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" /> : 
                      <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    }
                  </button>
                  
                  {!isCollapsed && (
                    <div className="mt-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onTabChange(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${activeTab === item.id 
                              ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                          `}
                        >
                          <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-primary-600' : 'text-slate-400'}`} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Desktop Profile & Logout Section */}
        <div className={`p-4 border-t border-slate-100 shrink-0 ${isSidebarCollapsed ? 'flex justify-center' : ''}`} ref={desktopProfileRef}>
            <div className="relative w-full">
              {isDesktopProfileOpen && (
                <div className={`absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in slide-in-from-bottom-2 z-50 overflow-hidden ${isSidebarCollapsed ? 'left-10 w-48' : 'left-0 w-full'}`}>
                   <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Akun</p>
                   </div>
                   <button 
                        onClick={() => {
                            onTabChange('settings');
                            setIsDesktopProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Pengaturan
                    </button>
                   <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar Sistem
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsDesktopProfileOpen(!isDesktopProfileOpen)}
                className={`flex items-center gap-3 w-full p-2 rounded-xl transition-colors border 
                    ${isDesktopProfileOpen ? 'bg-slate-50 border-slate-200' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}
                    ${isSidebarCollapsed ? 'justify-center p-0 border-0 hover:bg-transparent' : ''}
                `}
              >
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-200 shrink-0"
                />
                
                {!isSidebarCollapsed && (
                    <>
                        <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{currentUser}</p>
                        <p className="text-[10px] text-slate-500 truncate">Staff Kantor</p>
                        </div>
                        <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${isDesktopProfileOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
              </button>
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
                            <p className="text-[10px] text-slate-500">Staff Admin</p>
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
