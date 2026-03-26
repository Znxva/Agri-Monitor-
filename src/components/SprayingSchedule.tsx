import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution, SprayingRecord } from '../types';
import { Calendar, X, Edit2, Printer, Filter, Download, Droplets } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  sprayingRecords: SprayingRecord[];
  setSprayingRecords: (r: SprayingRecord[]) => void;
}

const SPRAYING_TYPES = [
  { id: 'Roundup', name: 'Roundup', age: 18 },
  { id: 'BON Jagung', name: 'BON Jagung', age: 30 },
  { id: 'Gramason', name: 'Gramason', age: 40 },
  { id: 'KNO3', name: 'KNO3', age: 65 }
];

export default function SprayingSchedule({ farmers, seeds, seedDistributions, sprayingRecords, setSprayingRecords }: Props) {
  const [selectedDistId, setSelectedDistId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sprayingType, setSprayingType] = useState<string>('Roundup');
  
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
    isValidated: false,
  });

  const activePlantings = useMemo(() => {
    return seedDistributions
      .filter(dist => dist.hasSprayingSchedule)
      .map(dist => {
        const farmer = farmers.find(f => f.id === dist.farmerId);
        const seed = seeds.find(s => s.id === dist.seedId);
        const records = sprayingRecords.filter(r => r.seedDistributionId === dist.id);
        
        const schedules = SPRAYING_TYPES.map(type => {
          const isActive = dist.sprayingTypes ? dist.sprayingTypes.includes(type.id) : true;
          let estDate = '-';
          let estDateRaw = '';
          if (isActive && dist.plantingDate) {
            const d = addDays(parseISO(dist.plantingDate), type.age);
            estDate = format(d, 'dd MMM yyyy');
            estDateRaw = d.toISOString();
          }
          const record = records.find(r => r.type === type.id);
          return { ...type, estDate, estDateRaw, record, isActive };
        });

        return {
          ...dist,
          farmerName: farmer?.name || 'Unknown',
          village: farmer?.village || 'Unknown',
          groupName: farmer?.groupName || 'Unknown',
          seedCompany: seed?.company || 'Unknown',
          seedVariety: seed?.variety || 'Unknown',
          seedName: seed ? `${seed.company} - ${seed.variety}` : 'Unknown',
          schedules,
          records
        };
      }).sort((a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime());
  }, [seedDistributions, farmers, seeds, sprayingRecords]);

  // Filter Options
  const villages = useMemo(() => Array.from(new Set(activePlantings.map(p => p.village))).filter(v => v !== 'Unknown').sort(), [activePlantings]) as string[];
  const groups = useMemo(() => Array.from(new Set(activePlantings.map(p => p.groupName))).filter(g => g !== 'Unknown').sort(), [activePlantings]) as string[];
  const companies = useMemo(() => Array.from(new Set(activePlantings.map(p => p.seedCompany))).filter(c => c !== 'Unknown').sort(), [activePlantings]) as string[];
  const varieties = useMemo(() => Array.from(new Set(activePlantings.map(p => p.seedVariety))).filter(v => v !== 'Unknown').sort(), [activePlantings]) as string[];

  const filteredPlantings = useMemo(() => {
    return activePlantings.filter(p => {
      if (filterVillage && p.village !== filterVillage) return false;
      if (filterGroup && p.groupName !== filterGroup) return false;
      if (filterCompany && p.seedCompany !== filterCompany) return false;
      if (filterVariety && p.seedVariety !== filterVariety) return false;
      
      if (filterStatus) {
        const hasAnyRecord = p.records.length > 0;
        const allActiveCompleted = p.schedules.filter(s => s.isActive).every(s => s.record);
        
        if (filterStatus === 'Belum Disemprot' && hasAnyRecord) return false;
        if (filterStatus === 'Sedang Berjalan' && (!hasAnyRecord || allActiveCompleted)) return false;
        if (filterStatus === 'Selesai' && !allActiveCompleted) return false;
      }
      
      return true;
    });
  }, [activePlantings, filterVillage, filterGroup, filterCompany, filterVariety, filterStatus]);

  const openModal = (distId: string, type: string) => {
    setSelectedDistId(distId);
    setEditingRecordId(null);
    setSprayingType(type);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      supervisor: '',
      isValidated: false,
    });
    setShowModal(true);
  };

  const editRecord = (record: SprayingRecord) => {
    setSelectedDistId(record.seedDistributionId);
    setEditingRecordId(record.id);
    setSprayingType(record.type);
    setFormData({
      date: record.date,
      supervisor: record.supervisor,
      isValidated: record.isValidated || false,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistId) return;

    if (editingRecordId) {
      setSprayingRecords(sprayingRecords.map(r => 
        r.id === editingRecordId 
          ? { ...r, date: formData.date, supervisor: formData.supervisor, isValidated: formData.isValidated }
          : r
      ));
    } else {
      const newRecord: SprayingRecord = {
        id: crypto.randomUUID(),
        seedDistributionId: selectedDistId,
        type: sprayingType,
        date: formData.date,
        supervisor: formData.supervisor,
        isValidated: formData.isValidated,
        workerCount: 0,
        workerNames: [],
        costPerWorker: 0,
        totalCost: 0,
        createdAt: new Date().toISOString()
      };
      setSprayingRecords([...sprayingRecords, newRecord]);
    }
    setShowModal(false);
  };

  const deleteRecord = (id: string) => {
    if (confirm('Hapus catatan penyemprotan ini?')) {
      setSprayingRecords(sprayingRecords.filter(r => r.id !== id));
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  return (
    <div className="w-full">
      {!showPrintPreview ? (
        <div className="p-6 space-y-6 print:hidden">
          <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#212529]">Jadwal Penyemprotan</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau jadwal dan catat pelaksanaan penyemprotan (Roundup, BON Jagung, Gramason, KNO3).</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm">
              <Printer size={20} /> Cetak
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF]">
          <div className="flex items-center gap-2 mb-3 text-[#495057] font-bold">
            <Filter size={18} />
            <h3>Filter Data</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select className="px-3 py-2 border rounded-lg text-sm" value={filterVillage} onChange={e => setFilterVillage(e.target.value)}>
              <option value="">Semua Desa</option>
              {villages.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
              <option value="">Semua Kelompok</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
              <option value="">Semua Perusahaan</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm" value={filterVariety} onChange={e => setFilterVariety(e.target.value)}>
              <option value="">Semua Varietas</option>
              {varieties.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="Belum Disemprot">Belum Disemprot</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
          {(filterVillage || filterGroup || filterCompany || filterVariety || filterStatus) && (
            <button 
              onClick={() => { setFilterVillage(''); setFilterGroup(''); setFilterCompany(''); setFilterVariety(''); setFilterStatus(''); }}
              className="mt-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                  <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                  <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Desa / Kelompok</th>
                  <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                  <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tgl Tanam</th>
                  {SPRAYING_TYPES.map(type => (
                    <th key={type.id} className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-center">{type.name} ({type.age} HST)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlantings.map(p => (
                  <tr key={p.id} className="border-b border-[#E9ECEF] hover:bg-gray-50">
                    <td className="p-3 border border-[#DEE2E6] font-medium">{p.farmerName}</td>
                    <td className="p-3 border border-[#DEE2E6]">{p.village} / {p.groupName}</td>
                    <td className="p-3 border border-[#DEE2E6]">{p.seedName}</td>
                    <td className="p-3 border border-[#DEE2E6]">{format(parseISO(p.plantingDate), 'dd MMM yyyy')}</td>
                    {p.schedules.map(schedule => (
                      <td key={schedule.id} className="p-3 border border-[#DEE2E6] text-center align-top">
                        {!schedule.isActive ? (
                          <div className="text-xs text-gray-400 italic py-2">Tidak Ada Support</div>
                        ) : (
                          <>
                            <div className="text-xs text-gray-500 mb-2">Est: {schedule.estDate}</div>
                            {schedule.record ? (
                              <div className={`border rounded-lg p-2 text-left relative group ${schedule.record.isValidated ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                <div className={`font-bold text-xs mb-1 ${schedule.record.isValidated ? 'text-green-700' : 'text-yellow-700'}`}>{format(parseISO(schedule.record.date), 'dd MMM yyyy')}</div>
                                <div className={`text-xs ${schedule.record.isValidated ? 'text-green-600' : 'text-yellow-600'}`}>{schedule.record.isValidated ? 'Tervalidasi' : 'Belum Validasi'}</div>
                                <div className="text-xs text-gray-600">Pengawas: {schedule.record.supervisor}</div>
                                <div className="absolute top-1 right-1 flex gap-1 bg-white rounded shadow-sm border">
                                  <button onClick={() => editRecord(schedule.record!)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                                  <button onClick={() => deleteRecord(schedule.record!.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => openModal(p.id, schedule.id)}
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors w-full"
                              >
                                + Catat
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredPlantings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#6C757D] border border-[#DEE2E6]">Belum ada data jadwal penyemprotan. Pastikan Anda telah mencentang 'Gunakan Jadwal Penyemprotan' pada data distribusi benih.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : (
        <div className="p-8 bg-white min-h-screen">
          <div className="mb-6 flex justify-between items-center print:hidden">
            <button onClick={() => setShowPrintPreview(false)} className="text-[#495057] hover:text-[#212529] flex items-center gap-2 font-medium">
              <X size={20} /> Tutup Preview
            </button>
            <button onClick={() => window.print()} className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm font-bold">
              <Printer size={20} /> Cetak Sekarang
            </button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#212529] uppercase tracking-wider">Jadwal Penyemprotan</h1>
            <div className="text-[#6C757D] mt-2 text-sm flex flex-wrap justify-center gap-2">
              {filterVillage && <span>Desa: {filterVillage} |</span>}
              {filterGroup && <span>Kelompok: {filterGroup} |</span>}
              {filterCompany && <span>Perusahaan: {filterCompany} |</span>}
              {filterVariety && <span>Varietas: {filterVariety}</span>}
              {!filterVillage && !filterGroup && !filterCompany && !filterVariety && <span>Semua Data</span>}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Desa / Kelompok</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tgl Tanam</th>
                {SPRAYING_TYPES.map(type => (
                  <th key={type.id} className="p-3 font-bold text-[#495057] border border-[#DEE2E6] text-center">{type.name} ({type.age} HST)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlantings.map(p => (
                <tr key={p.id} className="border-b border-[#E9ECEF]">
                  <td className="p-3 border border-[#DEE2E6] font-medium">{p.farmerName}</td>
                  <td className="p-3 border border-[#DEE2E6]">{p.village} / {p.groupName}</td>
                  <td className="p-3 border border-[#DEE2E6]">{p.seedName}</td>
                  <td className="p-3 border border-[#DEE2E6]">{format(parseISO(p.plantingDate), 'dd/MM/yyyy')}</td>
                  {p.schedules.map(schedule => (
                    <td key={schedule.id} className="p-3 border border-[#DEE2E6] text-center">
                      {!schedule.isActive ? (
                        <div className="text-gray-400 italic">-</div>
                      ) : schedule.record ? (
                        <div className="font-bold text-green-700">{format(parseISO(schedule.record.date), 'dd/MM/yyyy')}</div>
                      ) : (
                        <div className="text-gray-500">Est: {schedule.estDate}</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="font-bold text-lg text-[#212529]">
                {editingRecordId ? 'Edit' : 'Catat'} Penyemprotan {sprayingType}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Nama Pengawas</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masukkan nama pengawas"
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all"
                  value={formData.supervisor}
                  onChange={e => setFormData({...formData, supervisor: e.target.value})}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#2D6A4F] rounded focus:ring-[#2D6A4F]"
                    checked={formData.isValidated}
                    onChange={e => setFormData({...formData, isValidated: e.target.checked})}
                  />
                  <span className="text-sm font-bold text-[#495057]">Lokasi Valid / Sesuai</span>
                </label>
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
