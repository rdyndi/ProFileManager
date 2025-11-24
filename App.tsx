
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ClientForm } from './components/ClientForm';
import { DocumentGenerator, printDocument } from './components/DocumentGenerator';
import { DeedForm } from './components/DeedForm';
import { DeedReport } from './components/DeedReport';
import { 
  subscribeClients, saveClient, deleteClient, 
  subscribeDocuments, saveDocument, updateDocument, deleteDocument,
  subscribeSettings, saveSettings, syncSettingsToLocalCache,
  subscribeDeeds, saveDeed, deleteDeed
} from './services/storage';
import { auth } from './services/firebaseService';
import { signInAnonymously } from "firebase/auth";
import { Client, CompanySettings, DocumentData, DocType, Deed } from './types';
import { Users, Search, Plus, Trash2, Eye, FileText, Briefcase, ArrowUpRight, Save, Pencil, Printer, ScrollText, BookOpen } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State (Real-time synced)
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  
  // UI State
  const [clientViewState, setClientViewState] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Document View State
  const [docViewState, setDocViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Deed View State
  const [deedViewState, setDeedViewState] = useState<'list' | 'create' | 'edit' | 'report'>('list');
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deedSearchQuery, setDeedSearchQuery] = useState('');
  
  // Settings State
  const [settings, setSettings] = useState<CompanySettings>({
      companyName: '',
      companyAddress: '',
      companyEmail: '',
      companyPhone: ''
  });

  // --- Real-time Subscriptions with Auth ---
  useEffect(() => {
    let unsubClients: (() => void) | undefined;
    let unsubDocs: (() => void) | undefined;
    let unsubDeeds: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const initData = async () => {
      // 1. Coba Autentikasi (Terpisah)
      try {
        await signInAnonymously(auth);
        console.log("Status: Signed in anonymously");
      } catch (error) {
        console.warn("Auth Warning: Login anonim gagal atau belum diaktifkan di Console. Aplikasi akan mencoba akses database (jika Public Rules aktif).", error);
      }

      // 2. Coba Subscribe Data (Terpisah, tetap jalan meski Auth gagal)
      try {
        // Subscribe Clients
        unsubClients = subscribeClients((data) => {
          setClients(data);
        });

        // Subscribe Documents
        unsubDocs = subscribeDocuments((data) => {
          setDocuments(data);
        });

        // Subscribe Deeds
        unsubDeeds = subscribeDeeds((data) => {
          setDeeds(data);
        });

        // Subscribe Settings
        unsubSettings = subscribeSettings((data) => {
          setSettings(data);
          // Sync to local storage cache for synchronous printing
          syncSettingsToLocalCache(data);
        });
      } catch (e) {
        console.error("Failed to subscribe to Firestore streams:", e);
      }
    };

    initData();

    // Cleanup listeners on unmount
    return () => {
      if (unsubClients) unsubClients();
      if (unsubDocs) unsubDocs();
      if (unsubDeeds) unsubDeeds();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // --- Client Handlers (Async) ---
  const handleSaveClient = async (client: Client) => {
    try {
      await saveClient(client);
      setClientViewState('list');
    } catch (error: any) {
      console.error(error);
      alert("Gagal menyimpan data klien. Pastikan Firestore Rules mengizinkan write.\nError: " + error.message);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteClient(id);
        if (selectedClient?.id === id) setSelectedClient(null);
        setClientViewState('list');
      } catch (error: any) {
        alert("Gagal menghapus data: " + error.message);
      }
    }
  };

  // --- Document Handlers (Async) ---
  const handleSaveDocument = async (doc: DocumentData) => {
    try {
      if (docViewState === 'edit') {
          await updateDocument(doc);
      } else {
          await saveDocument(doc);
      }
      alert('Dokumen berhasil disimpan ke database!');
      setDocViewState('list');
    } catch (error: any) {
      alert("Gagal menyimpan dokumen: " + error.message);
    }
  };

  const handleDeleteDocument = async (id: string) => {
     if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
         try {
           await deleteDocument(id);
         } catch (error: any) {
           alert("Gagal menghapus dokumen: " + error.message);
         }
     }
  }

  // --- Deed Handlers (Async) ---
  const handleSaveDeed = async (deed: Deed) => {
    try {
        await saveDeed(deed);
        alert('Data Akta berhasil disimpan!');
        setDeedViewState('list');
    } catch (error: any) {
        alert("Gagal menyimpan akta: " + error.message);
    }
  }

  const handleDeleteDeed = async (id: string) => {
      if (window.confirm('Apakah Anda yakin ingin menghapus data Akta ini?')) {
          try {
              await deleteDeed(id);
          } catch (error: any) {
              alert("Gagal menghapus akta: " + error.message);
          }
      }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(settings);
      alert('Pengaturan berhasil disimpan!');
    } catch (error: any) {
      alert("Gagal menyimpan pengaturan: " + error.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for Document List
  const DocumentList = ({ type }: { type: DocType }) => {
     const filteredDocs = documents
        .filter(d => d.type === type)
        .filter(d => 
            d.clientName.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
            d.referenceNo.toLowerCase().includes(docSearchQuery.toLowerCase())
        );
        // Note: documents is already sorted in storage service

     return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{type === 'RECEIPT' ? 'Riwayat Tanda Terima' : 'Riwayat Surat Jalan'}</h2>
                <button 
                    onClick={() => { setDocViewState('create'); setSelectedDocument(null); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Buat Baru
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Cari nomor referensi atau nama klien..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={docSearchQuery}
                            onChange={(e) => setDocSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">No. Referensi</th>
                                <th className="px-6 py-3">Klien</th>
                                <th className="px-6 py-3">Petugas</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{new Date(doc.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 font-mono text-slate-700">{doc.referenceNo}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{doc.clientName}</td>
                                    <td className="px-6 py-4 text-slate-600">{doc.officerName}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => printDocument(doc)}
                                                className="p-2 text-slate-400 hover:text-green-600 rounded-full hover:bg-green-50 transition"
                                                title="Cetak PDF"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedDocument(doc); setDocViewState('edit'); }}
                                                className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-blue-50 transition"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Belum ada riwayat dokumen.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
     )
  }

  // Dashboard Component
  const Dashboard = () => {
    const total = clients.length;
    const ptCount = clients.filter(c => c.type === 'PT').length;
    const cvCount = clients.filter(c => c.type === 'CV').length;
    const totalDeeds = deeds.length;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm text-slate-500 mb-1">Total Klien</p>
                    <h3 className="text-3xl font-bold text-slate-800">{total}</h3>
                 </div>
                 <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <Users className="w-6 h-6" />
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm text-slate-500 mb-1">Total Akta</p>
                    <h3 className="text-3xl font-bold text-slate-800">{totalDeeds}</h3>
                 </div>
                 <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <ScrollText className="w-6 h-6" />
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm text-slate-500 mb-1">Badan Usaha PT</p>
                    <h3 className="text-3xl font-bold text-slate-800">{ptCount}</h3>
                 </div>
                 <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <Briefcase className="w-6 h-6" />
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm text-slate-500 mb-1">Badan Usaha CV</p>
                    <h3 className="text-3xl font-bold text-slate-800">{cvCount}</h3>
                 </div>
                 <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <Briefcase className="w-6 h-6" />
                 </div>
              </div>
           </div>
        </div>

        {/* Recent Deeds Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Akta Terbaru</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr>
                      <th className="px-6 py-3">Tanggal</th>
                      <th className="px-6 py-3">No. Akta</th>
                      <th className="px-6 py-3">Judul</th>
                      <th className="px-6 py-3">Klien</th>
                   </tr>
                </thead>
                <tbody>
                   {deeds.slice(0, 5).map(deed => (
                      <tr key={deed.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50">
                         <td className="px-6 py-3 text-slate-500">{new Date(deed.deedDate).toLocaleDateString('id-ID')}</td>
                         <td className="px-6 py-3 font-medium text-slate-800">{deed.deedNumber}</td>
                         <td className="px-6 py-3">{deed.deedTitle}</td>
                         <td className="px-6 py-3 text-slate-600">{deed.clientName}</td>
                      </tr>
                   ))}
                   {deeds.length === 0 && (
                      <tr>
                         <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Belum ada data akta.</td>
                      </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };

  // Client Detail View (No Changes Needed, re-used)
  const ClientDetail = ({ client }: { client: Client }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={() => setClientViewState('list')} className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1">
                ← Kembali ke Daftar
            </button>
            <div className="flex gap-2">
                 <button onClick={() => handleDeleteClient(client.id)} className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Hapus
                 </button>
                 <button onClick={() => setClientViewState('add')} className="px-3 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 text-sm font-medium flex items-center gap-2">
                    Edit Data
                 </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                    <span className={`mb-2 inline-block px-2 py-1 rounded text-xs font-medium 
                        ${client.type === 'PT' ? 'bg-indigo-100 text-indigo-700' : 
                          client.type === 'CV' ? 'bg-purple-100 text-purple-700' : 
                          'bg-orange-100 text-orange-700'}`}>
                        {client.type}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
                    {client.picName && <p className="text-slate-600 mt-1 font-medium">PIC: {client.picName}</p>}
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b pb-2">Informasi Kontak</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-slate-500">Alamat</span>
                        <span className="col-span-2 text-slate-800">{client.address}</span>
                        
                        <span className="text-slate-500">Nomor Kontak</span>
                        <span className="col-span-2 text-slate-800">{client.contactNumber}</span>
                        
                        <span className="text-slate-500">Email</span>
                        <span className="col-span-2 text-slate-800">{client.email}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b pb-2">Legalitas & Dokumen</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-slate-500">NIB/SIUP</span>
                        <span className="col-span-2 text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded w-fit">
                            {client.nibSiup || '-'}
                        </span>
                    </div>
                    
                    <div>
                        <p className="text-sm text-slate-500 mb-3">Dokumen Terlampir ({client.files.length})</p>
                        <div className="space-y-2">
                            {client.files.map(file => (
                                <div key={file.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <div className="bg-red-50 p-2 rounded text-red-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(file.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {client.files.length === 0 && <p className="text-sm text-slate-400 italic">Tidak ada dokumen.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={(tab) => {
            setActiveTab(tab); 
            setClientViewState('list'); 
            setSelectedClient(null);
            setDocViewState('list'); 
            setSelectedDocument(null);
            setDeedViewState('list');
            setSelectedDeed(null);
        }}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {clientViewState === 'list' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Data Klien</h2>
                <button 
                    onClick={() => { setClientViewState('add'); setSelectedClient(null); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Klien
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau jenis..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Nama Perusahaan/Klien</th>
                                <th className="px-6 py-3">Kontak</th>
                                <th className="px-6 py-3">Badan Usaha</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800">{client.name}</p>
                                        <p className="text-xs text-slate-500">{client.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{client.contactNumber}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium 
                                            ${client.type === 'PT' ? 'bg-indigo-100 text-indigo-700' : 
                                              client.type === 'CV' ? 'bg-purple-100 text-purple-700' : 
                                              'bg-orange-100 text-orange-700'}`}>
                                            {client.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => { setClientViewState('detail'); setSelectedClient(client); }}
                                            className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-slate-100 transition"
                                            title="Lihat Detail"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
            </>
          )}

          {clientViewState === 'add' && (
             <ClientForm 
                onSave={handleSaveClient} 
                onCancel={() => setClientViewState('list')} 
                initialData={selectedClient || undefined}
             />
          )}

          {clientViewState === 'detail' && selectedClient && (
             <ClientDetail client={selectedClient} />
          )}
        </div>
      )}

      {/* --- AKTA TAB --- */}
      {activeTab === 'akta' && (
          <div className="space-y-6">
             {deedViewState === 'list' ? (
                 <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-slate-800">Daftar Akta</h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setDeedViewState('report')}
                                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm"
                            >
                                <BookOpen className="w-4 h-4" />
                                Laporan Buku Akta
                            </button>
                            <button 
                                onClick={() => { setDeedViewState('create'); setSelectedDeed(null); }}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Buat Akta Baru
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Cari nomor akta, judul, atau klien..." 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    value={deedSearchQuery}
                                    onChange={(e) => setDeedSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">No. Urut</th>
                                        <th className="px-6 py-3">No. Akta</th>
                                        <th className="px-6 py-3">Tanggal</th>
                                        <th className="px-6 py-3">Judul Akta</th>
                                        <th className="px-6 py-3">Klien</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deeds
                                        .filter(d => 
                                            d.deedNumber.toLowerCase().includes(deedSearchQuery.toLowerCase()) || 
                                            d.deedTitle.toLowerCase().includes(deedSearchQuery.toLowerCase()) ||
                                            d.clientName.toLowerCase().includes(deedSearchQuery.toLowerCase())
                                        )
                                        .map(deed => (
                                        <tr key={deed.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500">{deed.orderNumber}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{deed.deedNumber}</td>
                                            <td className="px-6 py-4 text-slate-600">{new Date(deed.deedDate).toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4 font-medium">{deed.deedTitle}</td>
                                            <td className="px-6 py-4 text-slate-600">{deed.clientName}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => { setSelectedDeed(deed); setDeedViewState('edit'); }}
                                                        className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-blue-50 transition"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteDeed(deed.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {deeds.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                Belum ada data akta.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </>
             ) : deedViewState === 'report' ? (
                 <DeedReport 
                    deeds={deeds}
                    onBack={() => setDeedViewState('list')}
                 />
             ) : (
                 <DeedForm 
                    clients={clients}
                    onSave={handleSaveDeed}
                    onCancel={() => setDeedViewState('list')}
                    initialData={selectedDeed || undefined}
                 />
             )}
          </div>
      )}

      {activeTab === 'receipt' && docViewState === 'list' && <DocumentList type="RECEIPT" />}
      {activeTab === 'receipt' && docViewState !== 'list' && <DocumentGenerator type="RECEIPT" clients={clients} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} initialData={selectedDocument} />}
      
      {activeTab === 'delivery' && docViewState === 'list' && <DocumentList type="DELIVERY" />}
      {activeTab === 'delivery' && docViewState !== 'list' && <DocumentGenerator type="DELIVERY" clients={clients} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} initialData={selectedDocument} />}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
            <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold mb-4 text-slate-800 border-b pb-2">Profil Perusahaan (Kop Surat)</h3>
                <div className="space-y-4">
                    <div><label className="text-sm">Nama</label><input type="text" value={settings.companyName} onChange={e=>setSettings({...settings, companyName:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-sm">Alamat</label><textarea value={settings.companyAddress} onChange={e=>setSettings({...settings, companyAddress:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm">Email</label><input type="text" value={settings.companyEmail} onChange={e=>setSettings({...settings, companyEmail:e.target.value})} className="w-full border p-2 rounded"/></div>
                        <div><label className="text-sm">Telp</label><input type="text" value={settings.companyPhone} onChange={e=>setSettings({...settings, companyPhone:e.target.value})} className="w-full border p-2 rounded"/></div>
                    </div>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded mt-4">Simpan</button>
                </div>
            </form>
        </div>
      )}

    </Layout>
  );
};

export default App;
