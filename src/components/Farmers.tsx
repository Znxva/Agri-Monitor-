import React, { useState } from 'react';
import { Farmer, VillageMaster, GroupMaster } from '../types';
import { Plus, Trash2, Search, Edit2 } from 'lucide-react';

interface Props {
  farmers: Farmer[];
  setFarmers: (f: Farmer[]) => void;
  villages: VillageMaster[];
  groups: GroupMaster[];
}

export default function Farmers({ farmers, setFarmers, villages, groups }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFarmer, setNewFarmer] = useState<Partial<Farmer>>({
    name: '',
    village: '',
    groupName: '',
    landAreaRu: 0
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewFarmer({ name: '', village: '', groupName: '', landAreaRu: 0 });
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.name || !newFarmer.village || !newFarmer.groupName || !newFarmer.landAreaRu) return;
    
    if (editingId) {
      setFarmers(farmers.map(f => f.id === editingId ? { ...f, ...newFarmer } as Farmer : f));
    } else {
      setFarmers([...farmers, {
        id: crypto.randomUUID(),
        name: newFarmer.name!,
        village: newFarmer.village!,
        groupName: newFarmer.groupName!,
        landAreaRu: Number(newFarmer.landAreaRu),
        createdAt: new Date().toISOString()
      }]);
    }
    closeModal();
  };

  const openEdit = (f: Farmer) => {
    setEditingId(f.id);
    setNewFarmer(f);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setNewFarmer({ name: '', village: '', groupName: '', landAreaRu: 0 });
    setShowModal(true);
  };

  const filtered = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#212529]">Data Petani</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={18} />
            <input 
              type="text" 
              placeholder="Cari petani, desa..." 
              className="pl-10 pr-4 py-2 border border-[#E9ECEF] rounded-lg focus:ring-2 focus:ring-[#2D6A4F] outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={openAdd}
            className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors"
          >
            <Plus size={20} />
            Tambah Petani
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
              <th className="p-4 font-bold text-[#495057]">Nama Petani</th>
              <th className="p-4 font-bold text-[#495057]">Desa</th>
              <th className="p-4 font-bold text-[#495057]">Kelompok Tani</th>
              <th className="p-4 font-bold text-[#495057]">Luas Lahan (ru)</th>
              <th className="p-4 font-bold text-[#495057] w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                <td className="p-4 font-medium">{f.name}</td>
                <td className="p-4">{f.village}</td>
                <td className="p-4">{f.groupName}</td>
                <td className="p-4">{f.landAreaRu}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openEdit(f)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => setFarmers(farmers.filter(x => x.id !== f.id))} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#6C757D]">Belum ada data petani.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">{editingId ? 'Edit Petani' : 'Tambah Petani Baru'}</h3>
              <button onClick={closeModal} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <form onSubmit={handleAddOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Nama Petani</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-lg" value={newFarmer.name} onChange={e => setNewFarmer({...newFarmer, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Desa</label>
                {villages.length > 0 ? (
                  <select required className="w-full px-4 py-2 border rounded-lg" value={newFarmer.village} onChange={e => setNewFarmer({...newFarmer, village: e.target.value})}>
                    <option value="" disabled>Pilih Desa</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                ) : (
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg" placeholder="Masukkan nama desa" value={newFarmer.village} onChange={e => setNewFarmer({...newFarmer, village: e.target.value})} />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Kelompok Tani</label>
                {groups.length > 0 ? (
                  <select required className="w-full px-4 py-2 border rounded-lg" value={newFarmer.groupName} onChange={e => setNewFarmer({...newFarmer, groupName: e.target.value})}>
                    <option value="" disabled>Pilih Kelompok Tani</option>
                    {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                ) : (
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg" placeholder="Masukkan nama kelompok" value={newFarmer.groupName} onChange={e => setNewFarmer({...newFarmer, groupName: e.target.value})} />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Luas Lahan (ru)</label>
                <input type="number" required className="w-full px-4 py-2 border rounded-lg" value={newFarmer.landAreaRu || ''} onChange={e => setNewFarmer({...newFarmer, landAreaRu: Number(e.target.value)})} />
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
