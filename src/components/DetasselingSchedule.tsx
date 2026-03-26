import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution, DetasselingRecord } from '../types';
import { Calendar, X, Edit2, Printer, Filter, Download } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  detasselingRecords: DetasselingRecord[];
  setDetasselingRecords: (r: DetasselingRecord[]) => void;
}

export default function DetasselingSchedule({ farmers, seeds, seedDistributions, detasselingRecords, setDetasselingRecords }: Props) {
  const [selectedDistId, setSelectedDistId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  
  // Filters
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    supervisor: '',
    isClean: false,
  });

  const activePlantings = useMemo(() => {
    return seedDistributions.map(dist => {
      const farmer = farmers.find(f => f.id === dist.farmerId);
      const seed = seeds.find(s => s.id === dist.seedId);
      const records = detasselingRecords.filter(r => r.seedDistributionId === dist.id);
      
      let estDetasseling1 = '-';
      let estDetasseling1_raw = '';
      let estMaleSlashing = '-';
      let estMaleSlashing_raw = '';
      let estHarvest = '-';
      let estHarvest_raw = '';
      
      if (seed && dist.plantingDate) {
        if (seed.detasseling1Days) {
          const d1Date = addDays(parseISO(dist.plantingDate), seed.detasseling1Days);
          estDetasseling1 = format(d1Date, 'dd MMM yyyy');
          estDetasseling1_raw = d1Date.toISOString();
        }
        if (seed.maleSlashingDays) {
          const mDate = addDays(parseISO(dist.plantingDate), seed.maleSlashingDays);
          estMaleSlashing = format(mDate, 'dd MMM yyyy');
          estMaleSlashing_raw = mDate.toISOString();
        }
        if (seed.harvestDays) {
          const hDate = addDays(parseISO(dist.plantingDate), seed.harvestDays);
          estHarvest = format(hDate, 'dd MMM yyyy');
          estHarvest_raw = hDate.toISOString();
        }
      }

      return {
        ...dist,
        farmerName: farmer?.name || 'Unknown',
        village: farmer?.village || 'Unknown',
        groupName: farmer?.groupName || 'Unknown',
        seedCompany: seed?.company || 'Unknown',
        seedVariety: seed?.variety || 'Unknown',
        seedName: seed ? `${seed.company} - ${seed.variety}` : 'Unknown',
        estDetasseling1,
        estDetasseling1_raw,
        estMaleSlashing,
        estMaleSlashing_raw,
        estHarvest,
        estHarvest_raw,
        records
      };
    }).sort((a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime());
  }, [seedDistributions, farmers, seeds, detasselingRecords]);

  // Filter Options
  const villages = useMemo(() => Array.from(new Set(activePlantings.map(p => p.village))).filter(v => v !== 'Unknown').sort(), [activePlantings]);
  const groups = useMemo(() => Array.from(new Set(activePlantings.map(p => p.groupName))).filter(g => g !== 'Unknown').sort(), [activePlantings]);
  const companies = useMemo(() => Array.from(new Set(activePlantings.map(p => p.seedCompany))).filter(c => c !== 'Unknown').sort(), [activePlantings]);
  const varieties = useMemo(() => Array.from(new Set(activePlantings.map(p => p.seedVariety))).filter(v => v !== 'Unknown').sort(), [activePlantings]);

  const filteredPlantings = useMemo(() => {
    return activePlantings.filter(p => {
      if (filterVillage && p.village !== filterVillage) return false;
      if (filterGroup && p.groupName !== filterGroup) return false;
      if (filterCompany && p.seedCompany !== filterCompany) return false;
      if (filterVariety && p.seedVariety !== filterVariety) return false;
      
      if (filterStatus) {
        const d1 = p.records.find(r => r.phase === 1);
        const d2 = p.records.find(r => r.phase === 2);
        const d3 = p.records.find(r => r.phase === 3);
        
        if (filterStatus === 'Belum D1' && d1) return false;
        if (filterStatus === 'Sudah D1' && (!d1 || d2)) return false;
        if (filterStatus === 'Sudah D2' && (!d2 || d3)) return false;
        if (filterStatus === 'Selesai' && !d3) return false;
      }
      
      return true;
    });
  }, [activePlantings, filterVillage, filterGroup, filterCompany, filterVariety, filterStatus]);

  const openModal = (distId: string, p: 1 | 2 | 3) => {
    setSelectedDistId(distId);
    setEditingRecordId(null);
    setPhase(p);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      supervisor: '',
      isClean: false,
    });
    setShowModal(true);
  };

  const editRecord = (record: DetasselingRecord) => {
    setSelectedDistId(record.seedDistributionId);
    setEditingRecordId(record.id);
    setPhase(record.phase);
    setFormData({
      date: record.date,
      supervisor: record.supervisor,
      isClean: record.isClean,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistId) return;

    if (editingRecordId) {
      setDetasselingRecords(detasselingRecords.map(r => 
        r.id === editingRecordId 
          ? { ...r, date: formData.date, supervisor: formData.supervisor, isClean: formData.isClean }
          : r
      ));
    } else {
      const newRecord: DetasselingRecord = {
        id: crypto.randomUUID(),
        seedDistributionId: selectedDistId,
        phase,
        date: formData.date,
        supervisor: formData.supervisor,
        workerCount: 0,
        workerNames: [],
        costPerWorker: 0,
        totalCost: 0,
        isClean: formData.isClean,
        createdAt: new Date().toISOString()
      };
      setDetasselingRecords([...detasselingRecords, newRecord]);
    }
    setShowModal(false);
  };

  const deleteRecord = (id: string) => {
    if (confirm('Hapus catatan detasseling ini?')) {
      setDetasselingRecords(detasselingRecords.filter(r => r.id !== id));
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const downloadCSV = () => {
    const headers = ['No', 'Nama Petani', 'Desa / Kelompok', 'Perusahaan / Varietas', 'Tgl Tanam', 'Est. Cabut 1', 'Cabut 2', 'Cabut 3', 'Babat Jantan', 'Est. Panen'];
    const rows = filteredPlantings.map((p, i) => [
      i + 1,
      p.farmerName,
      `${p.village} / ${p.groupName}`,
      `${p.seedCompany} / ${p.seedVariety}`,
      format(parseISO(p.plantingDate), 'dd/MM/yyyy'),
      p.estDetasseling1_raw ? format(parseISO(p.estDetasseling1_raw), 'dd/MM/yyyy') : '-',
      '',
      '',
      p.estMaleSlashing_raw ? format(parseISO(p.estMaleSlashing_raw), 'dd/MM/yyyy') : '-',
      p.estHarvest_raw ? format(parseISO(p.estHarvest_raw), 'dd/MM/yyyy') : '-'
    ]);

    // Tambahkan BOM (\ufeff) dan gunakan titik koma (;) agar rapi di Excel versi Indonesia
    const csvContent = '\ufeff' + [
      headers.join(';'),
      ...rows.map(e => e.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jadwal_Detasseling_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {!showPrintPreview ? (
        <div className="p-6 space-y-6 print:hidden">
          <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#212529]">Jadwal Detasseling</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau jadwal dan catat pelaksanaan pencabutan bunga jantan (detasseling) 1, 2, dan 3.</p>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors font-medium shadow-sm"
          >
            <Printer size={18} />
            Cetak Jadwal Kosong
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF] flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2 text-gray-500 mb-1 w-full">
            <Filter size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">Filter Data</span>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Desa</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterVillage} onChange={e => setFilterVillage(e.target.value)}>
              <option value="">Semua Desa</option>
              {villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Kelompok Tani</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
              <option value="">Semua Kelompok</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Perusahaan Benih</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
              <option value="">Semua Perusahaan</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Varietas</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterVariety} onChange={e => setFilterVariety(e.target.value)}>
              <option value="">Semua Varietas</option>
              {varieties.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="Belum D1">Belum D1</option>
              <option value="Sudah D1">Sudah D1</option>
              <option value="Sudah D2">Sudah D2</option>
              <option value="Selesai">Selesai (Sudah D3)</option>
            </select>
          </div>
          {(filterVillage || filterGroup || filterCompany || filterVariety || filterStatus) && (
            <button 
              onClick={() => { setFilterVillage(''); setFilterGroup(''); setFilterCompany(''); setFilterVariety(''); setFilterStatus(''); }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E9ECEF] text-[#495057] text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold border-b">Petani & Lahan</th>
                  <th className="p-4 font-bold border-b">Varietas & Tgl Tanam</th>
                  <th className="p-4 font-bold border-b text-center w-48">Detasseling 1</th>
                  <th className="p-4 font-bold border-b text-center w-48">Detasseling 2</th>
                  <th className="p-4 font-bold border-b text-center w-48">Detasseling 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredPlantings.map(planting => {
                  const d1 = planting.records.find(r => r.phase === 1);
                  const d2 = planting.records.find(r => r.phase === 2);
                  const d3 = planting.records.find(r => r.phase === 3);

                  return (
                    <tr key={planting.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[#212529]">{planting.farmerName}</div>
                        <div className="text-xs text-gray-500">{planting.village} - {planting.groupName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#2D6A4F]">{planting.seedName}</div>
                        <div className="text-xs text-gray-500">Tanam: {format(parseISO(planting.plantingDate), 'dd MMM yyyy')}</div>
                      </td>

                      {/* Detasseling 1 */}
                      <td className="p-4">
                        {d1 ? (
                          <div className="text-sm border rounded-lg p-2 bg-green-50 border-green-200 relative group">
                            <div className="font-bold text-green-700">{format(parseISO(d1.date), 'dd MMM yyyy')}</div>
                            <div className="text-xs text-green-600">{d1.isClean ? 'Bersih' : 'Belum Bersih'}</div>
                            <div className="text-xs text-gray-500">Pengawas: {d1.supervisor}</div>
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button onClick={() => editRecord(d1)} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit2 size={14}/></button>
                              <button onClick={() => deleteRecord(d1.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Est: {planting.estDetasseling1}</div>
                            <button onClick={() => openModal(planting.id, 1)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium">Catat D1</button>
                          </div>
                        )}
                      </td>

                      {/* Detasseling 2 */}
                      <td className="p-4">
                        {d2 ? (
                          <div className="text-sm border rounded-lg p-2 bg-green-50 border-green-200 relative group">
                            <div className="font-bold text-green-700">{format(parseISO(d2.date), 'dd MMM yyyy')}</div>
                            <div className="text-xs text-green-600">{d2.isClean ? 'Bersih' : 'Belum Bersih'}</div>
                            <div className="text-xs text-gray-500">Pengawas: {d2.supervisor}</div>
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button onClick={() => editRecord(d2)} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit2 size={14}/></button>
                              <button onClick={() => deleteRecord(d2.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <button onClick={() => openModal(planting.id, 2)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium" disabled={!d1}>Catat D2</button>
                          </div>
                        )}
                      </td>

                      {/* Detasseling 3 */}
                      <td className="p-4">
                        {d3 ? (
                          <div className="text-sm border rounded-lg p-2 bg-green-50 border-green-200 relative group">
                            <div className="font-bold text-green-700">{format(parseISO(d3.date), 'dd MMM yyyy')}</div>
                            <div className="text-xs text-green-600">{d3.isClean ? 'Bersih' : 'Belum Bersih'}</div>
                            <div className="text-xs text-gray-500">Pengawas: {d3.supervisor}</div>
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button onClick={() => editRecord(d3)} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit2 size={14}/></button>
                              <button onClick={() => deleteRecord(d3.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <button onClick={() => openModal(planting.id, 3)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium" disabled={!d2}>Catat D3</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPlantings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Tidak ada data penanaman yang sesuai filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
                <h3 className="text-xl font-bold text-[#212529]">
                  Catat Pelaksanaan Detasseling {phase}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-[#6C757D] hover:text-[#212529]"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Pelaksanaan</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Nama Pengawas</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Masukkan nama pengawas..."
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={formData.supervisor} 
                    onChange={e => setFormData({...formData, supervisor: e.target.value})} 
                  />
                </div>
                
                <div className="flex items-center gap-2 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="isClean"
                    className="w-4 h-4 text-[#2D6A4F] rounded focus:ring-[#2D6A4F]"
                    checked={formData.isClean}
                    onChange={e => setFormData({...formData, isClean: e.target.checked})}
                  />
                  <label htmlFor="isClean" className="text-sm font-medium text-[#495057]">Status: Sudah Bersih</label>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-[#2D6A4F] text-white rounded-lg font-bold hover:bg-[#1B4332]">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
          </div>
        ) : (
          <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white">
            <div className="max-w-6xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
                <h2 className="text-xl font-bold text-[#212529]">Preview Cetak Jadwal</h2>
                <div className="flex gap-3">
                  <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors">
                    <X size={18}/> Tutup Preview
                  </button>
                  <button onClick={downloadCSV} className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Download size={18} /> Download CSV (Excel)
                  </button>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Printer size={18} /> Print Sekarang
                  </button>
                </div>
              </div>

              {/* Printable Content */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Jadwal Detasseling & Panen</h1>
                <p className="text-sm mt-1">
                  {filterVillage ? `Desa: ${filterVillage} | ` : ''}
                  {filterGroup ? `Kelompok: ${filterGroup} | ` : ''}
                  {filterCompany ? `Perusahaan: ${filterCompany} | ` : ''}
                  {filterVariety ? `Varietas: ${filterVariety}` : ''}
                </p>
              </div>

              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-center w-8">No</th>
                    <th className="border border-black p-2">Nama Petani</th>
                    <th className="border border-black p-2">Desa / Kelompok</th>
                    <th className="border border-black p-2">Perusahaan / Varietas</th>
                    <th className="border border-black p-2 text-center">Tgl Tanam</th>
                    <th className="border border-black p-2 text-center">Est. Cabut 1</th>
                    <th className="border border-black p-2 text-center w-20">Cabut 2</th>
                    <th className="border border-black p-2 text-center w-20">Cabut 3</th>
                    <th className="border border-black p-2 text-center w-20">Babat Jantan</th>
                    <th className="border border-black p-2 text-center">Est. Panen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlantings.map((planting, index) => (
                    <tr key={planting.id}>
                      <td className="border border-black p-2 text-center">{index + 1}</td>
                      <td className="border border-black p-2 font-bold">{planting.farmerName}</td>
                      <td className="border border-black p-2">
                        {planting.village}<br/>
                        <span className="text-[9px] text-gray-600">{planting.groupName}</span>
                      </td>
                      <td className="border border-black p-2">
                        {planting.seedCompany}<br/>
                        <span className="text-[9px] text-gray-600">{planting.seedVariety}</span>
                      </td>
                      <td className="border border-black p-2 text-center whitespace-nowrap">
                        {format(parseISO(planting.plantingDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="border border-black p-2 text-center whitespace-nowrap font-medium">
                        {planting.estDetasseling1_raw ? format(parseISO(planting.estDetasseling1_raw), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2 text-center whitespace-nowrap font-medium">
                        {planting.estMaleSlashing_raw ? format(parseISO(planting.estMaleSlashing_raw), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="border border-black p-2 text-center whitespace-nowrap font-medium">
                        {planting.estHarvest_raw ? format(parseISO(planting.estHarvest_raw), 'dd/MM/yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
}
