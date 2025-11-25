import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ClientForm } from './components/ClientForm';
import { EmployeeForm } from './components/EmployeeForm';
import { DocumentGenerator, printDocument } from './components/DocumentGenerator';
import { DeedForm } from './components/DeedForm';
import { DeedReport } from './components/DeedReport';
import { DeedAlphabeticalReport } from './components/DeedAlphabeticalReport';
import { 
  subscribeClients, saveClient, deleteClient, 
  subscribeDocuments, saveDocument, updateDocument, deleteDocument,
  subscribeSettings, saveSettings, syncSettingsToLocalCache,
  subscribeDeeds, saveDeed, deleteDeed,
  subscribeEmployees, saveEmployee, deleteEmployee
} from './services/storage';
import { auth } from './services/firebaseService';
import { signInAnonymously } from "firebase/auth";
import { Client, CompanySettings, DocumentData, DocType, Deed, Employee } from './types';
import { Users, Search, Plus, Trash2, Eye, FileText, Briefcase, ArrowUpRight, Save, Pencil, Printer, ScrollText, BookOpen, ArrowDownAZ, ArrowLeft, UserCog } from 'lucide-react';

// ... (ClientDetail component remains same) ...
const ClientDetail: React.FC<{
  client: Client;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ client, onBack, onEdit, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{client.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${client.type === 'PT' ? 'bg-blue-100 text-blue-700' : client.type === 'CV' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {client.type}
                    </span>
                    <span>•</span>
                    <span>Sejak {new Date(client.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={onEdit} className="px-4 py-2 flex items-center gap-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition">
                <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={onDelete} className="px-4 py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition">
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Hapus</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    Informasi Kontak
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">PIC / Penanggung Jawab</label>
                        <p className="font-medium text-slate-900 mt-1">{client.picName || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Nomor Kontak</label>
                        <p className="font-medium text-slate-900 mt-1">{client.contactNumber}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</label>
                        <p className="font-medium text-slate-900 mt-1">{client.email}</p>
                    </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">NIB / SIUP</label>
                        <p className="font-medium text-slate-900 mt-1">{client.nibSiup || '-'}</p>
                    </div>
                     <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Alamat Lengkap</label>
                        <p className="font-medium text-slate-900 mt-1">{client.address}</p>
                    </div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    Berkas Lampiran ({client.files?.length || 0})
                </h3>
                {client.files && client.files.length > 0 ? (
                    <div className="space-y-3">
                        {client.files.map((file, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-primary-200 transition">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                                        <p className="text-xs text-slate-500">Diupload {new Date(file.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button className="text-primary-600 text-sm font-medium hover:text-primary-800 px-3 py-1 rounded hover:bg-primary-50">Download</button>
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Tidak ada berkas lampiran.</p>
                    </div>
                )}
            </div>
        </div>

        <div>
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Ringkasan</h3>
                        <p className="text-slate-400 text-xs mt-1">Aktivitas Klien</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-slate-400 text-xs mb-1">Status Keanggotaan</p>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-400">Aktif</span>
                            <span className="text-xs text-slate-500">Online</span>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                             <p className="text-slate-400 text-[10px] uppercase">Total Akta</p>
                             <p className="text-xl font-bold mt-1">-</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                             <p className="text-slate-400 text-[10px] uppercase">Dokumen</p>
                             <p className="text-xl font-bold mt-1">-</p>
                        </div>
                     </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State (Real-time synced)
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // UI State
  const [clientViewState, setClientViewState] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Document View State
  const [docViewState, setDocViewState] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Deed View State
  const [deedViewState, setDeedViewState] = useState<'list' | 'create' | 'edit' | 'report_monthly' | 'report_alphabetical'>('list');
  const [selectedDeed, setSelectedDeed] = useState<Deed | null>(null);
  const [deedSearchQuery, setDeedSearchQuery] = useState('');

  // Employee View State
  const [empViewState, setEmpViewState] = useState<'list' | 'add'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  
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
    let unsubEmployees: (() => void) | undefined;

    const initData = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Status: Signed in anonymously");
      } catch (error) {
        console.warn("Auth Warning: Login anonim gagal.", error);
      }

      try {
        unsubClients = subscribeClients((data) => setClients(data));
        unsubDocs = subscribeDocuments((data) => setDocuments(data));
        unsubDeeds = subscribeDeeds((data) => setDeeds(data));
        unsubEmployees = subscribeEmployees((data) => setEmployees(data));
        unsubSettings = subscribeSettings((data) => {
          setSettings(data);
          syncSettingsToLocalCache(data);
        });
      } catch (e) {
        console.error("Failed to subscribe to Firestore streams:", e);
      }
    };

    initData();

    return () => {
      if (unsubClients) unsubClients();
      if (unsubDocs) unsubDocs();
      if (unsubDeeds) unsubDeeds();
      if (unsubSettings) unsubSettings();
      if (unsubEmployees) unsubEmployees();
    };
  }, []);

  // --- Handlers ---
  // ... (Same handlers as before) ...
  const handleSaveClient = async (client: Client) => { try { await saveClient(client); setClientViewState('list'); } catch (e: any) { alert(e.message); } };
  const handleDeleteClient = async (id: string) => { if (window.confirm('Hapus data?')) { try { await deleteClient(id); if(selectedClient?.id === id) setSelectedClient(null); setClientViewState('list'); } catch (e: any) { alert(e.message); } } };
  const handleDirectAddClient = () => { setActiveTab('clients'); setClientViewState('add'); setSelectedClient(null); };
  const handleSaveDocument = async (doc: DocumentData) => { try { if (docViewState === 'edit') await updateDocument(doc); else await saveDocument(doc); alert('Tersimpan!'); setDocViewState('list'); } catch (e: any) { alert(e.message); } };
  const handleDeleteDocument = async (id: string) => { if (window.confirm('Hapus dokumen?')) { try { await deleteDocument(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveDeed = async (deed: Deed) => { try { await saveDeed(deed); alert('Tersimpan!'); setDeedViewState('list'); } catch (e: any) { alert(e.message); } }
  const handleDeleteDeed = async (id: string) => { if (window.confirm('Hapus akta?')) { try { await deleteDeed(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveEmployee = async (emp: Employee) => { try { await saveEmployee(emp); alert('Pegawai tersimpan!'); setEmpViewState('list'); } catch (e: any) { alert(e.message); } }
  const handleDeleteEmployee = async (id: string) => { if (window.confirm('Hapus pegawai?')) { try { await deleteEmployee(id); } catch (e: any) { alert(e.message); } } }
  const handleSaveSettings = async (e: React.FormEvent) => { e.preventDefault(); try { await saveSettings(settings); alert('Tersimpan!'); } catch (e: any) { alert(e.message); } };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.type.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(empSearchQuery.toLowerCase()) || e.role.toLowerCase().includes(empSearchQuery.toLowerCase()));

  // Document List Helper
  const DocumentList = ({ type }: { type: DocType }) => {
     const filteredDocs = documents
        .filter(d => d.type === type)
        .filter(d => d.clientName.toLowerCase().includes(docSearchQuery.toLowerCase()) || d.referenceNo.toLowerCase().includes(docSearchQuery.toLowerCase()));
     return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{type === 'RECEIPT' ? 'Riwayat Tanda Terima' : 'Riwayat Surat Jalan'}</h2>
                <button onClick={() => { setDocViewState('create'); setSelectedDocument(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm"><Plus className="w-4 h-4" /> Buat Baru</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm" value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} /></div></div>
                <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">No. Ref</th><th className="px-6 py-3">Klien</th><th className="px-6 py-3">Petugas</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead><tbody>{filteredDocs.map(doc => (<tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-6 py-4">{new Date(doc.date).toLocaleDateString()}</td><td className="px-6 py-4 font-mono">{doc.referenceNo}</td><td className="px-6 py-4">{doc.clientName}</td><td className="px-6 py-4">{doc.officerName}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => printDocument(doc)} className="p-2 text-slate-400 hover:text-green-600"><Printer className="w-4 h-4" /></button><button onClick={() => { setSelectedDocument(doc); setDocViewState('edit'); }} className="p-2 text-slate-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
            </div>
        </div>
     )
  }

  return (
    <Layout activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setClientViewState('list'); setSelectedClient(null); setDocViewState('list'); setSelectedDocument(null); setDeedViewState('list'); setSelectedDeed(null); setEmpViewState('list'); setSelectedEmployee(null); }}>
      {/* ... (Dashboard & Clients Tab remains same) ... */}
      {activeTab === 'dashboard' && ( <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><p className="text-sm text-slate-500">Total Klien</p><h3 className="text-3xl font-bold text-slate-800">{clients.length}</h3></div><div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><p className="text-sm text-slate-500">Total Akta</p><h3 className="text-3xl font-bold text-slate-800">{deeds.length}</h3></div></div></div> )}
      {activeTab === 'clients' && (<div className="space-y-6">{clientViewState === 'list' && (<><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Klien</h2><button onClick={() => { setClientViewState('add'); setSelectedClient(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex gap-2"><Plus className="w-4 h-4"/> Tambah Klien</button></div><div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border rounded-lg mb-4" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">Nama</th><th className="p-4">Kontak</th><th className="p-4">Tipe</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{filteredClients.map(c => (<tr key={c.id} className="border-b"><td className="p-4 font-bold">{c.name}</td><td className="p-4">{c.contactNumber}</td><td className="p-4">{c.type}</td><td className="p-4 text-right"><button onClick={() => { setClientViewState('detail'); setSelectedClient(c); }} className="text-primary-600">Lihat</button></td></tr>))}</tbody></table></div></>)}{clientViewState === 'add' && <ClientForm onSave={handleSaveClient} onCancel={() => setClientViewState('list')} initialData={selectedClient || undefined} />}{clientViewState === 'detail' && selectedClient && <ClientDetail client={selectedClient} onBack={() => setClientViewState('list')} onEdit={() => setClientViewState('add')} onDelete={() => handleDeleteClient(selectedClient.id)} />}</div>)}

      {/* ... (Akta Tab remains same) ... */}
      {activeTab === 'akta' && (<div className="space-y-6">{deedViewState === 'list' ? (<><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Daftar Akta</h2><div className="flex gap-2"><button onClick={() => setDeedViewState('report_alphabetical')} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><ArrowDownAZ className="w-4 h-4" /> Laporan A-Z</button><button onClick={() => setDeedViewState('report_monthly')} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition shadow-sm text-sm"><BookOpen className="w-4 h-4" /> Laporan Bulanan</button><button onClick={() => { setDeedViewState('create'); setSelectedDeed(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm text-sm"><Plus className="w-4 h-4" /> Buat Akta Baru</button></div></div><div className="bg-white rounded-xl shadow-sm border border-slate-200"><div className="p-4 border-b"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 border rounded-lg" value={deedSearchQuery} onChange={e => setDeedSearchQuery(e.target.value)} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">No. Akta</th><th className="p-4">Judul</th><th className="p-4">Klien</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{deeds.filter(d => d.deedNumber.toLowerCase().includes(deedSearchQuery.toLowerCase()) || d.deedTitle.toLowerCase().includes(deedSearchQuery.toLowerCase()) || d.clientName.toLowerCase().includes(deedSearchQuery.toLowerCase())).map(d => (<tr key={d.id} className="border-b"><td className="p-4 font-bold">{d.deedNumber}</td><td className="p-4">{d.deedTitle}</td><td className="p-4">{d.clientName}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedDeed(d); setDeedViewState('edit'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteDeed(d.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>))}</tbody></table></div></div></>) : deedViewState === 'report_monthly' ? <DeedReport deeds={deeds} onBack={() => setDeedViewState('list')} /> : deedViewState === 'report_alphabetical' ? <DeedAlphabeticalReport deeds={deeds} onBack={() => setDeedViewState('list')} /> : <DeedForm clients={clients} onSave={handleSaveDeed} onCancel={() => setDeedViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDeed || undefined} />}</div>)}

      {/* UPDATE: Pass 'documents' prop to Generator to enable Auto-Increment Logic */}
      {activeTab === 'receipt' && docViewState === 'list' && <DocumentList type="RECEIPT" />}
      {activeTab === 'receipt' && docViewState !== 'list' && <DocumentGenerator type="RECEIPT" clients={clients} employees={employees} documents={documents} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}
      
      {activeTab === 'delivery' && docViewState === 'list' && <DocumentList type="DELIVERY" />}
      {activeTab === 'delivery' && docViewState !== 'list' && <DocumentGenerator type="DELIVERY" clients={clients} employees={employees} documents={documents} onSave={handleSaveDocument} onCancel={() => setDocViewState('list')} onAddClient={handleDirectAddClient} initialData={selectedDocument} />}

      {activeTab === 'employees' && (
          <div className="space-y-6">
              {empViewState === 'list' ? (
                  <>
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Data Pegawai</h2><button onClick={() => { setEmpViewState('add'); setSelectedEmployee(null); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex gap-2"><Plus className="w-4 h-4"/> Tambah Pegawai</button></div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"><input type="text" placeholder="Cari pegawai..." className="w-full px-4 py-2 border rounded-lg mb-4" value={empSearchQuery} onChange={e => setEmpSearchQuery(e.target.value)} />
                        <table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-4">Nama</th><th className="p-4">Jabatan</th><th className="p-4">Telepon</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>
                            {filteredEmployees.map(e => (<tr key={e.id} className="border-b"><td className="p-4 font-medium">{e.name}</td><td className="p-4">{e.role}</td><td className="p-4">{e.phone}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setSelectedEmployee(e); setEmpViewState('add'); }}><Pencil className="w-4 h-4 text-blue-600" /></button><button onClick={() => handleDeleteEmployee(e.id)}><Trash2 className="w-4 h-4 text-red-600" /></button></td></tr>))}
                        </tbody></table>
                    </div>
                  </>
              ) : (
                  <EmployeeForm onSave={handleSaveEmployee} onCancel={() => setEmpViewState('list')} initialData={selectedEmployee || undefined} />
              )}
          </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
            <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="space-y-4">
                    <div><label className="text-sm">Nama</label><input type="text" value={settings.companyName} onChange={e=>setSettings({...settings, companyName:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-sm">Alamat</label><textarea value={settings.companyAddress} onChange={e=>setSettings({...settings, companyAddress:e.target.value})} className="w-full border p-2 rounded"/></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-sm">Email</label><input type="text" value={settings.companyEmail} onChange={e=>setSettings({...settings, companyEmail:e.target.value})} className="w-full border p-2 rounded"/></div><div><label className="text-sm">Telp</label><input type="text" value={settings.companyPhone} onChange={e=>setSettings({...settings, companyPhone:e.target.value})} className="w-full border p-2 rounded"/></div></div>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded mt-4">Simpan</button>
                </div>
            </form>
        </div>
      )}
    </Layout>
  );
};

export default App;
