
import React, { useState, useMemo } from 'react';
import { PPATRecord, AdminFeeItem } from '../types';
import { Printer, Plus, Trash2, Save, Search, Pencil, ArrowLeft, FileText, Calculator } from 'lucide-react';

interface PPATCostCalculatorProps {
  records?: PPATRecord[];
  onSave: (record: PPATRecord) => void;
  onDelete: (id: string) => void;
}

// Default items with 0 amount
const DEFAULT_ADMIN_FEES: AdminFeeItem[] = [
    { name: 'PLOTING DAN VALIDASI', amount: 0 },
    { name: 'PENGECEKAN DAN ZNT', amount: 0 },
    { name: 'VALIDASI PAJAK', amount: 0 },
    { name: 'PNBP & ADM PC BPN', amount: 0 },
    { name: 'PC ALIH MEDIA', amount: 0 },
    { name: 'Paket BPN Kelebihan Luas', amount: 0 },
];

export const PPATCostCalculator: React.FC<PPATCostCalculatorProps> = ({ records = [], onSave, onDelete }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- FORM STATE ---
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Detail Dokumen Inputs
  const [certificateType, setCertificateType] = useState('SHM');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificateVillage, setCertificateVillage] = useState(''); 
  const [nopPbb, setNopPbb] = useState('');

  // Money Values (Stored as numbers)
  const [landArea, setLandArea] = useState<number>(0);
  const [landNjop, setLandNjop] = useState<number>(0);
  const [buildingArea, setBuildingArea] = useState<number>(0);
  const [buildingNjop, setBuildingNjop] = useState<number>(0);
  const [transactionValue, setTransactionValue] = useState<number>(0);
  const [npoptkp, setNpoptkp] = useState<number>(80000000); 
  const [pphScale, setPphScale] = useState<number>(1); 
  
  // Admin Fees State
  const [adminFees, setAdminFees] = useState<AdminFeeItem[]>([]);

  // --- SAFE PARSING HELPERS (Prevents Crashing) ---

  const parseMoney = (val: any): number => {
      try {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        if (val === undefined || val === null || val === '') return 0;
        // Convert to string, remove non-digits
        const str = String(val).replace(/[^0-9]/g, '');
        const num = parseInt(str, 10);
        return isNaN(num) ? 0 : num;
      } catch (e) {
        return 0;
      }
  };

  const formatMoney = (val: number | undefined | null): string => {
      if (val === undefined || val === null || isNaN(val)) return '0';
      try {
          return new Intl.NumberFormat('id-ID').format(val);
      } catch (e) {
          return '0';
      }
  };

  // --- CALCULATIONS ---
  const calculation = useMemo(() => {
      try {
          const safeLandArea = Number(landArea) || 0;
          const safeLandNjop = Number(landNjop) || 0;
          const safeBuildArea = Number(buildingArea) || 0;
          const safeBuildNjop = Number(buildingNjop) || 0;

          const totalLand = safeLandArea * safeLandNjop;
          const totalBuilding = safeBuildArea * safeBuildNjop;
          const totalNjop = totalLand + totalBuilding;
          
          // BPHTB Logic
          const safeTransVal = Number(transactionValue) || 0;
          const safeNpoptkp = Number(npoptkp) || 0;
          const npopkp = Math.max(0, safeTransVal - safeNpoptkp);
          const bphtb = Math.floor(npopkp * 0.05);

          // PPH Logic (APHB)
          const scale = Number(pphScale) || 1;
          let pphTotal = 0;
          const pphRows: { label: string; basis: number; tax: number }[] = [];

          if (scale <= 1) {
              // Standard Jual Beli (1 Pihak)
              const tax = Math.floor(safeTransVal * 0.025);
              pphRows.push({
                  label: "NILAI PAJAK 2,5%",
                  basis: safeTransVal,
                  tax: tax
              });
              pphTotal = tax;
          } else {
              // APHB Case
              const valuePerShare = Math.floor(safeTransVal / scale);
              // Number of payers = Scale - 1
              const numberOfPayers = scale - 1;

              for (let i = 1; i <= numberOfPayers; i++) {
                  const tax = Math.floor(valuePerShare * 0.025);
                  pphRows.push({
                      label: `PPH BAYAR KE-${i} (Dasar: Rp ${formatMoney(valuePerShare)})`,
                      basis: valuePerShare,
                      tax: tax
                  });
                  pphTotal += tax;
              }
          }

          // Admin Fees
          const safeAdminFees = Array.isArray(adminFees) ? adminFees : [];
          const totalAdmin = safeAdminFees.reduce((sum, item) => {
              const amt = Number(item?.amount);
              return sum + (isNaN(amt) ? 0 : amt);
          }, 0);

          const grandTotal = bphtb + pphTotal + totalAdmin;

          return {
              totalLand,
              totalBuilding,
              totalNjop,
              npopkp,
              bphtb,
              pphRows,
              pphTotal,
              totalAdmin,
              grandTotal
          };
      } catch (e) {
          console.error("Calculation Error:", e);
          return {
              totalLand: 0, totalBuilding: 0, totalNjop: 0, npopkp: 0, bphtb: 0,
              pphRows: [], pphTotal: 0, totalAdmin: 0, grandTotal: 0
          };
      }
  }, [landArea, landNjop, buildingArea, buildingNjop, transactionValue, npoptkp, pphScale, adminFees]);

  // --- HANDLERS ---

  const handleOpenForm = (record?: PPATRecord) => {
      // Always create a FRESH copy of default fees to prevent reference issues
      const freshDefaults = DEFAULT_ADMIN_FEES.map(i => ({ name: i.name, amount: 0 }));

      if (record) {
          setEditingId(record.id);
          setTitle(record.title || '');
          setDate(record.date || new Date().toISOString().split('T')[0]);
          
          setCertificateType(record.certificateType || 'SHM');
          setCertificateNumber(record.certificateNumber || '');
          setCertificateVillage(record.certificateVillage || '');
          setNopPbb(record.nopPbb || '');

          setLandArea(Number(record.landArea) || 0);
          setLandNjop(Number(record.landNjop) || 0);
          setBuildingArea(Number(record.buildingArea) || 0);
          setBuildingNjop(Number(record.buildingNjop) || 0);
          setTransactionValue(Number(record.transactionValue) || 0);
          setNpoptkp(Number(record.npoptkp) || 0);
          setPphScale(Number(record.pphScale) || 1);
          
          if (Array.isArray(record.adminFees) && record.adminFees.length > 0) {
              setAdminFees(record.adminFees.map(f => ({ 
                  name: f?.name || '', 
                  amount: Number(f?.amount) || 0 
              })));
          } else {
              setAdminFees(freshDefaults);
          }
      } else {
          setEditingId(null);
          setTitle('');
          setDate(new Date().toISOString().split('T')[0]);
          
          setCertificateType('SHM');
          setCertificateNumber('');
          setCertificateVillage('');
          setNopPbb('');

          setLandArea(0);
          setLandNjop(0);
          setBuildingArea(0);
          setBuildingNjop(0);
          setTransactionValue(0);
          setNpoptkp(80000000);
          setPphScale(1);
          
          setAdminFees(freshDefaults);
      }
      setViewState('form');
  };

  const constructRecord = (): PPATRecord | null => {
      if (!title) {
          alert("Judul perhitungan wajib diisi");
          return null;
      }
      
      return {
          id: editingId || Math.random().toString(36).substr(2, 9),
          title,
          date,
          certificateType,
          certificateNumber,
          certificateVillage,
          nopPbb,
          landArea: Number(landArea) || 0,
          landNjop: Number(landNjop) || 0,
          buildingArea: Number(buildingArea) || 0,
          buildingNjop: Number(buildingNjop) || 0,
          transactionValue: Number(transactionValue) || 0,
          npoptkp: Number(npoptkp) || 0,
          pphScale: Number(pphScale) || 1,
          adminFees: adminFees || [],
          createdAt: Date.now()
      };
  };

  const handleSubmit = () => {
      const record = constructRecord();
      if (!record) return;

      onSave(record);
      setViewState('list');
  };

  const handleUpdateFee = (index: number, field: keyof AdminFeeItem, value: any) => {
      setAdminFees(prev => {
          const newFees = [...(prev || [])];
          if (newFees[index]) {
              newFees[index] = { ...newFees[index], [field]: value };
          }
          return newFees;
      });
  };

  const addFee = () => {
      setAdminFees(prev => [...(prev || []), { name: '', amount: 0 }]);
  };

  const removeFee = (index: number) => {
      setAdminFees(prev => (prev || []).filter((_, i) => i !== index));
  };

  const handlePrint = async () => {
      // 1. SAVE TO SERVER FIRST
      const record = constructRecord();
      if (!record) return;

      if (!editingId) {
          setEditingId(record.id);
      }
      
      onSave(record);

      // 2. GENERATE PDF
      try {
          if (typeof (window as any).html2pdf === 'undefined') {
              alert("Fitur PDF sedang dimuat. Silakan tunggu sebentar.");
              return;
          }

          const element = document.getElementById('print-area-ppat');
          if (!element) {
              alert("Area cetak tidak ditemukan.");
              return;
          }
          
          const opt = {
            margin: 0, 
            filename: `Rincian_${(title || 'Biaya').replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

          await (window as any).html2pdf().set(opt).from(element).save();
      } catch (e) {
          console.error(e);
          alert("Gagal mencetak. Coba refresh halaman.");
      }
  };

  // --- LIST VIEW ---
  if (viewState === 'list') {
      const safeRecords = Array.isArray(records) ? records : [];
      const filtered = safeRecords.filter(r => r && r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">ADM PPAT / Rincian Biaya</h2>
                  <button onClick={() => handleOpenForm()} className="bg-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition shadow-sm">
                      <Plus className="w-4 h-4" /> <span className="hidden md:inline">Buat Rincian</span>
                  </button>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Cari..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500" 
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(rec => {
                      if (!rec) return null;
                      // Quick Calc for List Preview
                      const tVal = Number(rec.transactionValue) || 0;
                      // Safe reduce
                      const fees = Array.isArray(rec.adminFees) ? rec.adminFees.reduce((s, i) => s + (Number(i?.amount) || 0), 0) : 0;
                      
                      return (
                      <div key={rec.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-primary-300 transition group">
                          <div className="flex justify-between items-start">
                             <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 uppercase">{rec.title}</h3>
                             <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Calculator className="w-4 h-4" /></div>
                          </div>
                          <p className="text-xs text-slate-500 mb-4">{new Date(rec.date).toLocaleDateString()}</p>
                          
                          <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Nilai Transaksi</span>
                                  <span className="font-mono font-medium">{formatMoney(tVal)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Total Biaya Adm</span>
                                  <span className="font-mono font-medium">{formatMoney(fees)}</span>
                              </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                              <button onClick={() => handleOpenForm(rec)} className="p-2 text-slate-400 hover:text-blue-600 rounded bg-slate-50 group-hover:bg-blue-50 transition"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => { if(window.confirm('Hapus data?')) onDelete(rec.id) }} className="p-2 text-slate-400 hover:text-red-600 rounded bg-slate-50 group-hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                  )})}
                  {filtered.length === 0 && (
                      <div className="col-span-full text-center py-10 text-slate-400 italic">
                          Belum ada data rincian biaya.
                      </div>
                  )}
              </div>
          </div>
      )
  }

  // --- FORM VIEW ---
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => setViewState('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Rincian' : 'Rincian Baru'}</h2>
            </div>
            <div className="flex gap-2">
                <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition shadow-sm">
                    <Printer className="w-4 h-4" /> <span className="hidden md:inline">Download PDF</span>
                </button>
                <button onClick={handleSubmit} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition shadow-sm">
                    <Save className="w-4 h-4" /> <span className="hidden md:inline">Simpan</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* INPUT SECTION */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Judul Perhitungan</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: PERHITUNGAN APHB IBU DENISA" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-bold uppercase" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Sertipikat</label>
                        <select 
                            value={certificateType} 
                            onChange={e => setCertificateType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                        >
                            <option value="SHM">SHM</option>
                            <option value="SHGB">SHGB</option>
                            <option value="SHGU">SHGU</option>
                            <option value="SHP">SHP</option>
                            <option value="SHPL">SHPL</option>
                            <option value="SHMSRS">SHMSRS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Sertipikat</label>
                        <input type="text" value={certificateNumber} onChange={e => setCertificateNumber(e.target.value)} placeholder="Nomor..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Desa</label>
                        <input type="text" value={certificateVillage} onChange={e => setCertificateVillage(e.target.value)} placeholder="Nama Desa..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">NOP</label>
                        <input type="text" value={nopPbb} onChange={e => setNopPbb(e.target.value)} placeholder="Nomor Objek Pajak..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                </div>

                {/* NJOP INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileText className="w-4 h-4"/> 1. Penilaian NJOP</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500">
                        <div>Objek</div>
                        <div>Luas (m2)</div>
                        <div>Harga NJOP / m2</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center text-sm font-medium text-slate-700">TANAH</div>
                        <input 
                            type="number" 
                            value={landArea || 0} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => setLandArea(Number(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-primary-500" 
                        />
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatMoney(landNjop)} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => setLandNjop(parseMoney(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-primary-500 text-right" 
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center text-sm font-medium text-slate-700">BANGUNAN</div>
                        <input 
                            type="number" 
                            value={buildingArea || 0} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => setBuildingArea(Number(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-primary-500" 
                        />
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatMoney(buildingNjop)} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => setBuildingNjop(parseMoney(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-primary-500 text-right" 
                        />
                    </div>
                </div>

                {/* TRANSACTION & TAX INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Calculator className="w-4 h-4"/> 2. Nilai Transaksi & Pajak</h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Penilaian/ Nilai Transaksi (Rp)</label>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatMoney(transactionValue)} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => setTransactionValue(parseMoney(e.target.value))} 
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono font-semibold text-slate-800" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah Pemilik (APHB/PPH)</label>
                            <select 
                                value={pphScale} 
                                onChange={e => setPphScale(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                            >
                                <option value={1}>1 Pihak / Jual Beli Biasa</option>
                                <option value={2}>APHB 2 Pihak (1 Bayar, 1/2)</option>
                                <option value={3}>APHB 3 Pihak (2 Bayar, 1/3)</option>
                                <option value={4}>APHB 4 Pihak (3 Bayar, 1/4)</option>
                                <option value={5}>APHB 5 Pihak (4 Bayar, 1/5)</option>
                                <option value={6}>APHB 6 Pihak (5 Bayar, 1/6)</option>
                                <option value={7}>APHB 7 Pihak (6 Bayar, 1/7)</option>
                                <option value={8}>APHB 8 Pihak (7 Bayar, 1/8)</option>
                                <option value={9}>APHB 9 Pihak (8 Bayar, 1/9)</option>
                                <option value={10}>APHB 10 Pihak (9 Bayar, 1/10)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">NPOPTKP (Pengurang)</label>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                value={formatMoney(npoptkp)} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => setNpoptkp(parseMoney(e.target.value))} 
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono" 
                            />
                        </div>
                    </div>
                </div>

                {/* ADMIN FEES INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">3. Biaya Administrasi & Lain-lain</h3>
                        <button onClick={addFee} className="text-xs text-primary-600 font-medium hover:underline">+ Tambah Item</button>
                    </div>
                    <div className="space-y-2">
                        {/* SAFE MAP */}
                        {(adminFees || []).map((item, idx) => {
                            if (!item) return null;
                            return (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={item.name} 
                                        onChange={e => handleUpdateFee(idx, 'name', e.target.value)} 
                                        placeholder="Nama Biaya..."
                                        className="flex-1 min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg text-sm uppercase outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        value={formatMoney(item.amount)} 
                                        onFocus={(e) => e.target.select()}
                                        onChange={e => handleUpdateFee(idx, 'amount', parseMoney(e.target.value))} 
                                        placeholder="0"
                                        className="w-20 md:w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-right font-mono outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                    <button onClick={() => removeFee(idx)} className="text-slate-300 hover:text-red-500 transition shrink-0 p-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* PREVIEW SECTION (HIDDEN PRINT AREA) */}
            <div className="bg-slate-100 p-4 md:p-8 rounded-xl overflow-auto flex justify-center items-start shadow-inner">
                 {/* This div is visible in the UI as a preview, and also used by html2pdf */}
                 {/* UPDATE: Reduced minHeight to 290mm to avoid blank second page, ensure strict width */}
                <div id="print-area-ppat" className="bg-white shadow-lg text-black font-sans text-sm relative" style={{width: '210mm', minWidth: '210mm', minHeight: '290mm', padding: '12mm', boxSizing: 'border-box'}}>
                    
                    {/* PDF Header */}
                    <div className="text-center font-bold text-xl uppercase border-b-4 border-green-800 pb-2 mb-2 tracking-wide">
                        {title || 'JUDUL PERHITUNGAN'}
                    </div>
                    <div className="border-t border-green-800 mb-6"></div>
                    
                    {/* Info Block */}
                     <div className="mb-4 text-xs font-medium">
                        <table style={{width: '100%', border: 'none'}}>
                            <tbody>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>Jenis Sertipikat</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{certificateType}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>Nomor Sertipikat</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{certificateNumber || '-'}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>Desa</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{certificateVillage || '-'}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>NOP</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{nopPbb || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <style>{`
                        .cost-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
                        .cost-table th, .cost-table td { border: 1px solid #000; padding: 3px 6px; }
                        .cost-table th { text-align: center; font-weight: bold; background-color: #f9fafb; text-transform: uppercase; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                    `}</style>

                    {/* Table 1: NJOP */}
                    <div className="font-bold mb-1 ml-1 text-xs uppercase border-b border-black pb-1">PENILAIAN NJOP</div>
                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th style={{width: '30%'}}>OBJEK</th>
                                <th style={{width: '15%'}}>LUAS</th>
                                <th style={{width: '25%'}}>PENILAIAN NJOP</th>
                                <th style={{width: '30%'}}>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>TANAH</td>
                                <td className="text-center">{landArea || 0}</td>
                                <td className="text-right">{formatMoney(landNjop)}</td>
                                <td className="text-right">Rp {formatMoney(calculation.totalLand)}</td>
                            </tr>
                            <tr>
                                <td>BANGUNAN</td>
                                <td className="text-center">{buildingArea || 0}</td>
                                <td className="text-right">{formatMoney(buildingNjop)}</td>
                                <td className="text-right">Rp {formatMoney(calculation.totalBuilding)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={3} className="text-center">TOTAL</td>
                                <td className="text-right">Rp {formatMoney(calculation.totalNjop)}</td>
                            </tr>
                            <tr className="font-bold bg-slate-50">
                                <td colSpan={3} className="text-center uppercase">Penilaian/ Nilai Transaksi</td>
                                <td className="text-right">Rp {formatMoney(transactionValue)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Table 2: BPHTB */}
                    <div className="font-bold mb-1 ml-1 text-xs uppercase">BPHTB</div>
                    <table className="cost-table">
                        <tbody>
                            <tr>
                                <td style={{width: '45%'}}>NILAI TRANSAKSI</td>
                                <td style={{width: '55%'}} className="text-right font-bold">Rp {formatMoney(transactionValue)}</td>
                            </tr>
                            <tr>
                                <td>NPOPTKP</td>
                                <td className="text-right">Rp {formatMoney(npoptkp)}</td>
                            </tr>
                            <tr>
                                <td>NPOPKP</td>
                                <td className="text-right">Rp {formatMoney(calculation.npopkp)}</td>
                            </tr>
                            <tr className="font-bold bg-slate-50">
                                <td>NILAI PAJAK 5%</td>
                                <td className="text-right">Rp {formatMoney(calculation.bphtb)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Table 3: PPH */}
                    <div className="font-bold mb-1 ml-1 text-xs uppercase">PPH {pphScale > 1 ? `(APHB: ${pphScale - 1}/${pphScale})` : ''}</div>
                    <table className="cost-table">
                        <tbody>
                            <tr>
                                <td style={{width: '45%'}}>NILAI TRANSAKSI</td>
                                <td style={{width: '55%'}} className="text-right font-bold">Rp {formatMoney(transactionValue)}</td>
                            </tr>
                            {/* Dynamic Rows for PPH Payers */}
                            {calculation.pphRows.map((row, idx) => (
                                <tr key={idx} className={idx === calculation.pphRows.length - 1 ? 'font-bold bg-slate-50' : ''}>
                                    <td>{row.label}</td>
                                    <td className="text-right">Rp {formatMoney(row.tax)}</td>
                                </tr>
                            ))}
                            {pphScale > 1 && (
                                <tr className="font-bold bg-slate-100 border-t-2 border-black">
                                    <td>TOTAL PPH</td>
                                    <td className="text-right">Rp {formatMoney(calculation.pphTotal)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Table 4: Admin Fees */}
                    <div className="font-bold mb-1 ml-1 text-xs uppercase border-b border-black pb-1 mt-2">BIAYA ADMINISTRASI & LAIN-LAIN</div>
                    <table className="cost-table" style={{border: 'none', width: '100%'}}>
                        <tbody>
                            {(Array.isArray(adminFees) ? adminFees : []).map((fee, idx) => {
                                if (!fee) return null;
                                return (
                                <tr key={idx} style={{border: 'none'}}>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '45%'}}>{fee.name}</td>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '10%', textAlign: 'right'}}>Rp</td>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '45%', textAlign: 'right'}}>{formatMoney(fee.amount)}</td>
                                </tr>
                                )
                            })}
                            
                            <tr style={{border: 'none', height: '10px'}}><td colSpan={3}></td></tr>

                            <tr className="font-bold" style={{border: 'none'}}>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '8px'}}>TOTAL BIAYA ADM & LAIN-LAIN</td>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'right'}}>Rp</td>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'right'}}>{formatMoney(calculation.totalAdmin)}</td>
                            </tr>
                            
                            <tr style={{border: 'none', height: '20px'}}><td colSpan={3}></td></tr>
                            <tr className="font-bold" style={{border: 'none', fontSize: '13px', backgroundColor: '#f0fdf4'}}>
                                <td style={{border: '2px solid #000', padding: '10px'}}>GRAND TOTAL (PAJAK + BIAYA)</td>
                                <td style={{borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px', textAlign: 'right'}}>Rp</td>
                                <td style={{border: '2px solid #000', borderLeft: 'none', padding: '10px', textAlign: 'right'}}>{formatMoney(calculation.grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};
