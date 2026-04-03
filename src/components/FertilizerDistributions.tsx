import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Plus, Trash2, Edit2, Filter, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  fertilizers: FertilizerMaster[];
  seedDistributions: SeedDistribution[];
  fertilizerDistributions: FertilizerDistribution[];
  setFertilizerDistributions: (d: FertilizerDistribution[]) => void;
}

export default function FertilizerDistributions({ farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions, setFertilizerDistributions }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDist, setNewDist] = useState<Partial<FertilizerDistribution>>({
    farmerId: '',
    seedDistributionId: '',
    fertilizerId: '',
    amountKg: 0,
    stage: 'Awal',
    status: 'Bantuan',
    notes: '',
    createdAt: new Date().toISOString()
  });

  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [activeTab, setActiveTab] = useState<'sudah' | 'belum'>('belum');
  const [printDateFilter, setPrintDateFilter] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activePlantings = useMemo(() => {
    return seedDistributions.map(dist => {
      const farmer = farmers.find(f => f.id === dist.farmerId);
      const seed = seeds.find(s => s.id === dist.seedId);
      const ferts = fertilizerDistributions.filter(fd => fd.seedDistributionId === dist.id);
      
      return {
        ...dist,
        farmerName: farmer?.name || 'Unknown',
        village: farmer?.village || 'Unknown',
        groupName: farmer?.groupName || 'Unknown',
        seedCompany: seed?.company || 'Unknown',
        seedVariety: seed?.variety || 'Unknown',
        seedName: seed ? `${seed.company} - ${seed.variety}` : 'Unknown',
        ferts
      };
    }).sort((a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime());
  }, [seedDistributions, farmers, seeds, fertilizerDistributions]);

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
      
      const hasFertilizer = p.ferts.length > 0;
      if (activeTab === 'belum' && hasFertilizer) return false;
      if (activeTab === 'sudah' && !hasFertilizer) return false;
      
      return true;
    });
  }, [activePlantings, filterVillage, filterGroup, filterCompany, filterVariety, activeTab]);

  const printData = useMemo(() => {
    if (!printDateFilter) return [];
    return fertilizerDistributions.filter(fd => fd.createdAt.startsWith(printDateFilter));
  }, [fertilizerDistributions, printDateFilter]);

  const totalFertilizerByDate = useMemo(() => {
    const totals: Record<string, number> = {};
    printData.forEach(fd => {
      const fert = fertilizers.find(f => f.id === fd.fertilizerId);
      if (fert) {
        totals[fert.name] = (totals[fert.name] || 0) + fd.amountKg;
      }
    });
    return totals;
  }, [printData, fertilizers]);

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDist.farmerId || !newDist.seedDistributionId || !newDist.fertilizerId || !newDist.amountKg) return;
    
    if (editingId) {
      setFertilizerDistributions(fertilizerDistributions.map(d => d.id === editingId ? { ...d, ...newDist } as FertilizerDistribution : d));
    } else {
      setFertilizerDistributions([...fertilizerDistributions, {
        id: crypto.randomUUID(),
        farmerId: newDist.farmerId!,
        seedDistributionId: newDist.seedDistributionId!,
        fertilizerId: newDist.fertilizerId!,
        amountKg: Number(newDist.amountKg),
        stage: newDist.stage as any,
        status: newDist.status as any,
        notes: newDist.notes || '',
        createdAt: newDist.createdAt || new Date().toISOString()
      }]);
    }
    closeModal();
  };

  const openEdit = (d: FertilizerDistribution) => {
    setEditingId(d.id);
    setNewDist(d);
    setShowModal(true);
  };

  const openAddForPlanting = (distId: string, farmerId: string) => {
    setEditingId(null);
    setNewDist({
      farmerId,
      seedDistributionId: distId,
      fertilizerId: '',
      amountKg: 0,
      stage: 'Awal',
      status: 'Bantuan',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewDist({
      farmerId: '',
      seedDistributionId: '',
      fertilizerId: '',
      amountKg: 0,
      stage: 'Awal',
      status: 'Bantuan',
      notes: '',
      createdAt: new Date().toISOString()
    });
  };

  const availableSeedDists = seedDistributions.filter(sd => sd.farmerId === newDist.farmerId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-[#212529]">Distribusi Pupuk</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau dan catat distribusi pupuk untuk setiap penanaman.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="date" 
            className="px-4 py-2 border rounded-lg"
            value={printDateFilter}
            onChange={e => setPrintDateFilter(e.target.value)}
            title="Pilih tanggal untuk cetak data distribusi"
          />
          <button 
            onClick={() => setShowPrintPreview(true)}
            disabled={!printDateFilter}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm ${printDateFilter ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <Printer size={20} />
            Cetak Harian
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm font-medium"
          >
            <Plus size={20} />
            Catat Distribusi Pupuk
          </button>
        </div>
      </div>

      {showPrintPreview ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] p-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={() => setShowPrintPreview(false)} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              Kembali
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
              Print Sekarang
            </button>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold uppercase">Laporan Distribusi Pupuk Harian</h2>
            <p className="text-gray-600">Tanggal: {format(parseISO(printDateFilter), 'dd MMMM yyyy')}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Total Pupuk Tersalurkan:</h3>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(totalFertilizerByDate).map(([name, total]) => (
                <div key={name} className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                  <span className="font-bold text-green-800">{name}:</span> {total} kg
                </div>
              ))}
              {Object.keys(totalFertilizerByDate).length === 0 && (
                <div className="text-gray-500 italic">Belum ada pupuk yang tersalurkan pada tanggal ini.</div>
              )}
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2">No</th>
                <th className="border border-black p-2">Petani</th>
                <th className="border border-black p-2">Luas Lahan (ru)</th>
                <th className="border border-black p-2">Jenis Jagung</th>
                <th className="border border-black p-2">Pupuk Diterima</th>
                <th className="border border-black p-2">Tahap</th>
              </tr>
            </thead>
            <tbody>
              {printData.map((fd, index) => {
                const dist = seedDistributions.find(d => d.id === fd.seedDistributionId);
                const farmer = farmers.find(f => f.id === fd.farmerId);
                const seed = seeds.find(s => s.id === dist?.seedId);
                const fert = fertilizers.find(f => f.id === fd.fertilizerId);
                return (
                  <tr key={fd.id}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2">{farmer?.name}</td>
                    <td className="border border-black p-2">{farmer?.landAreaRu}</td>
                    <td className="border border-black p-2">{seed?.company} - {seed?.variety}</td>
                    <td className="border border-black p-2 font-bold">{fert?.name} ({fd.amountKg} kg)</td>
                    <td className="border border-black p-2">{fd.stage}</td>
                  </tr>
                );
              })}
              {printData.length === 0 && (
                <tr>
                  <td colSpan={6} className="border border-black p-4 text-center text-gray-500">Tidak ada data distribusi pada tanggal ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF] mb-6">
            <div className="flex items-center gap-2 mb-3 text-[#495057] font-bold">
              <Filter size={18} />
              <h3>Filter Data</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>
            {(filterVillage || filterGroup || filterCompany || filterVariety) && (
              <button 
                onClick={() => { setFilterVillage(''); setFilterGroup(''); setFilterCompany(''); setFilterVariety(''); }}
                className="mt-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex gap-4 mb-4 border-b border-[#E9ECEF]">
            <button 
              onClick={() => setActiveTab('belum')}
              className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'belum' ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Belum Diberi Pupuk
            </button>
            <button 
              onClick={() => setActiveTab('sudah')}
              className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'sudah' ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sudah Diberi Pupuk
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Petani & Lokasi</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Luas Lahan (ru)</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Benih & Tgl Tanam</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Status Pupuk</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Riwayat Pupuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {filteredPlantings.map(p => {
                const farmer = farmers.find(f => f.id === p.farmerId);
                return (
                <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors align-top">
                  <td className="p-4 border border-[#DEE2E6]">
                    <div className="font-bold text-[#212529]">{p.farmerName}</div>
                    <div className="text-xs text-gray-500">{p.village} / {p.groupName}</div>
                  </td>
                  <td className="p-4 border border-[#DEE2E6]">
                    {farmer?.landAreaRu || '-'}
                  </td>
                  <td className="p-4 border border-[#DEE2E6]">
                    <div className="font-bold text-[#2D6A4F]">{p.seedName}</div>
                    <div className="text-xs text-gray-500">Tanam: {format(parseISO(p.plantingDate), 'dd MMM yyyy')}</div>
                  </td>
                  <td className="p-4 border border-[#DEE2E6]">
                    {p.ferts.length > 0 ? (
                      <span className="inline-flex items-center justify-center bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs">
                        Tersalurkan ({p.ferts.length}x)
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-xs">
                        Belum Tersalurkan
                      </span>
                    )}
                    <div className="mt-3">
                      <button 
                        onClick={() => openAddForPlanting(p.id, p.farmerId)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium w-full"
                      >
                        + Tambah Pupuk
                      </button>
                    </div>
                  </td>
                  <td className="p-4 border border-[#DEE2E6]">
                    {p.ferts.length > 0 ? (
                      <div className="space-y-2">
                        {p.ferts.map(fd => {
                          const fert = fertilizers.find(f => f.id === fd.fertilizerId);
                          return (
                            <div key={fd.id} className="bg-white border rounded-lg p-3 relative shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-bold text-[#212529] text-sm pr-16">{fert?.name} <span className="text-[#2D6A4F]">({fd.amountKg} kg)</span></div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  fd.status === 'Bantuan' ? 'bg-green-100 text-green-800' :
                                  fd.status === 'Pinjaman' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {fd.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">Tahap: {fd.stage}</div>
                              {fd.notes && <div className="text-xs text-gray-600 italic mt-1">"{fd.notes}"</div>}
                              
                              <div className="mt-3 flex justify-end gap-3 border-t border-[#E9ECEF] pt-2">
                                <button onClick={() => openEdit(fd)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Edit2 size={14} /> Edit</button>
                                <button onClick={() => setDeleteConfirmId(fd.id)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"><Trash2 size={14} /> Hapus</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-sm text-center py-4">Belum ada riwayat pupuk</div>
                    )}
                  </td>
                </tr>
              );
            })}
              {filteredPlantings.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6C757D] border border-[#DEE2E6]">Belum ada data penanaman yang sesuai filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">{editingId ? 'Edit Distribusi Pupuk' : 'Catat Distribusi Pupuk'}</h3>
              <button onClick={closeModal} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <form onSubmit={handleAddOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Distribusi</label>
                <input 
                  type="date" 
                  required 
                  className="w-full px-4 py-2 border rounded-lg" 
                  value={newDist.createdAt ? newDist.createdAt.split('T')[0] : ''} 
                  onChange={e => setNewDist({...newDist, createdAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : new Date().toISOString()})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Petani</label>
                <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.farmerId} onChange={e => setNewDist({...newDist, farmerId: e.target.value, seedDistributionId: ''})}>
                  <option value="">Pilih Petani...</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.landAreaRu} ru)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Terkait Penanaman Benih</label>
                <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.seedDistributionId} onChange={e => setNewDist({...newDist, seedDistributionId: e.target.value})} disabled={!newDist.farmerId}>
                  <option value="">Pilih Penanaman...</option>
                  {availableSeedDists.map(sd => {
                    const seed = seeds.find(s => s.id === sd.seedId);
                    return <option key={sd.id} value={sd.id}>{seed?.company} - {seed?.variety} ({sd.plantingPeriod})</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Jenis Pupuk</label>
                  <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.fertilizerId} onChange={e => setNewDist({...newDist, fertilizerId: e.target.value})}>
                    <option value="">Pilih Pupuk...</option>
                    {fertilizers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Jumlah (kg)</label>
                  <input type="number" step="0.1" required className="w-full px-4 py-2 border rounded-lg" value={newDist.amountKg || ''} onChange={e => setNewDist({...newDist, amountKg: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Tahap</label>
                  <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.stage} onChange={e => setNewDist({...newDist, stage: e.target.value as any})}>
                    <option value="Awal">Awal</option>
                    <option value="Babat Jantan/Slambur">Babat Jantan/Slambur</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Status</label>
                  <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.status} onChange={e => setNewDist({...newDist, status: e.target.value as any})}>
                    <option value="Bantuan">Bantuan</option>
                    <option value="Pinjaman">Pinjaman</option>
                    <option value="Mandiri">Mandiri</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Catatan Tambahan</label>
                <input type="text" placeholder="e.g. Support Syngenta TYC" className="w-full px-4 py-2 border rounded-lg" value={newDist.notes} onChange={e => setNewDist({...newDist, notes: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
                <button type="submit" className="px-6 py-2 bg-[#2D6A4F] text-white rounded-lg font-bold hover:bg-[#1B4332]">{editingId ? 'Update' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl p-6">
            <h3 className="text-xl font-bold text-[#212529] mb-2">Hapus Data</h3>
            <p className="text-[#495057] mb-6">Apakah Anda yakin ingin menghapus data distribusi pupuk ini?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
              <button onClick={() => {
                setFertilizerDistributions(fertilizerDistributions.filter(x => x.id !== deleteConfirmId));
                setDeleteConfirmId(null);
              }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
