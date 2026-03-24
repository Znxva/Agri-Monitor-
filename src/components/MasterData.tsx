import React, { useState } from 'react';
import { SeedMaster, FertilizerMaster } from '../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

interface Props {
  seeds: SeedMaster[];
  setSeeds: (s: SeedMaster[]) => void;
  fertilizers: FertilizerMaster[];
  setFertilizers: (f: FertilizerMaster[]) => void;
}

export default function MasterData({ seeds, setSeeds, fertilizers, setFertilizers }: Props) {
  const [newSeed, setNewSeed] = useState({ company: '', variety: '' });
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);

  const [newFertilizer, setNewFertilizer] = useState({ name: '' });
  const [editingFertId, setEditingFertId] = useState<string | null>(null);

  const addOrUpdateSeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeed.company || !newSeed.variety) return;
    
    if (editingSeedId) {
      setSeeds(seeds.map(s => s.id === editingSeedId ? { ...s, ...newSeed } : s));
      setEditingSeedId(null);
    } else {
      setSeeds([...seeds, { id: crypto.randomUUID(), ...newSeed }]);
    }
    setNewSeed({ company: '', variety: '' });
  };

  const addOrUpdateFertilizer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFertilizer.name) return;
    
    if (editingFertId) {
      setFertilizers(fertilizers.map(f => f.id === editingFertId ? { ...f, ...newFertilizer } : f));
      setEditingFertId(null);
    } else {
      setFertilizers([...fertilizers, { id: crypto.randomUUID(), ...newFertilizer }]);
    }
    setNewFertilizer({ name: '' });
  };

  const editSeed = (s: SeedMaster) => {
    setEditingSeedId(s.id);
    setNewSeed({ company: s.company, variety: s.variety });
  };

  const editFertilizer = (f: FertilizerMaster) => {
    setEditingFertId(f.id);
    setNewFertilizer({ name: f.name });
  };

  const cancelSeedEdit = () => {
    setEditingSeedId(null);
    setNewSeed({ company: '', variety: '' });
  };

  const cancelFertEdit = () => {
    setEditingFertId(null);
    setNewFertilizer({ name: '' });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seeds Master */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF]">
          <h3 className="text-lg font-bold text-[#212529] mb-4">Data Master Benih</h3>
          <form onSubmit={addOrUpdateSeed} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Perusahaan (e.g. Syngenta)" 
              className="flex-1 px-3 py-2 border rounded-lg"
              value={newSeed.company}
              onChange={e => setNewSeed({...newSeed, company: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Varietas (e.g. TYC)" 
              className="flex-1 px-3 py-2 border rounded-lg"
              value={newSeed.variety}
              onChange={e => setNewSeed({...newSeed, variety: e.target.value})}
            />
            {editingSeedId ? (
              <div className="flex gap-1">
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Edit2 size={20} /></button>
                <button type="button" onClick={cancelSeedEdit} className="bg-gray-400 text-white p-2 rounded-lg"><X size={20} /></button>
              </div>
            ) : (
              <button type="submit" className="bg-[#2D6A4F] text-white p-2 rounded-lg">
                <Plus size={20} />
              </button>
            )}
          </form>
          <div className="space-y-2">
            {seeds.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg">
                <div>
                  <span className="font-bold">{s.company}</span> - {s.variety}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editSeed(s)} className="text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => setSeeds(seeds.filter(x => x.id !== s.id))} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {seeds.length === 0 && <p className="text-sm text-gray-500">Belum ada data benih.</p>}
          </div>
        </div>

        {/* Fertilizers Master */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF]">
          <h3 className="text-lg font-bold text-[#212529] mb-4">Data Master Pupuk</h3>
          <form onSubmit={addOrUpdateFertilizer} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Jenis Pupuk (e.g. NPK, ZA)" 
              className="flex-1 px-3 py-2 border rounded-lg"
              value={newFertilizer.name}
              onChange={e => setNewFertilizer({name: e.target.value})}
            />
            {editingFertId ? (
              <div className="flex gap-1">
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Edit2 size={20} /></button>
                <button type="button" onClick={cancelFertEdit} className="bg-gray-400 text-white p-2 rounded-lg"><X size={20} /></button>
              </div>
            ) : (
              <button type="submit" className="bg-[#2D6A4F] text-white p-2 rounded-lg">
                <Plus size={20} />
              </button>
            )}
          </form>
          <div className="space-y-2">
            {fertilizers.map(f => (
              <div key={f.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg">
                <span className="font-bold">{f.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => editFertilizer(f)} className="text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => setFertilizers(fertilizers.filter(x => x.id !== f.id))} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {fertilizers.length === 0 && <p className="text-sm text-gray-500">Belum ada data pupuk.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
