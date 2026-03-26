import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution, DetasselingRecord } from '../types';
import { DollarSign, X, Edit2, Users, Printer, Filter, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  detasselingRecords: DetasselingRecord[];
  setDetasselingRecords: (r: DetasselingRecord[]) => void;
}

export default function DetasselingCost({ farmers, seeds, seedDistributions, detasselingRecords, setDetasselingRecords }: Props) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    workerCount: 1,
    workerNamesInput: '',
    costPerWorker: 0,
  });

  // Bulk Input State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    workerCount: 1,
    workerNamesInput: '',
    costPerWorker: 0,
    selectedRecordIds: [] as string[],
    costMethod: 'split' as 'split' | 'full'
  });

  // Filters & Print
  const [filterDate, setFilterDate] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const recordsWithDetails = useMemo(() => {
    return detasselingRecords.map(record => {
      const dist = seedDistributions.find(d => d.id === record.seedDistributionId);
      const farmer = farmers.find(f => f.id === dist?.farmerId);
      const seed = seeds.find(s => s.id === dist?.seedId);

      return {
        ...record,
        farmerName: farmer?.name || 'Unknown',
        village: farmer?.village || 'Unknown',
        groupName: farmer?.groupName || 'Unknown',
        seedCompany: seed?.company || 'Unknown',
        seedVariety: seed?.variety || 'Unknown',
        seedName: seed ? `${seed.company} - ${seed.variety}` : 'Unknown',
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [detasselingRecords, seedDistributions, farmers, seeds]);

  // Filter Options
  const dates = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.date))) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [recordsWithDetails]);
  const villages = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.village))) as string[]).filter(v => v !== 'Unknown').sort(), [recordsWithDetails]);
  const groups = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.groupName))) as string[]).filter(g => g !== 'Unknown').sort(), [recordsWithDetails]);
  const companies = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.seedCompany))) as string[]).filter(c => c !== 'Unknown').sort(), [recordsWithDetails]);
  const varieties = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.seedVariety))) as string[]).filter(v => v !== 'Unknown').sort(), [recordsWithDetails]);

  const filteredRecords = useMemo(() => {
    return recordsWithDetails.filter(p => {
      if (filterDate && p.date !== filterDate) return false;
      if (filterVillage && p.village !== filterVillage) return false;
      if (filterGroup && p.groupName !== filterGroup) return false;
      if (filterCompany && p.seedCompany !== filterCompany) return false;
      if (filterVariety && p.seedVariety !== filterVariety) return false;
      return true;
    });
  }, [recordsWithDetails, filterDate, filterVillage, filterGroup, filterCompany, filterVariety]);

  const availableRecordsForBulk = useMemo(() => {
    return recordsWithDetails.filter(r => r.date === bulkData.date);
  }, [recordsWithDetails, bulkData.date]);

  const openModal = (record: typeof recordsWithDetails[0]) => {
    setSelectedRecordId(record.id);
    setFormData({
      workerCount: record.workerCount || 1,
      workerNamesInput: record.workerNames ? record.workerNames.join('\n') : '',
      costPerWorker: record.costPerWorker || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    const names = formData.workerNamesInput.split(/[\n,]+/).map(n => n.trim()).filter(n => n);

    setDetasselingRecords(detasselingRecords.map(r => 
      r.id === selectedRecordId 
        ? { 
            ...r, 
            workerCount: formData.workerCount, 
            workerNames: names,
            costPerWorker: formData.costPerWorker, 
            totalCost: formData.workerCount * formData.costPerWorker 
          } 
        : r
    ));

    setShowModal(false);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkData.selectedRecordIds.length === 0) {
      alert('Pilih minimal satu lahan!');
      return;
    }

    const names = bulkData.workerNamesInput.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    const workerCount = bulkData.workerCount;
    const totalDailyCost = workerCount * bulkData.costPerWorker;
    
    const costPerRecord = bulkData.costMethod === 'split' 
      ? totalDailyCost / bulkData.selectedRecordIds.length 
      : totalDailyCost;
      
    const costPerWorkerPerRecord = bulkData.costMethod === 'split' 
      ? bulkData.costPerWorker / bulkData.selectedRecordIds.length 
      : bulkData.costPerWorker;

    setDetasselingRecords(detasselingRecords.map(r => {
      if (bulkData.selectedRecordIds.includes(r.id)) {
        return {
          ...r,
          workerCount,
          workerNames: names,
          costPerWorker: costPerWorkerPerRecord,
          totalCost: costPerRecord
        };
      }
      return r;
    }));

    setShowBulkModal(false);
  };

  const downloadCSV = () => {
    const headers = ['No', 'Tanggal', 'Fase', 'Nama Petani', 'Desa / Kelompok', 'Perusahaan / Varietas', 'Pengawas', 'Jml Pekerja', 'Biaya/Orang (Rp)', 'Total Biaya (Rp)'];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      format(parseISO(r.date), 'dd/MM/yyyy'),
      `Detasseling ${r.phase}`,
      r.farmerName,
      `${r.village} / ${r.groupName}`,
      `${r.seedCompany} / ${r.seedVariety}`,
      r.supervisor,
      r.workerCount,
      r.costPerWorker,
      r.totalCost
    ]);

    const csvContent = '\ufeff' + [
      headers.join(';'),
      ...rows.map(e => e.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Biaya_Detasseling_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {!showPrintPreview ? (
        <div className="p-6 space-y-6 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-6 border-b border-[#E9ECEF] bg-[#F8F9FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
                  <DollarSign className="text-rose-600" size={24} />
                  Pendataan Biaya Detasseling
                </h3>
                <p className="text-sm text-gray-500 mt-1">Input jumlah pekerja dan biaya harian untuk setiap aktivitas detasseling yang telah dilaksanakan.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowPrintPreview(true)}
                  className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1B4332] transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Printer size={18} />
                  Cetak Laporan
                </button>
                <button 
                  onClick={() => {
                    setBulkData({
                      date: format(new Date(), 'yyyy-MM-dd'),
                      workerCount: 1,
                      workerNamesInput: '',
                      costPerWorker: 0,
                      selectedRecordIds: [],
                      costMethod: 'split'
                    });
                    setShowBulkModal(true);
                  }}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Users size={18} />
                  Input Biaya Harian
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="p-4 border-b border-[#E9ECEF] bg-white flex flex-wrap gap-4 items-end">
              <div className="flex items-center gap-2 text-gray-500 mb-1 w-full">
                <Filter size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">Filter Data</span>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                  <option value="">Semua Tanggal</option>
                  {dates.map(d => <option key={d} value={d}>{format(parseISO(d), 'dd MMM yyyy')}</option>)}
                </select>
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
              {(filterDate || filterVillage || filterGroup || filterCompany || filterVariety) && (
                <button 
                  onClick={() => { setFilterDate(''); setFilterVillage(''); setFilterGroup(''); setFilterCompany(''); setFilterVariety(''); }}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E9ECEF] text-[#495057] text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold border-b">Tanggal & Fase</th>
                    <th className="p-4 font-bold border-b">Petani & Varietas</th>
                    <th className="p-4 font-bold border-b">Pengawas</th>
                    <th className="p-4 font-bold border-b text-center">Jml Pekerja</th>
                    <th className="p-4 font-bold border-b text-right">Biaya/Orang (Rp)</th>
                    <th className="p-4 font-bold border-b text-right">Total Biaya (Rp)</th>
                    <th className="p-4 font-bold border-b text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#212529]">{format(parseISO(record.date), 'dd MMM yyyy')}</div>
                    <div className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block mt-1">Detasseling {record.phase}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-[#212529]">{record.farmerName}</div>
                    <div className="text-xs text-gray-500">{record.village} | {record.seedName}</div>
                  </td>
                  <td className="p-4 text-sm font-medium">{record.supervisor}</td>
                  <td className="p-4 text-center font-medium">
                    {record.workerCount > 0 ? (
                      <div>
                        {record.workerCount}
                        {record.workerNames && record.workerNames.length > 0 && (
                          <div className="text-[10px] text-gray-500 font-normal mt-1 text-left">
                            {record.workerNames.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-right text-gray-600">{record.costPerWorker > 0 ? record.costPerWorker.toLocaleString('id-ID') : '-'}</td>
                  <td className="p-4 text-right">
                    {record.totalCost > 0 ? (
                      <span className="font-bold text-rose-600">{record.totalCost.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">Belum diinput</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openModal(record)} 
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 mx-auto ${
                        record.totalCost > 0 
                          ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <Edit2 size={14} />
                      {record.totalCost > 0 ? 'Edit Biaya' : 'Input Biaya'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Belum ada data pelaksanaan detasseling yang sesuai filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">Input Biaya Detasseling</h3>
              <button onClick={() => setShowModal(false)} className="text-[#6C757D] hover:text-[#212529]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Daftar Nama Pekerja/Pencabut</label>
                <textarea 
                  className="w-full px-4 py-2 border rounded-lg text-sm" 
                  rows={6}
                  placeholder="Masukkan nama pekerja, pisahkan dengan koma atau baris baru..."
                  value={formData.workerNamesInput}
                  onChange={e => {
                    const val = e.target.value;
                    const count = val.split(/[\n,]+/).filter(n => n.trim()).length;
                    setFormData({...formData, workerNamesInput: val, workerCount: count > 0 ? count : formData.workerCount});
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Jumlah pekerja akan otomatis dihitung dari daftar nama.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Jml Anggota/Pencabut</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50" 
                  value={formData.workerCount} 
                  onChange={e => setFormData({...formData, workerCount: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Biaya Harian/Orang (Rp)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg" 
                  value={formData.costPerWorker} 
                  onChange={e => setFormData({...formData, costPerWorker: Number(e.target.value)})} 
                />
              </div>
              
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 mt-4">
                <div className="text-sm text-rose-800 font-bold flex justify-between">
                  <span>Total Biaya:</span>
                  <span>Rp {(formData.workerCount * formData.costPerWorker).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
                <button type="submit" className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700">Simpan Biaya</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Input Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">Input Biaya Harian (Multi-Lahan)</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-[#6C757D] hover:text-[#212529]"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="bulkForm" onSubmit={handleBulkSubmit} className="space-y-6">
                {/* Row 1: Date & Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Pelaksanaan</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full px-4 py-2 border rounded-lg" 
                      value={bulkData.date} 
                      onChange={e => setBulkData({...bulkData, date: e.target.value, selectedRecordIds: []})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Biaya Harian/Orang (Rp)</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg" 
                      value={bulkData.costPerWorker} 
                      onChange={e => setBulkData({...bulkData, costPerWorker: Number(e.target.value)})} 
                    />
                  </div>
                </div>

                {/* Row 2: Workers */}
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Daftar Nama Pekerja/Pencabut</label>
                  <textarea 
                    className="w-full px-4 py-2 border rounded-lg text-sm" 
                    rows={6}
                    placeholder="Masukkan nama pekerja, pisahkan dengan koma atau baris baru..."
                    value={bulkData.workerNamesInput}
                    onChange={e => {
                      const val = e.target.value;
                      const count = val.split(/[\n,]+/).filter(n => n.trim()).length;
                      setBulkData({...bulkData, workerNamesInput: val, workerCount: count > 0 ? count : bulkData.workerCount});
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Pisahkan dengan koma atau enter.</p>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-[#495057]">Jml Pekerja:</label>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        className="w-20 px-2 py-1 border rounded bg-gray-50 text-center" 
                        value={bulkData.workerCount} 
                        onChange={e => setBulkData({...bulkData, workerCount: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Select Fields */}
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-2">Pilih Lahan yang Dikerjakan ({format(parseISO(bulkData.date), 'dd MMM yyyy')})</label>
                  {availableRecordsForBulk.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden divide-y">
                      {availableRecordsForBulk.map(record => (
                        <label key={record.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-600"
                            checked={bulkData.selectedRecordIds.includes(record.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setBulkData({...bulkData, selectedRecordIds: [...bulkData.selectedRecordIds, record.id]});
                              } else {
                                setBulkData({...bulkData, selectedRecordIds: bulkData.selectedRecordIds.filter(id => id !== record.id)});
                              }
                            }}
                          />
                          <div>
                            <div className="font-bold text-[#212529] text-sm">{record.farmerName} <span className="text-rose-600 font-medium">(Detasseling {record.phase})</span></div>
                            <div className="text-xs text-gray-500">{record.village} | {record.seedName}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 text-orange-800 p-4 rounded-lg text-sm border border-orange-200">
                      Tidak ada jadwal detasseling pada tanggal <strong>{format(parseISO(bulkData.date), 'dd MMM yyyy')}</strong>. Silakan catat pelaksanaan di menu <strong>Jadwal Detasseling</strong> terlebih dahulu.
                    </div>
                  )}
                </div>

                {/* Row 4: Cost Method */}
                {bulkData.selectedRecordIds.length > 0 && (
                  <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 space-y-3">
                    <label className="block text-sm font-bold text-rose-900">Metode Pembagian Biaya</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="costMethod" 
                          className="mt-1 text-rose-600 focus:ring-rose-600"
                          checked={bulkData.costMethod === 'split'}
                          onChange={() => setBulkData({...bulkData, costMethod: 'split'})}
                        />
                        <div>
                          <div className="text-sm font-bold text-rose-900">Dibagi Rata ke {bulkData.selectedRecordIds.length} Lahan</div>
                          <div className="text-xs text-rose-700">Total biaya harian (Rp {(bulkData.workerCount * bulkData.costPerWorker).toLocaleString('id-ID')}) akan dibagi rata ke lahan yang dipilih.</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="costMethod" 
                          className="mt-1 text-rose-600 focus:ring-rose-600"
                          checked={bulkData.costMethod === 'full'}
                          onChange={() => setBulkData({...bulkData, costMethod: 'full'})}
                        />
                        <div>
                          <div className="text-sm font-bold text-rose-900">Dihitung Penuh per Lahan</div>
                          <div className="text-xs text-rose-700">Setiap lahan akan dibebankan biaya penuh (Rp {(bulkData.workerCount * bulkData.costPerWorker).toLocaleString('id-ID')}).</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-[#E9ECEF] bg-[#F8F9FA] flex justify-end gap-3">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
              <button 
                type="submit" 
                form="bulkForm"
                disabled={bulkData.selectedRecordIds.length === 0}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Biaya Harian
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white">
          <div className="max-w-6xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
              <h2 className="text-xl font-bold text-[#212529]">Preview Cetak Laporan Biaya</h2>
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
              <h1 className="text-2xl font-bold uppercase tracking-wider">Laporan Biaya Detasseling</h1>
              <p className="text-sm mt-1">
                {filterDate ? `Tanggal: ${format(parseISO(filterDate), 'dd MMM yyyy')} | ` : ''}
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
                  <th className="border border-black p-2 text-center">Tanggal</th>
                  <th className="border border-black p-2 text-center">Fase</th>
                  <th className="border border-black p-2">Nama Petani</th>
                  <th className="border border-black p-2">Desa / Kelompok</th>
                  <th className="border border-black p-2">Perusahaan / Varietas</th>
                  <th className="border border-black p-2">Pengawas</th>
                  <th className="border border-black p-2 text-center">Jml Pekerja</th>
                  <th className="border border-black p-2 text-right">Biaya/Orang (Rp)</th>
                  <th className="border border-black p-2 text-right">Total Biaya (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2 text-center whitespace-nowrap">{format(parseISO(record.date), 'dd/MM/yyyy')}</td>
                    <td className="border border-black p-2 text-center">D{record.phase}</td>
                    <td className="border border-black p-2 font-bold">{record.farmerName}</td>
                    <td className="border border-black p-2">
                      {record.village}<br/>
                      <span className="text-[9px] text-gray-600">{record.groupName}</span>
                    </td>
                    <td className="border border-black p-2">
                      {record.seedCompany}<br/>
                      <span className="text-[9px] text-gray-600">{record.seedVariety}</span>
                    </td>
                    <td className="border border-black p-2">{record.supervisor}</td>
                    <td className="border border-black p-2 text-center">{record.workerCount || '-'}</td>
                    <td className="border border-black p-2 text-right">{record.costPerWorker > 0 ? record.costPerWorker.toLocaleString('id-ID') : '-'}</td>
                    <td className="border border-black p-2 text-right font-bold">{record.totalCost > 0 ? record.totalCost.toLocaleString('id-ID') : '-'}</td>
                  </tr>
                ))}
                {filteredRecords.length > 0 && (
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={9} className="border border-black p-2 text-right">TOTAL KESELURUHAN</td>
                    <td className="border border-black p-2 text-right text-rose-600">
                      {filteredRecords.reduce((acc, r) => acc + r.totalCost, 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
