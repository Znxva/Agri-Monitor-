import React, { useState } from 'react';
import { Farmer, VillageMaster, GroupMaster, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Plus, Trash2, Search, Edit2, Eye } from 'lucide-react';
import { differenceInDays, addDays, parseISO, format } from 'date-fns';

interface Props {
  farmers: Farmer[];
  setFarmers: (f: Farmer[]) => void;
  villages: VillageMaster[];
  groups: GroupMaster[];
  seeds: SeedMaster[];
  fertilizers: FertilizerMaster[];
  seedDistributions: SeedDistribution[];
  fertilizerDistributions: FertilizerDistribution[];
}

export default function Farmers({ farmers, setFarmers, villages, groups, seeds, fertilizers, seedDistributions, fertilizerDistributions }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
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

  const openDetail = (f: Farmer) => {
    setSelectedFarmer(f);
    setShowDetailModal(true);
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
                  <button onClick={() => openDetail(f)} className="text-green-600 p-2 hover:bg-green-50 rounded-lg" title="Lihat Detail">
                    <Eye size={18} />
                  </button>
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
      {showDetailModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">Detail Profil Petani</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-[#6C757D] hover:text-[#212529]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Nama Petani</p>
                  <p className="font-bold text-lg">{selectedFarmer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desa / Kelompok</p>
                  <p className="font-bold text-lg">{selectedFarmer.village} / {selectedFarmer.groupName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Luas Lahan</p>
                  <p className="font-bold text-lg">{selectedFarmer.landAreaRu} ru</p>
                </div>
              </div>

              <h4 className="font-bold text-lg mb-4 text-[#2D6A4F] border-b pb-2">Riwayat Penanaman & Pupuk</h4>
              
              <div className="space-y-6">
                {seedDistributions.filter(sd => sd.farmerId === selectedFarmer.id).map(sd => {
                  const seed = seeds.find(s => s.id === sd.seedId);
                  const ferts = fertilizerDistributions.filter(fd => fd.seedDistributionId === sd.id);
                  const plantAge = differenceInDays(new Date(), parseISO(sd.plantingDate));
                  const estimatedHarvest = addDays(parseISO(sd.plantingDate), seed?.estimatedHarvestDays || 0);
                  
                  return (
                    <div key={sd.id} className="bg-white border border-[#DEE2E6] rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-[#F8F9FA] p-4 border-b border-[#DEE2E6] grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Tanggal Tanam</p>
                          <p className="font-bold">{format(parseISO(sd.plantingDate), 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Jenis Benih</p>
                          <p className="font-bold">{seed?.company} - {seed?.variety}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Umur Tanaman</p>
                          <p className="font-bold text-blue-600">{plantAge} Hari</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Perkiraan Panen</p>
                          <p className="font-bold text-green-600">{format(estimatedHarvest, 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h5 className="font-bold text-sm mb-3 text-gray-700">Pupuk yang Diterima:</h5>
                        {ferts.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ferts.map(fd => {
                              const fert = fertilizers.find(f => f.id === fd.fertilizerId);
                              return (
                                <div key={fd.id} className="bg-green-50 border border-green-100 p-3 rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-green-800">{fert?.name}</p>
                                    <p className="text-xs text-green-600">Tahap: {fd.stage} | Status: {fd.status}</p>
                                  </div>
                                  <div className="font-bold text-lg text-green-700">{fd.amountKg} kg</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum ada pupuk yang disalurkan untuk penanaman ini.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {seedDistributions.filter(sd => sd.farmerId === selectedFarmer.id).length === 0 && (
                  <p className="text-center text-gray-500 italic py-8">Belum ada riwayat penanaman untuk petani ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
