import React, { useState } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

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

  // Filter seed distributions based on selected farmer
  const availableSeedDists = seedDistributions.filter(sd => sd.farmerId === newDist.farmerId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#212529]">Distribusi Pupuk</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors"
        >
          <Plus size={20} />
          Catat Distribusi Pupuk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
              <th className="p-4 font-bold text-[#495057]">Petani</th>
              <th className="p-4 font-bold text-[#495057]">Benih (Terkait)</th>
              <th className="p-4 font-bold text-[#495057]">Pupuk</th>
              <th className="p-4 font-bold text-[#495057]">Jumlah (kg)</th>
              <th className="p-4 font-bold text-[#495057]">Tahap</th>
              <th className="p-4 font-bold text-[#495057]">Status</th>
              <th className="p-4 font-bold text-[#495057]">Catatan</th>
              <th className="p-4 font-bold text-[#495057] w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {fertilizerDistributions.map(d => {
              const farmer = farmers.find(f => f.id === d.farmerId);
              const fert = fertilizers.find(f => f.id === d.fertilizerId);
              const seedDist = seedDistributions.find(sd => sd.id === d.seedDistributionId);
              const seed = seedDist ? seeds.find(s => s.id === seedDist.seedId) : null;
              
              return (
                <tr key={d.id} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                  <td className="p-4 font-medium">{farmer?.name || 'Unknown'}</td>
                  <td className="p-4">{seed ? `${seed.company} - ${seed.variety}` : 'Unknown'}</td>
                  <td className="p-4">{fert?.name || 'Unknown'}</td>
                  <td className="p-4">{d.amountKg}</td>
                  <td className="p-4">{d.stage}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      d.status === 'Bantuan' ? 'bg-green-100 text-green-800' :
                      d.status === 'Pinjaman' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{d.notes}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEdit(d)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => setFertilizerDistributions(fertilizerDistributions.filter(x => x.id !== d.id))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {fertilizerDistributions.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#6C757D]">Belum ada data distribusi pupuk.</td>
              </tr>
            )}
          </tbody>
        </table>
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
