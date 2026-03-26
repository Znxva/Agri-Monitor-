import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution } from '../types';
import { ClipboardCheck, X, CheckCircle } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  setSeedDistributions: (d: SeedDistribution[]) => void;
}

export default function BabatPanen({ farmers, seeds, seedDistributions, setSeedDistributions }: Props) {
  const [selectedDistId, setSelectedDistId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'babat' | 'panen'>('babat');
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const activePlantings = useMemo(() => {
    return seedDistributions.map(dist => {
      const farmer = farmers.find(f => f.id === dist.farmerId);
      const seed = seeds.find(s => s.id === dist.seedId);
      
      let estHarvest = '-';
      
      if (seed && dist.plantingDate && seed.harvestDays) {
        estHarvest = format(addDays(parseISO(dist.plantingDate), seed.harvestDays), 'dd MMM yyyy');
      }

      return {
        ...dist,
        farmerName: farmer?.name || 'Unknown',
        village: farmer?.village || 'Unknown',
        groupName: farmer?.groupName || 'Unknown',
        seedName: seed ? `${seed.company} - ${seed.variety}` : 'Unknown',
        estHarvest,
      };
    }).sort((a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime());
  }, [seedDistributions, farmers, seeds]);

  const openModal = (distId: string, type: 'babat' | 'panen') => {
    setSelectedDistId(distId);
    setModalType(type);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistId) return;

    if (modalType === 'babat') {
      setSeedDistributions(seedDistributions.map(d => 
        d.id === selectedDistId ? { ...d, babatSlamburDone: true, babatSlamburDate: formData.date } : d
      ));
    } else if (modalType === 'panen') {
      setSeedDistributions(seedDistributions.map(d => 
        d.id === selectedDistId ? { ...d, harvestDone: true, harvestDate: formData.date } : d
      ));
    }

    setShowModal(false);
  };

  const undoStatus = (distId: string, type: 'babat' | 'panen') => {
    if (confirm(`Batalkan status ${type === 'babat' ? 'Babat Slambur' : 'Panen'}?`)) {
      setSeedDistributions(seedDistributions.map(d => {
        if (d.id === distId) {
          if (type === 'babat') return { ...d, babatSlamburDone: false, babatSlamburDate: undefined };
          if (type === 'panen') return { ...d, harvestDone: false, harvestDate: undefined };
        }
        return d;
      }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <div className="p-6 border-b border-[#E9ECEF] bg-[#F8F9FA]">
          <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
            <ClipboardCheck className="text-emerald-600" size={24} />
            Pemantauan Babat Slambur & Panen
          </h3>
          <p className="text-sm text-gray-500 mt-1">Catat status penyelesaian babat jantan/slambur dan panen untuk setiap lahan.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E9ECEF] text-[#495057] text-sm uppercase tracking-wider">
                <th className="p-4 font-bold border-b">Petani & Lahan</th>
                <th className="p-4 font-bold border-b">Varietas & Tgl Tanam</th>
                <th className="p-4 font-bold border-b">Status Babat Slambur</th>
                <th className="p-4 font-bold border-b">Status Panen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {activePlantings.map(planting => (
                <tr key={planting.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#212529]">{planting.farmerName}</div>
                    <div className="text-xs text-gray-500">{planting.village} - {planting.groupName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-[#2D6A4F]">{planting.seedName}</div>
                    <div className="text-xs text-gray-500">Tanam: {format(parseISO(planting.plantingDate), 'dd MMM yyyy')}</div>
                  </td>
                  
                  {/* Babat Slambur */}
                  <td className="p-4">
                    {planting.babatSlamburDone ? (
                      <div className="text-sm border rounded-lg p-3 bg-emerald-50 border-emerald-200 flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-emerald-600" size={18} />
                          <div>
                            <div className="font-bold text-emerald-700">Selesai</div>
                            <div className="text-xs text-emerald-600">{planting.babatSlamburDate ? format(parseISO(planting.babatSlamburDate), 'dd MMM yyyy') : ''}</div>
                          </div>
                        </div>
                        <button onClick={() => undoStatus(planting.id, 'babat')} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <div>
                        <button onClick={() => openModal(planting.id, 'babat')} className="text-sm bg-white text-emerald-600 px-4 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 font-medium shadow-sm">Catat Selesai Babat</button>
                      </div>
                    )}
                  </td>

                  {/* Panen */}
                  <td className="p-4">
                    {planting.harvestDone ? (
                      <div className="text-sm border rounded-lg p-3 bg-amber-50 border-amber-200 flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-amber-600" size={18} />
                          <div>
                            <div className="font-bold text-amber-700">Selesai Panen</div>
                            <div className="text-xs text-amber-600">{planting.harvestDate ? format(parseISO(planting.harvestDate), 'dd MMM yyyy') : ''}</div>
                          </div>
                        </div>
                        <button onClick={() => undoStatus(planting.id, 'panen')} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-medium">Estimasi: {planting.estHarvest}</div>
                        <button onClick={() => openModal(planting.id, 'panen')} className="text-sm bg-white text-amber-600 px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-50 font-medium shadow-sm">Catat Panen</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {activePlantings.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data penanaman (distribusi benih).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="text-xl font-bold text-[#212529]">
                {modalType === 'babat' ? 'Catat Babat Slambur' : 'Catat Panen'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#6C757D] hover:text-[#212529]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#495057] mb-1">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  required 
                  className="w-full px-4 py-2 border rounded-lg" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg font-bold hover:bg-[#F8F9FA]">Batal</button>
                <button type="submit" className="px-6 py-2 bg-[#2D6A4F] text-white rounded-lg font-bold hover:bg-[#1B4332]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
