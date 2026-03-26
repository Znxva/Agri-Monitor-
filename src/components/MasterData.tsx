import React, { useState } from 'react';
import { SeedMaster, FertilizerMaster, VillageMaster, GroupMaster } from '../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

interface Props {
  seeds: SeedMaster[];
  setSeeds: (s: SeedMaster[]) => void;
  fertilizers: FertilizerMaster[];
  setFertilizers: (f: FertilizerMaster[]) => void;
  villages: VillageMaster[];
  setVillages: (v: VillageMaster[]) => void;
  groups: GroupMaster[];
  setGroups: (g: GroupMaster[]) => void;
}

export default function MasterData({ seeds, setSeeds, fertilizers, setFertilizers, villages, setVillages, groups, setGroups }: Props) {
  const [newSeed, setNewSeed] = useState<{company: string, variety: string, detasseling1Days?: number, maleSlashingDays?: number, harvestDays?: number}>({ company: '', variety: '', detasseling1Days: undefined, maleSlashingDays: undefined, harvestDays: undefined });
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);

  const [newFertilizer, setNewFertilizer] = useState({ name: '' });
  const [editingFertId, setEditingFertId] = useState<string | null>(null);

  const [newVillage, setNewVillage] = useState({ name: '' });
  const [editingVillageId, setEditingVillageId] = useState<string | null>(null);

  const [newGroup, setNewGroup] = useState({ name: '' });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const addOrUpdateSeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeed.company || !newSeed.variety) return;
    
    if (editingSeedId) {
      setSeeds(seeds.map(s => s.id === editingSeedId ? { ...s, ...newSeed } : s));
      setEditingSeedId(null);
    } else {
      setSeeds([...seeds, { id: crypto.randomUUID(), ...newSeed }]);
    }
    setNewSeed({ company: '', variety: '', detasseling1Days: undefined, maleSlashingDays: undefined, harvestDays: undefined });
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

  const addOrUpdateVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillage.name) return;
    
    if (editingVillageId) {
      setVillages(villages.map(v => v.id === editingVillageId ? { ...v, ...newVillage } : v));
      setEditingVillageId(null);
    } else {
      setVillages([...villages, { id: crypto.randomUUID(), ...newVillage }]);
    }
    setNewVillage({ name: '' });
  };

  const addOrUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) return;
    
    if (editingGroupId) {
      setGroups(groups.map(g => g.id === editingGroupId ? { ...g, ...newGroup } : g));
      setEditingGroupId(null);
    } else {
      setGroups([...groups, { id: crypto.randomUUID(), ...newGroup }]);
    }
    setNewGroup({ name: '' });
  };

  const editSeed = (s: SeedMaster) => {
    setEditingSeedId(s.id);
    setNewSeed({ company: s.company, variety: s.variety, detasseling1Days: s.detasseling1Days, maleSlashingDays: s.maleSlashingDays, harvestDays: s.harvestDays });
  };

  const editFertilizer = (f: FertilizerMaster) => {
    setEditingFertId(f.id);
    setNewFertilizer({ name: f.name });
  };

  const cancelSeedEdit = () => {
    setEditingSeedId(null);
    setNewSeed({ company: '', variety: '', detasseling1Days: undefined, maleSlashingDays: undefined, harvestDays: undefined });
  };

  const cancelFertEdit = () => {
    setEditingFertId(null);
    setNewFertilizer({ name: '' });
  };

  const cancelVillageEdit = () => {
    setEditingVillageId(null);
    setNewVillage({ name: '' });
  };

  const cancelGroupEdit = () => {
    setEditingGroupId(null);
    setNewGroup({ name: '' });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seeds Master */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF]">
          <h3 className="text-lg font-bold text-[#212529] mb-4">Data Master Benih</h3>
          <form onSubmit={addOrUpdateSeed} className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2">
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
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input 
                type="number" 
                placeholder="HST Detasseling 1" 
                className="w-full px-3 py-2 border rounded-lg"
                value={newSeed.detasseling1Days || ''}
                onChange={e => setNewSeed({...newSeed, detasseling1Days: e.target.value ? Number(e.target.value) : undefined})}
              />
              <input 
                type="number" 
                placeholder="HST Babat Jantan" 
                className="w-full px-3 py-2 border rounded-lg"
                value={newSeed.maleSlashingDays || ''}
                onChange={e => setNewSeed({...newSeed, maleSlashingDays: e.target.value ? Number(e.target.value) : undefined})}
              />
              <input 
                type="number" 
                placeholder="HST Panen" 
                className="w-full px-3 py-2 border rounded-lg"
                value={newSeed.harvestDays || ''}
                onChange={e => setNewSeed({...newSeed, harvestDays: e.target.value ? Number(e.target.value) : undefined})}
              />
              {editingSeedId ? (
                <div className="flex gap-1 justify-end">
                  <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg flex-1 flex justify-center items-center"><Edit2 size={20} /></button>
                  <button type="button" onClick={cancelSeedEdit} className="bg-gray-400 text-white p-2 rounded-lg flex-1 flex justify-center items-center"><X size={20} /></button>
                </div>
              ) : (
                <button type="submit" className="bg-[#2D6A4F] text-white p-2 rounded-lg w-full flex justify-center items-center">
                  <Plus size={20} />
                </button>
              )}
            </div>
          </form>
          <div className="space-y-2">
            {seeds.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg">
                <div>
                  <div className="font-bold">{s.company} - {s.variety}</div>
                  <div className="text-xs text-gray-500">
                    Detasseling 1: {s.detasseling1Days ? `${s.detasseling1Days} HST` : '-'} | Babat Jantan: {s.maleSlashingDays ? `${s.maleSlashingDays} HST` : '-'} | Panen: {s.harvestDays ? `${s.harvestDays} HST` : '-'}
                  </div>
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
        {/* Villages Master */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF]">
          <h3 className="text-lg font-bold text-[#212529] mb-4">Data Master Desa</h3>
          <form onSubmit={addOrUpdateVillage} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Nama Desa" 
              className="flex-1 px-3 py-2 border rounded-lg"
              value={newVillage.name}
              onChange={e => setNewVillage({name: e.target.value})}
            />
            {editingVillageId ? (
              <div className="flex gap-1">
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Edit2 size={20} /></button>
                <button type="button" onClick={cancelVillageEdit} className="bg-gray-400 text-white p-2 rounded-lg"><X size={20} /></button>
              </div>
            ) : (
              <button type="submit" className="bg-[#2D6A4F] text-white p-2 rounded-lg">
                <Plus size={20} />
              </button>
            )}
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {villages.map(v => (
              <div key={v.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg">
                <span className="font-bold">{v.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingVillageId(v.id); setNewVillage({ name: v.name }); }} className="text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => setVillages(villages.filter(x => x.id !== v.id))} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {villages.length === 0 && <p className="text-sm text-gray-500">Belum ada data desa.</p>}
          </div>
        </div>

        {/* Groups Master */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF]">
          <h3 className="text-lg font-bold text-[#212529] mb-4">Data Master Kelompok Tani</h3>
          <form onSubmit={addOrUpdateGroup} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Nama Kelompok Tani" 
              className="flex-1 px-3 py-2 border rounded-lg"
              value={newGroup.name}
              onChange={e => setNewGroup({name: e.target.value})}
            />
            {editingGroupId ? (
              <div className="flex gap-1">
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Edit2 size={20} /></button>
                <button type="button" onClick={cancelGroupEdit} className="bg-gray-400 text-white p-2 rounded-lg"><X size={20} /></button>
              </div>
            ) : (
              <button type="submit" className="bg-[#2D6A4F] text-white p-2 rounded-lg">
                <Plus size={20} />
              </button>
            )}
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.map(g => (
              <div key={g.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg">
                <span className="font-bold">{g.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingGroupId(g.id); setNewGroup({ name: g.name }); }} className="text-blue-500"><Edit2 size={16} /></button>
                  <button onClick={() => setGroups(groups.filter(x => x.id !== g.id))} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-sm text-gray-500">Belum ada data kelompok.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
