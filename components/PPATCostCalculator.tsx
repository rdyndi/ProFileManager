
import React, { useState, useMemo } from 'react';
import { PPATRecord, AdminFeeItem } from '../types';
import { Printer, Plus, Trash2, Save, X, Search, Pencil, ArrowLeft } from 'lucide-react';

interface PPATCostCalculatorProps {
  records: PPATRecord[];
  onSave: (record: PPATRecord) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_ADMIN_FEES: AdminFeeItem[] = [
    { name: 'PLOTING DAN VALIDASI', amount: 150000 },
    { name: 'PENGECEKAN DAN ZNT', amount: 150000 },
    { name: 'VALIDASI PAJAK', amount: 250000 },
    { name: 'PNBP & ADM PC BPN', amount: 0 },
    { name: 'PC ALIH MEDIA', amount: 100000 },
    { name: 'Paket BPN Kelebihan Luas', amount: 0 },
];

export const PPATCostCalculator: React.FC<PPATCostCalculatorProps> = ({ records, onSave, onDelete }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New Fields
  const [certificateType, setCertificateType] = useState('SHM');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificateVillage, setCertificateVillage] = useState(''); // Desa
  const [nopPbb, setNopPbb] = useState('');

  const [landArea, setLandArea] = useState<number>(0);
  const [landNjop, setLandNjop] = useState<number>(0);
  const [buildingArea, setBuildingArea] = useState<number>(0);
  const [buildingNjop, setBuildingNjop] = useState<number>(0);
  const [transactionValue, setTransactionValue] = useState<number>(0);
  const [npoptkp, setNpoptkp] = useState<number>(80000000); // Default common value
  const [pphScale, setPphScale] = useState<number>(1); // Default 1 (Full)
  const [adminFees, setAdminFees] = useState<AdminFeeItem[]>(DEFAULT_ADMIN_FEES);

  // --- CALCULATIONS ---
  const calculation = useMemo(() => {
      const totalLand = landArea * landNjop;
      const totalBuilding = buildingArea * buildingNjop;
      const totalNjopRaw = totalLand + totalBuilding;
      
      const totalNjop = totalNjopRaw;
      
      // BPHTB Logic
      const npopkp = Math.max(0, transactionValue - npoptkp);
      const bphtb = Math.floor(npopkp * 0.05);

      // PPH Logic
      // Scale: 1 = 1/1, 2 = 1/2, 3 = 1/3, etc.
      const scale = pphScale || 1;
      const pphBasis = transactionValue / scale;
      const pph = Math.floor(pphBasis * 0.025);

      // Admin Fees
      // Safety check: ensure adminFees is array
      const safeAdminFees = Array.isArray(adminFees) ? adminFees : [];
      const totalAdmin = safeAdminFees.reduce((sum, item) => sum + item.amount, 0);

      const grandTotal = bphtb + pph + totalAdmin;

      return {
          totalLand,
          totalBuilding,
          totalNjop,
          npopkp,
          bphtb,
          pphBasis,
          pph,
          totalAdmin,
          grandTotal
      };
  }, [landArea, landNjop, buildingArea, buildingNjop, transactionValue, npoptkp, pphScale, adminFees]);

  const handleOpenForm = (record?: PPATRecord) => {
      if (record) {
          setEditingId(record.id);
          setTitle(record.title);
          setDate(record.date);
          
          setCertificateType(record.certificateType || 'SHM');
          setCertificateNumber(record.certificateNumber || '');
          setCertificateVillage(record.certificateVillage || '');
          setNopPbb(record.nopPbb || '');

          setLandArea(record.landArea);
          setLandNjop(record.landNjop);
          setBuildingArea(record.buildingArea);
          setBuildingNjop(record.buildingNjop);
          setTransactionValue(record.transactionValue);
          setNpoptkp(record.npoptkp);
          setPphScale(record.pphScale || 1);
          // Safety check for existing records that might miss adminFees
          setAdminFees(record.adminFees || DEFAULT_ADMIN_FEES);
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
          setAdminFees(DEFAULT_ADMIN_FEES);
      }
      setViewState('form');
  };

  const handleSubmit = () => {
      if (!title) return alert("Judul perhitungan wajib diisi");

      const record: PPATRecord = {
          id: editingId || Math.random().toString(36).substr(2, 9),
          title,
          date,
          certificateType,
          certificateNumber,
          certificateVillage,
          nopPbb,
          landArea,
          landNjop,
          buildingArea,
          buildingNjop,
          transactionValue,
          npoptkp,
          pphScale,
          adminFees: adminFees || [],
          createdAt: Date.now()
      };
      onSave(record);
      setViewState('list');
  };

  const handleUpdateFee = (index: number, field: keyof AdminFeeItem, value: any) => {
      const newFees = [...adminFees];
      // @ts-ignore
      newFees[index] = { ...newFees[index], [field]: value };
      setAdminFees(newFees);
  };

  const addFee = () => {
      setAdminFees([...adminFees, { name: '', amount: 0 }]);
  };

  const removeFee = (index: number) => {
      setAdminFees(adminFees.filter((_, i) => i !== index));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  // Helper for input parsing (removing dots)
  const parseInputMoney = (val: string) => {
      return Number(val.replace(/\./g, '').replace(/[^0-9]/g, ''));
  };

  // Helper for input formatting (adding dots)
  const formatInputMoney = (val: number) => {
      if (!val) return '';
      return new Intl.NumberFormat('id-ID').format(val);
  };

  const handlePrint = () => {
      // Use html2pdf to print the preview section
      const element = document.getElementById('print-area');
      if (!element || typeof (window as any).html2pdf === 'undefined') {
          alert("Komponen cetak belum siap.");
          return;
      }

      // Clone element to modify styling for print without affecting UI
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Override styles for PDF generation to prevent cropping
      // A4 width is 210mm. Margins are 10mm each. Safe width is 190mm.
      clone.style.width = "190mm"; 
      clone.style.maxWidth = "190mm";
      clone.style.height = "auto"; // Allow height to grow
      clone.style.minHeight = "auto";
      clone.style.margin = "0"; // No external margins on the element itself
      clone.style.padding = "20px"; // Internal padding
      clone.style.boxSizing = "border-box"; // Include padding in width calculation
      
      clone.style.backgroundColor = "white";
      clone.style.color = "black";
      clone.style.fontSize = "12px"; // Ensure font is readable
      
      // Remove UI-specific classes that might enforce fixed widths or borders
      clone.classList.remove('rounded-xl', 'shadow-sm', 'border', 'w-[210mm]', 'min-h-[297mm]');

      const opt = {
        margin: [10, 10, 10, 10], // Top, Left, Bottom, Right (mm)
        filename: `Rincian_Biaya_${title.replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

      (window as any).html2pdf().set(opt).from(clone).save();
  };

  // --- LIST VIEW ---
  if (viewState === 'list') {
      const filtered = records.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
                        placeholder="Cari berdasarkan judul..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-primary-500" 
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(rec => {
                      const scale = rec.pphScale || 1;
                      const pphBasis = rec.transactionValue / scale;
                      const pph = Math.floor(pphBasis * 0.025);
                      const npopkp = Math.max(0, rec.transactionValue - rec.npoptkp);
                      const bphtb = Math.floor(npopkp * 0.05);
                      const admin = (rec.adminFees || []).reduce((s, i) => s + i.amount, 0);
                      const total = bphtb + pph + admin;

                      return (
                      <div key={rec.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-primary-300 transition group">
                          <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{rec.title}</h3>
                          <p className="text-xs text-slate-500 mb-4">{new Date(rec.date).toLocaleDateString('id-ID', { dateStyle: 'full'})}</p>
                          
                          <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Nilai Transaksi</span>
                                  <span className="font-mono font-medium">{formatCurrency(rec.transactionValue)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">PPH (1/{scale})</span>
                                  <span className="font-mono font-medium">{formatCurrency(pph)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Total Biaya</span>
                                  <span className="font-mono font-bold text-green-600">
                                      {formatCurrency(total)}
                                  </span>
                              </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                              <button onClick={() => handleOpenForm(rec)} className="p-2 text-slate-400 hover:text-blue-600 rounded bg-slate-50 group-hover:bg-blue-50 transition"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => { if(confirm('Hapus data?')) onDelete(rec.id) }} className="p-2 text-slate-400 hover:text-red-600 rounded bg-slate-50 group-hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                  )})}
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
                <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition">
                    <Printer className="w-4 h-4" /> <span className="hidden md:inline">Download PDF</span>
                </button>
                <button onClick={handleSubmit} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition">
                    <Save className="w-4 h-4" /> <span className="hidden md:inline">Simpan</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* INPUT SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Sertipikat</label>
                        <input type="text" value={certificateNumber} onChange={e => setCertificateNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Desa / Kelurahan</label>
                        <input type="text" value={certificateVillage} onChange={e => setCertificateVillage(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">NOP PBB</label>
                        <input type="text" value={nopPbb} onChange={e => setNopPbb(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                </div>

                {/* NJOP INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 text-sm">1. Penilaian NJOP</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500">
                        <div>Objek</div>
                        <div>Luas (m2)</div>
                        <div>Harga NJOP / m2</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center text-sm font-medium text-slate-700">TANAH</div>
                        <input type="number" value={landArea || ''} onChange={e => setLandArea(Number(e.target.value))} placeholder="0" className="px-2 py-1 border rounded" />
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatInputMoney(landNjop)} 
                            onChange={e => setLandNjop(parseInputMoney(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-1 border rounded" 
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center text-sm font-medium text-slate-700">BANGUNAN</div>
                        <input type="number" value={buildingArea || ''} onChange={e => setBuildingArea(Number(e.target.value))} placeholder="0" className="px-2 py-1 border rounded" />
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatInputMoney(buildingNjop)} 
                            onChange={e => setBuildingNjop(parseInputMoney(e.target.value))} 
                            placeholder="0" 
                            className="px-2 py-1 border rounded" 
                        />
                    </div>
                </div>

                {/* TRANSACTION & TAX INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 text-sm">2. Nilai Transaksi & Pajak</h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nilai Transaksi / Pasar (Pembulatan)</label>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={formatInputMoney(transactionValue)} 
                            onChange={e => setTransactionValue(parseInputMoney(e.target.value))} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono" 
                        />
                    </div>
                    
                    {/* New PPH Portion Dropdown */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Porsi / Bagian PPH</label>
                            <select 
                                value={pphScale} 
                                onChange={e => setPphScale(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                            >
                                <option value={1}>1/1 (Penuh)</option>
                                <option value={2}>1/2 Bagian</option>
                                <option value={3}>1/3 Bagian</option>
                                <option value={4}>1/4 Bagian</option>
                                <option value={5}>1/5 Bagian</option>
                                <option value={6}>1/6 Bagian</option>
                                <option value={7}>1/7 Bagian</option>
                                <option value={8}>1/8 Bagian</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">NPOPTKP (Pengurang BPHTB)</label>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                value={formatInputMoney(npoptkp)} 
                                onChange={e => setNpoptkp(parseInputMoney(e.target.value))} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono" 
                            />
                        </div>
                    </div>
                </div>

                {/* ADMIN FEES INPUTS */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">3. Biaya Administrasi & Lain-lain</h3>
                        <button onClick={addFee} className="text-xs text-primary-600 font-medium">+ Tambah Item</button>
                    </div>
                    <div className="space-y-2">
                        {adminFees.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    value={item.name} 
                                    onChange={e => handleUpdateFee(idx, 'name', e.target.value)} 
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                                />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={formatInputMoney(item.amount)} 
                                    onChange={e => handleUpdateFee(idx, 'amount', parseInputMoney(e.target.value))} 
                                    className="w-32 px-2 py-1 border border-slate-300 rounded text-sm text-right font-mono"
                                />
                                <button onClick={() => removeFee(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PREVIEW SECTION (To be printed) */}
            <div className="bg-slate-200 p-4 rounded-xl overflow-auto flex justify-center">
                <div id="print-area" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 shadow-lg text-black font-sans text-sm relative">
                    
                    {/* Header */}
                    <div className="text-center font-bold text-lg uppercase border-b-4 border-green-800 pb-1 mb-1">
                        {title}
                    </div>
                    <div className="border-t border-green-800 mb-6"></div>
                    
                    {/* INFO BLOCK */}
                     <div className="mb-4 text-xs">
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
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{certificateNumber}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>Desa</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{certificateVillage}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '20%', padding: '2px 0'}}>NOP PBB</td>
                                    <td style={{width: '2%', padding: '2px 0'}}>:</td>
                                    <td style={{fontWeight: 'bold', padding: '2px 0'}}>{nopPbb}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table Style CSS in JS for portability */}
                    <style>{`
                        .cost-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                        .cost-table th, .cost-table td { border: 1px solid #000; padding: 4px 8px; }
                        .cost-table th { text-align: center; font-weight: bold; background-color: #f9fafb; text-transform: uppercase; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .no-border-b { border-bottom: none !important; }
                        .no-border-t { border-top: none !important; }
                    `}</style>

                    {/* TABLE 1: NJOP */}
                    <div className="font-bold mb-1 ml-1 text-xs">PENILAIAN NJOP</div>
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
                                <td className="text-center">{landArea}</td>
                                <td className="text-right">{formatCurrency(landNjop)}</td>
                                <td className="text-right">Rp {formatCurrency(calculation.totalLand)}</td>
                            </tr>
                            <tr>
                                <td>BANGUNAN</td>
                                <td className="text-center">{buildingArea}</td>
                                <td className="text-right">{formatCurrency(buildingNjop)}</td>
                                <td className="text-right">Rp {formatCurrency(calculation.totalBuilding)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={3} className="text-center">TOTAL</td>
                                <td className="text-right">Rp {formatCurrency(calculation.totalNjop)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={3} className="text-center">Penilaian/ Nilai Transaksi</td>
                                <td className="text-right">Rp {formatCurrency(transactionValue)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* TABLE 2: BPHTB */}
                    <div className="font-bold mb-1 ml-1 text-xs">BPHTB</div>
                    <table className="cost-table">
                        <tbody>
                            <tr>
                                <td style={{width: '45%'}}>NILAI TRANSAKSI</td>
                                <td style={{width: '55%'}} className="text-right font-bold">Rp {formatCurrency(transactionValue)}</td>
                            </tr>
                            <tr>
                                <td>NPOPTKP</td>
                                <td className="text-right">Rp {formatCurrency(npoptkp)}</td>
                            </tr>
                            <tr>
                                <td>NPOPKP</td>
                                <td className="text-right">Rp {formatCurrency(calculation.npopkp)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td>NILAI PAJAK 5%</td>
                                <td className="text-right">Rp {formatCurrency(calculation.bphtb)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* TABLE 3: PPH */}
                    <div className="font-bold mb-1 ml-1 text-xs">PPH {pphScale > 1 ? `(PORSI 1/${pphScale})` : ''}</div>
                    <table className="cost-table">
                        <tbody>
                            <tr>
                                <td style={{width: '45%'}}>NILAI TRANSAKSI</td>
                                <td style={{width: '55%'}} className="text-right font-bold">Rp {formatCurrency(transactionValue)}</td>
                            </tr>
                            {/* Jika Porsi Pecahan, tampilkan hitungannya */}
                            {pphScale > 1 && (
                                <tr>
                                    <td>DASAR PENGENAAN (1/{pphScale})</td>
                                    <td className="text-right">Rp {formatCurrency(calculation.pphBasis)}</td>
                                </tr>
                            )}
                            <tr className="font-bold">
                                <td>NILAI PAJAK 2,5%</td>
                                <td className="text-right">Rp {formatCurrency(calculation.pph)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* TABLE 4: BIAYA LAIN */}
                    <div className="font-bold mb-1 ml-1 text-xs">BIAYA ADMINISTRASI & LAIN-LAIN</div>
                    <table className="cost-table" style={{border: 'none'}}>
                        <tbody>
                            {adminFees.map((fee, idx) => (
                                <tr key={idx} style={{border: 'none'}}>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '45%'}}>{fee.name}</td>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '10%', textAlign: 'right'}}>Rp</td>
                                    <td style={{border: 'none', borderBottom: '1px solid #e5e7eb', width: '45%', textAlign: 'right'}}>{formatCurrency(fee.amount)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold" style={{border: 'none'}}>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '5px'}}>TOTAL BIAYA ADM & LAIN-LAIN</td>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'right'}}>Rp</td>
                                <td style={{border: 'none', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'right'}}>{formatCurrency(calculation.totalAdmin)}</td>
                            </tr>
                            <tr style={{height: '10px'}}><td colSpan={3}></td></tr>
                            <tr className="font-bold" style={{border: 'none', fontSize: '12px'}}>
                                <td style={{border: 'none', borderTop: '2px solid #000', paddingTop: '10px'}}>GRAND TOTAL (PAJAK + BIAYA)</td>
                                <td style={{border: 'none', borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'right'}}>Rp</td>
                                <td style={{border: 'none', borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'right'}}>{formatCurrency(calculation.grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    </div>
  );
};
