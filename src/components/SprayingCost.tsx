import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution, SprayingRecord } from '../types';
import { DollarSign, X, Edit2, Users, Printer, Filter, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  sprayingRecords: SprayingRecord[];
  setSprayingRecords: (r: SprayingRecord[]) => void;
}

export default function SprayingCost({ farmers, seeds, seedDistributions, sprayingRecords, setSprayingRecords }: Props) {
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
    return sprayingRecords.filter(record => {
      const dist = seedDistributions.find(d => d.id === record.seedDistributionId);
      if (!dist || !dist.hasSprayingSchedule) return false;
      if (dist.sprayingTypes && !dist.sprayingTypes.includes(record.type)) return false;
      return true;
    }).map(record => {
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
  }, [sprayingRecords, seedDistributions, farmers, seeds]);

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

    setSprayingRecords(sprayingRecords.map(r => 
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

    setSprayingRecords(sprayingRecords.map(r => {
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
    const headers = ['No', 'Tanggal', 'Jenis', 'Nama Petani', 'Desa / Kelompok', 'Perusahaan / Varietas', 'Pengawas', 'Jml Pekerja', 'Biaya/Orang (Rp)', 'Total Biaya (Rp)'];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      format(parseISO(r.date), 'dd/MM/yyyy'),
      r.type,
      r.farmerName,
      `${r.village} / ${r.groupName}`,
      `${r.seedCompany} / ${r.seedVariety}`,
      r.supervisor,
      r.workerCount || 0,
      r.costPerWorker || 0,
      r.totalCost || 0
    ]);

    const csvContent = '\ufeff' + [
      headers.join(';'),
      ...rows.map(e => e.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Biaya_Penyemprotan_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOverallCost = filteredRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  return (
    <div className="w-full">
      {!showPrintPreview ? (
        <div className="p-6 space-y-6 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-6 border-b border-[#E9ECEF] bg-[#F8F9FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
                  <DollarSign className="text-green-600" size={24} />
                  Biaya Penyemprotan
                </h3>
                <p className="text-sm text-gray-500 mt-1">Catat dan pantau biaya pekerja untuk setiap kegiatan penyemprotan.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Users size={18} />
                  Input Borongan
                </button>
                <button 
                  onClick={() => setShowPrintPreview(true)}
                  className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1B4332] transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Printer size={18} />
                  Cetak
                </button>
                <button 
                  onClick={downloadCSV}
                  className="bg-white border border-[#DEE2E6] text-[#495057] px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Download size={18} />
                  Export CSV
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
                <label className="block text-xs font-bold text-gray-600 mb-1">Kelompok</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                  <option value="">Semua Kelompok</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Perusahaan</label>
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tanggal</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Jenis</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Desa / Kelompok</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-center">Pekerja</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-right">Biaya/Org</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-right">Total Biaya</th>
                    <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="border-b border-[#E9ECEF] hover:bg-gray-50">
                      <td className="p-3 border border-[#DEE2E6] font-medium">{format(parseISO(r.date), 'dd MMM yyyy')}</td>
                      <td className="p-3 border border-[#DEE2E6]">{r.type}</td>
                      <td className="p-3 border border-[#DEE2E6]">{r.farmerName}</td>
                      <td className="p-3 border border-[#DEE2E6]">{r.village} / {r.groupName}</td>
                      <td className="p-3 border border-[#DEE2E6]">{r.seedCompany} - {r.seedVariety}</td>
                      <td className="p-3 border border-[#DEE2E6] text-center">
                        <div className="font-bold">{r.workerCount || 0} org</div>
                        {r.workerNames && r.workerNames.length > 0 && (
                          <div className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate" title={r.workerNames.join(', ')}>
                            {r.workerNames.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border border-[#DEE2E6] text-right">Rp {(r.costPerWorker || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 border border-[#DEE2E6] text-right font-bold text-[#2D6A4F]">Rp {(r.totalCost || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 border border-[#DEE2E6] text-center">
                        <button 
                          onClick={() => openModal(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Input Biaya"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#6C757D] border border-[#DEE2E6]">Belum ada data penyemprotan yang sesuai dengan filter.</td>
                    </tr>
                  )}
                  {filteredRecords.length > 0 && (
                    <tr className="bg-[#F8F9FA] font-bold">
                      <td colSpan={7} className="p-3 border border-[#DEE2E6] text-right">TOTAL KESELURUHAN:</td>
                      <td className="p-3 border border-[#DEE2E6] text-right text-lg text-[#2D6A4F]">Rp {totalOverallCost.toLocaleString('id-ID')}</td>
                      <td className="border border-[#DEE2E6]"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white min-h-screen">
          <div className="mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF]">
            <button onClick={() => setShowPrintPreview(false)} className="text-[#495057] hover:text-[#212529] flex items-center gap-2 font-medium">
              <X size={20} /> Tutup Preview
            </button>
            <button onClick={() => window.print()} className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm font-bold">
              <Printer size={20} /> Cetak Sekarang
            </button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#212529] uppercase tracking-wider">Laporan Biaya Penyemprotan</h1>
            <div className="text-[#6C757D] mt-2 text-sm flex flex-wrap justify-center gap-2">
              {filterDate && <span>Tanggal: {format(parseISO(filterDate), 'dd MMM yyyy')} |</span>}
              {filterVillage && <span>Desa: {filterVillage} |</span>}
              {filterGroup && <span>Kelompok: {filterGroup} |</span>}
              {filterCompany && <span>Perusahaan: {filterCompany} |</span>}
              {filterVariety && <span>Varietas: {filterVariety}</span>}
              {!filterDate && !filterVillage && !filterGroup && !filterCompany && !filterVariety && <span>Semua Data</span>}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">No</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tanggal</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Jenis</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Desa / Kelompok</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-center">Pekerja</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-right">Biaya/Org</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, i) => (
                <tr key={r.id} className="border-b border-[#E9ECEF]">
                  <td className="p-3 border border-[#DEE2E6] text-center">{i + 1}</td>
                  <td className="p-3 border border-[#DEE2E6]">{format(parseISO(r.date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 border border-[#DEE2E6]">{r.type}</td>
                  <td className="p-3 border border-[#DEE2E6]">{r.farmerName}</td>
                  <td className="p-3 border border-[#DEE2E6]">{r.village} / {r.groupName}</td>
                  <td className="p-3 border border-[#DEE2E6]">{r.seedCompany} - {r.seedVariety}</td>
                  <td className="p-3 border border-[#DEE2E6] text-center">{r.workerCount || 0}</td>
                  <td className="p-3 border border-[#DEE2E6] text-right">Rp {(r.costPerWorker || 0).toLocaleString('id-ID')}</td>
                  <td className="p-3 border border-[#DEE2E6] text-right font-bold">Rp {(r.totalCost || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {filteredRecords.length > 0 && (
                <tr className="bg-[#F8F9FA] font-bold">
                  <td colSpan={8} className="p-3 border border-[#DEE2E6] text-right">TOTAL KESELURUHAN:</td>
                  <td className="p-3 border border-[#DEE2E6] text-right">Rp {totalOverallCost.toLocaleString('id-ID')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Single Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="font-bold text-lg text-[#212529]">Input Biaya Pekerja</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Jumlah Pekerja</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                  value={formData.workerCount}
                  onChange={e => setFormData({...formData, workerCount: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Nama Pekerja (Opsional)</label>
                <div className="text-xs text-gray-500 mb-2">Pisahkan dengan koma atau baris baru (Enter)</div>
                <textarea 
                  rows={3}
                  placeholder="Contoh: Budi, Santoso, Wati"
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                  value={formData.workerNamesInput}
                  onChange={e => setFormData({...formData, workerNamesInput: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Biaya per Pekerja (Rp)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                  value={formData.costPerWorker}
                  onChange={e => setFormData({...formData, costPerWorker: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                <div className="text-sm text-green-800 font-medium mb-1">Total Biaya:</div>
                <div className="text-2xl font-bold text-green-700">
                  Rp {(formData.workerCount * formData.costPerWorker).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[#495057] bg-[#E9ECEF] hover:bg-[#DEE2E6] rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg font-medium hover:bg-[#1B4332] transition-colors"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Input Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="font-bold text-lg text-[#212529]">Input Borongan (Banyak Lahan)</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 border border-blue-200">
                Fitur ini digunakan jika satu kelompok pekerja mengerjakan beberapa lahan dalam satu hari yang sama. Biaya dapat dibagi rata ke semua lahan atau dibebankan penuh ke masing-masing lahan.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Kegiatan</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                      value={bulkData.date}
                      onChange={e => setBulkData({...bulkData, date: e.target.value, selectedRecordIds: []})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Jumlah Pekerja Total</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                      value={bulkData.workerCount}
                      onChange={e => setBulkData({...bulkData, workerCount: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Biaya per Pekerja (Rp)</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                      value={bulkData.costPerWorker}
                      onChange={e => setBulkData({...bulkData, costPerWorker: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-1">Nama Pekerja (Opsional)</label>
                    <textarea 
                      rows={2}
                      placeholder="Budi, Santoso..."
                      className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                      value={bulkData.workerNamesInput}
                      onChange={e => setBulkData({...bulkData, workerNamesInput: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#495057] mb-2">Metode Pembebanan Biaya</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="costMethod" 
                          value="split" 
                          checked={bulkData.costMethod === 'split'}
                          onChange={() => setBulkData({...bulkData, costMethod: 'split'})}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-bold text-sm">Bagi Rata (Split)</div>
                          <div className="text-xs text-gray-500">Total biaya harian dibagi rata ke semua lahan yang dipilih.</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="costMethod" 
                          value="full" 
                          checked={bulkData.costMethod === 'full'}
                          onChange={() => setBulkData({...bulkData, costMethod: 'full'})}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-bold text-sm">Beban Penuh (Full)</div>
                          <div className="text-xs text-gray-500">Setiap lahan menanggung biaya penuh dari jumlah pekerja yang diinput.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-[#DEE2E6] rounded-lg flex flex-col h-[400px]">
                  <div className="p-3 bg-gray-50 border-b border-[#DEE2E6] font-bold text-sm flex justify-between items-center">
                    <span>Pilih Lahan ({availableRecordsForBulk.length} tersedia)</span>
                    <button 
                      type="button"
                      onClick={() => {
                        if (bulkData.selectedRecordIds.length === availableRecordsForBulk.length) {
                          setBulkData({...bulkData, selectedRecordIds: []});
                        } else {
                          setBulkData({...bulkData, selectedRecordIds: availableRecordsForBulk.map(r => r.id)});
                        }
                      }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {bulkData.selectedRecordIds.length === availableRecordsForBulk.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {availableRecordsForBulk.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm p-4">
                        Tidak ada catatan penyemprotan pada tanggal {format(parseISO(bulkData.date), 'dd/MM/yyyy')}.<br/>
                        Silakan catat jadwal terlebih dahulu.
                      </div>
                    ) : (
                      availableRecordsForBulk.map(r => (
                        <label key={r.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                          <input 
                            type="checkbox" 
                            className="mt-1"
                            checked={bulkData.selectedRecordIds.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkData({...bulkData, selectedRecordIds: [...bulkData.selectedRecordIds, r.id]});
                              } else {
                                setBulkData({...bulkData, selectedRecordIds: bulkData.selectedRecordIds.filter(id => id !== r.id)});
                              }
                            }}
                          />
                          <div className="text-sm">
                            <div className="font-bold">{r.farmerName}</div>
                            <div className="text-xs text-gray-600">{r.village} / {r.groupName}</div>
                            <div className="text-xs text-blue-600">{r.type}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="text-sm text-green-800 font-medium mb-1">Total Biaya Harian Pekerja:</div>
                    <div className="text-xl font-bold text-green-700">
                      Rp {(bulkData.workerCount * bulkData.costPerWorker).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-800 font-medium mb-1">Biaya Dibebankan per Lahan:</div>
                    <div className="text-xl font-bold text-green-700">
                      Rp {(
                        bulkData.costMethod === 'split' && bulkData.selectedRecordIds.length > 0
                          ? (bulkData.workerCount * bulkData.costPerWorker) / bulkData.selectedRecordIds.length
                          : (bulkData.workerCount * bulkData.costPerWorker)
                      ).toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Untuk {bulkData.selectedRecordIds.length} lahan terpilih
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E9ECEF]">
                <button 
                  type="button" 
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-[#495057] bg-[#E9ECEF] hover:bg-[#DEE2E6] rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={bulkData.selectedRecordIds.length === 0}
                  className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Borongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
