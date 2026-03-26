import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Plus, Trash2, Edit2, Filter } from 'lucide-react';
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
    notes: ''
  });

  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
      
      if (filterStatus) {
        const hasFertilizer = p.ferts.length > 0;
        if (filterStatus === 'Belum Tersalurkan' && hasFertilizer) return false;
        if (filterStatus === 'Tersalurkan' && !hasFertilizer) return false;
      }
      
      return true;
    });
  }, [activePlantings, filterVillage, filterGroup, filterCompany, filterVariety, filterStatus]);

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
        createdAt: new Date().toISOString()
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
      notes: ''
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
      notes: ''
    });
  };

  const availableSeedDists = seedDistributions.filter(sd => sd.farmerId === newDist.farmerId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#212529]">Distribusi Pupuk</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau dan catat distribusi pupuk untuk setiap penanaman.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          Catat Distribusi Pupuk
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF] mb-6">
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
            <option value="Belum Tersalurkan">Belum Tersalurkan</option>
            <option value="Tersalurkan">Tersalurkan</option>
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
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Petani & Lokasi</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Benih & Tgl Tanam</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Status Pupuk</th>
                <th className="p-4 font-bold text-[#495057] border border-[#DEE2E6]">Riwayat Pupuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {filteredPlantings.map(p => (
                <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors align-top">
                  <td className="p-4 border border-[#DEE2E6]">
                    <div className="font-bold text-[#212529]">{p.farmerName}</div>
                    <div className="text-xs text-gray-500">{p.village} / {p.groupName}</div>
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
                            <div key={fd.id} className="bg-white border rounded-lg p-2 relative group shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-bold text-[#212529] text-sm">{fert?.name} <span className="text-[#2D6A4F]">({fd.amountKg} kg)</span></div>
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
                              
                              <div className="absolute top-1 right-1 flex gap-1 bg-white rounded shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(fd)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                                <button onClick={() => {
                                  if (confirm('Hapus catatan pupuk ini?')) {
                                    setFertilizerDistributions(fertilizerDistributions.filter(x => x.id !== fd.id));
                                  }
                                }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
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
              ))}
              {filteredPlantings.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6C757D] border border-[#DEE2E6]">Belum ada data penanaman yang sesuai filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">{editingId ? 'Edit Distribusi Pupuk' : 'Catat Distribusi Pupuk'}</h3>
              <button onClick={closeModal} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <form onSubmit={handleAddOrEdit} className="p-6 space-y-4">
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
    </div>
  );
}
