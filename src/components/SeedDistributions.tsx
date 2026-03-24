import React, { useState } from 'react';
import { Farmer, SeedMaster, SeedDistribution } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  distributions: SeedDistribution[];
  setDistributions: (d: SeedDistribution[]) => void;
}

export default function SeedDistributions({ farmers, seeds, distributions, setDistributions }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDist, setNewDist] = useState<Partial<SeedDistribution>>({
    farmerId: '',
    seedId: '',
    maleSeedsKg: 0,
    femaleSeedsKg: 0,
    plantingDate: new Date().toISOString().split('T')[0],
    plantingPeriod: 'Musim Tanam 1'
  });

  const [filterPeriod, setFilterPeriod] = useState('');

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDist.farmerId || !newDist.seedId || !newDist.plantingDate || !newDist.plantingPeriod) return;
    
    if (editingId) {
      setDistributions(distributions.map(d => d.id === editingId ? { ...d, ...newDist } as SeedDistribution : d));
    } else {
      setDistributions([...distributions, {
        id: crypto.randomUUID(),
        farmerId: newDist.farmerId!,
        seedId: newDist.seedId!,
        maleSeedsKg: Number(newDist.maleSeedsKg),
        femaleSeedsKg: Number(newDist.femaleSeedsKg),
        plantingDate: newDist.plantingDate!,
        plantingPeriod: newDist.plantingPeriod!,
        createdAt: new Date().toISOString()
      }]);
    }
    closeModal();
  };

  const openEdit = (d: SeedDistribution) => {
    setEditingId(d.id);
    setNewDist(d);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewDist({
      farmerId: '',
      seedId: '',
      maleSeedsKg: 0,
      femaleSeedsKg: 0,
      plantingDate: new Date().toISOString().split('T')[0],
      plantingPeriod: 'Musim Tanam 1'
    });
  };

  const filteredDist = filterPeriod 
    ? distributions.filter(d => d.plantingPeriod === filterPeriod)
    : distributions;

  const periods = Array.from(new Set(distributions.map(d => d.plantingPeriod)));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#212529]">Distribusi Benih</h2>
        <div className="flex gap-4">
          <select 
            className="px-4 py-2 border rounded-lg"
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
          >
            <option value="">Semua Periode Tanam</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors"
          >
            <Plus size={20} />
            Catat Distribusi Benih
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
              <th className="p-4 font-bold text-[#495057]">Tanggal Tanam</th>
              <th className="p-4 font-bold text-[#495057]">Periode</th>
              <th className="p-4 font-bold text-[#495057]">Petani</th>
              <th className="p-4 font-bold text-[#495057]">Benih (Perusahaan - Varietas)</th>
              <th className="p-4 font-bold text-[#495057]">Jantan (kg)</th>
              <th className="p-4 font-bold text-[#495057]">Betina (kg)</th>
              <th className="p-4 font-bold text-[#495057] w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDist.map(d => {
              const farmer = farmers.find(f => f.id === d.farmerId);
              const seed = seeds.find(s => s.id === d.seedId);
              return (
                <tr key={d.id} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                  <td className="p-4">{d.plantingDate}</td>
                  <td className="p-4">{d.plantingPeriod}</td>
                  <td className="p-4 font-medium">{farmer?.name || 'Unknown'}</td>
                  <td className="p-4">{seed ? `${seed.company} - ${seed.variety}` : 'Unknown'}</td>
                  <td className="p-4">{d.maleSeedsKg}</td>
                  <td className="p-4">{d.femaleSeedsKg}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEdit(d)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => setDistributions(distributions.filter(x => x.id !== d.id))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredDist.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#6C757D]">Belum ada data distribusi benih.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">{editingId ? 'Edit Distribusi Benih' : 'Catat Distribusi Benih'}</h3>
              <button onClick={closeModal} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <form onSubmit={handleAddOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Petani</label>
                <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.farmerId} onChange={e => setNewDist({...newDist, farmerId: e.target.value})}>
                  <option value="">Pilih Petani...</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.landAreaRu} ru)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Benih</label>
                <select required className="w-full px-4 py-2 border rounded-lg" value={newDist.seedId} onChange={e => setNewDist({...newDist, seedId: e.target.value})}>
                  <option value="">Pilih Benih...</option>
                  {seeds.map(s => <option key={s.id} value={s.id}>{s.company} - {s.variety}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Tgl Tanam</label>
                  <input type="date" required className="w-full px-4 py-2 border rounded-lg" value={newDist.plantingDate} onChange={e => setNewDist({...newDist, plantingDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Periode Tanam</label>
                  <input type="text" required placeholder="e.g. Musim Tanam 1" className="w-full px-4 py-2 border rounded-lg" value={newDist.plantingPeriod} onChange={e => setNewDist({...newDist, plantingPeriod: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Benih Jantan (kg)</label>
                  <input type="number" step="0.1" required className="w-full px-4 py-2 border rounded-lg" value={newDist.maleSeedsKg || ''} onChange={e => setNewDist({...newDist, maleSeedsKg: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#495057] mb-1">Benih Betina (kg)</label>
                  <input type="number" step="0.1" required className="w-full px-4 py-2 border rounded-lg" value={newDist.femaleSeedsKg || ''} onChange={e => setNewDist({...newDist, femaleSeedsKg: Number(e.target.value)})} />
                </div>
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
