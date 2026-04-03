import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Printer, Filter, Eye, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  fertilizers: FertilizerMaster[];
  seedDistributions: SeedDistribution[];
  fertilizerDistributions: FertilizerDistribution[];
}

export default function Reports({ farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions }: Props) {
  const [reportType, setReportType] = useState<'seed' | 'fertilizer'>('seed');
  const [filterDate, setFilterDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const dates = Array.from(new Set(seedDistributions.map(d => d.plantingDate))).filter(Boolean).sort();
  const fertDates = Array.from(new Set(fertilizerDistributions.map(d => d.createdAt.split('T')[0]))).filter(Boolean).sort();
  const periods = Array.from(new Set(seedDistributions.map(d => d.plantingPeriod))).filter(Boolean);
  const companies = Array.from(new Set(seeds.map(s => s.company))).filter(Boolean);
  const varieties = Array.from(new Set(seeds.map(s => s.variety))).filter(Boolean);
  const villages = Array.from(new Set(farmers.map(f => f.village))).filter(Boolean);
  const groups = Array.from(new Set(farmers.map(f => f.groupName))).filter(Boolean);

  const filteredSeedDist = seedDistributions.filter(sd => {
    const farmer = farmers.find(f => f.id === sd.farmerId);
    const seed = seeds.find(s => s.id === sd.seedId);
    
    if (filterDate && sd.plantingDate !== filterDate) return false;
    if (filterPeriod && sd.plantingPeriod !== filterPeriod) return false;
    if (filterCompany && seed?.company !== filterCompany) return false;
    if (filterVariety && seed?.variety !== filterVariety) return false;
    if (filterVillage && farmer?.village !== filterVillage) return false;
    if (filterGroup && farmer?.groupName !== filterGroup) return false;
    
    return true;
  });

  const filteredFertDist = fertilizerDistributions.filter(fd => {
    const sd = seedDistributions.find(s => s.id === fd.seedDistributionId);
    const farmer = farmers.find(f => f.id === fd.farmerId);
    const seed = seeds.find(s => s.id === sd?.seedId);
    
    if (filterDate && !fd.createdAt.startsWith(filterDate)) return false;
    if (filterPeriod && sd?.plantingPeriod !== filterPeriod) return false;
    if (filterCompany && seed?.company !== filterCompany) return false;
    if (filterVariety && seed?.variety !== filterVariety) return false;
    if (filterVillage && farmer?.village !== filterVillage) return false;
    if (filterGroup && farmer?.groupName !== filterGroup) return false;
    
    return true;
  });

  // Group the filtered data by Village and Group
  const groupedData = useMemo<Record<string, SeedDistribution[]>>(() => {
    const grouped: Record<string, SeedDistribution[]> = {};
    filteredSeedDist.forEach(sd => {
      const farmer = farmers.find(f => f.id === sd.farmerId);
      const village = farmer?.village || 'Unknown Village';
      const group = farmer?.groupName || 'Unknown Group';
      const key = `${village} - ${group}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sd);
    });
    
    // Sort keys
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped: Record<string, SeedDistribution[]> = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
  }, [filteredSeedDist, farmers]);

  const groupedFertData = useMemo<Record<string, FertilizerDistribution[]>>(() => {
    const grouped: Record<string, FertilizerDistribution[]> = {};
    filteredFertDist.forEach(fd => {
      const farmer = farmers.find(f => f.id === fd.farmerId);
      const village = farmer?.village || 'Unknown Village';
      const group = farmer?.groupName || 'Unknown Group';
      const key = `${village} - ${group}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(fd);
    });
    
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped: Record<string, FertilizerDistribution[]> = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
  }, [filteredFertDist, farmers]);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {!showPrintPreview ? (
        <>
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-2xl font-bold text-[#212529]">Laporan Distribusi</h2>
            <button 
              onClick={() => setShowPrintPreview(true)}
              className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm"
            >
              <Eye size={20} />
              Preview Cetak
            </button>
          </div>

          <div className="flex gap-4 mb-6 border-b border-[#E9ECEF] print:hidden">
            <button 
              onClick={() => setReportType('seed')}
              className={`pb-2 px-4 font-bold transition-colors ${reportType === 'seed' ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Distribusi Benih
            </button>
            <button 
              onClick={() => setReportType('fertilizer')}
              className={`pb-2 px-4 font-bold transition-colors ${reportType === 'fertilizer' ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Distribusi Pupuk
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF] mb-6 print:hidden">
            <div className="flex items-center gap-2 mb-3 text-[#495057] font-bold">
              <Filter size={18} />
              <h3>Filter Laporan</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                <option value="">Semua Tanggal</option>
                {reportType === 'seed' ? dates.map(d => <option key={d} value={d}>{d}</option>) : fertDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
                <option value="">Semua Periode</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
                <option value="">Semua Jenis Benih</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterVariety} onChange={e => setFilterVariety(e.target.value)}>
                <option value="">Semua Varietas</option>
                {varieties.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterVillage} onChange={e => setFilterVillage(e.target.value)}>
                <option value="">Semua Desa</option>
                {villages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select className="px-3 py-2 border rounded-lg text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                <option value="">Semua Kelompok</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-[#E9ECEF]">
          <button 
            onClick={() => setShowPrintPreview(false)}
            className="text-[#495057] hover:text-[#212529] flex items-center gap-2 font-medium"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>
          <button 
            onClick={printReport}
            className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm font-bold"
          >
            <Printer size={20} />
            Cetak Sekarang
          </button>
        </div>
      )}

      <div className={`bg-white rounded-xl shadow-sm border border-[#E9ECEF] p-8 ${showPrintPreview ? 'print:shadow-none print:border-none print:p-0' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#212529] uppercase tracking-wider">
            {reportType === 'seed' ? 'Laporan Distribusi Benih' : 'Laporan Distribusi Pupuk'}
          </h1>
          <div className="text-[#6C757D] mt-2 text-sm flex flex-wrap justify-center gap-2">
            {filterDate && <span>Tanggal: {filterDate} |</span>}
            {filterPeriod && <span>Periode: {filterPeriod} |</span>}
            {filterCompany && <span>Benih: {filterCompany} |</span>}
            {filterVariety && <span>Varietas: {filterVariety} |</span>}
            {filterVillage && <span>Desa: {filterVillage} |</span>}
            {filterGroup && <span>Kelompok: {filterGroup}</span>}
            {!filterDate && !filterPeriod && !filterCompany && !filterVariety && !filterVillage && !filterGroup && <span>Semua Data</span>}
          </div>
        </div>

        <div className="overflow-x-auto space-y-8">
          {reportType === 'seed' ? (
            Object.entries(groupedData).map(([groupKey, distributions]) => (
              <div key={groupKey} className="page-break-inside-avoid">
                <h3 className="text-lg font-bold text-[#2D6A4F] mb-3 border-b-2 border-[#2D6A4F] pb-1 inline-block">{groupKey}</h3>
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tanggal Tanam</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Luas (ru)</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Jantan (kg)</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Betina (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(distributions as SeedDistribution[]).map(sd => {
                      const farmer = farmers.find(f => f.id === sd.farmerId);
                      const seed = seeds.find(s => s.id === sd.seedId);
                      
                      return (
                        <tr key={sd.id} className="border-b border-[#E9ECEF] page-break-inside-avoid">
                          <td className="p-3 border border-[#DEE2E6]">{format(parseISO(sd.plantingDate), 'dd MMM yyyy')}</td>
                          <td className="p-3 border border-[#DEE2E6] font-medium">{farmer?.name}</td>
                          <td className="p-3 border border-[#DEE2E6]">{farmer?.landAreaRu}</td>
                          <td className="p-3 border border-[#DEE2E6]">{seed?.company} - {seed?.variety}</td>
                          <td className="p-3 border border-[#DEE2E6] font-bold text-blue-600">{sd.maleSeedsKg}</td>
                          <td className="p-3 border border-[#DEE2E6] font-bold text-pink-600">{sd.femaleSeedsKg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            Object.entries(groupedFertData).map(([groupKey, distributions]) => (
              <div key={groupKey} className="page-break-inside-avoid">
                <h3 className="text-lg font-bold text-[#2D6A4F] mb-3 border-b-2 border-[#2D6A4F] pb-1 inline-block">{groupKey}</h3>
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6]">
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Tanggal Distribusi</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Luas Lahan (ru)</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Jenis Jagung</th>
                      <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Pupuk Diterima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(distributions as FertilizerDistribution[]).map(fd => {
                      const sd = seedDistributions.find(s => s.id === fd.seedDistributionId);
                      const farmer = farmers.find(f => f.id === fd.farmerId);
                      const seed = seeds.find(s => s.id === sd?.seedId);
                      const fert = fertilizers.find(f => f.id === fd.fertilizerId);
                      
                      return (
                        <tr key={fd.id} className="border-b border-[#E9ECEF] page-break-inside-avoid">
                          <td className="p-3 border border-[#DEE2E6]">{format(parseISO(fd.createdAt), 'dd MMM yyyy')}</td>
                          <td className="p-3 border border-[#DEE2E6] font-medium">{farmer?.name}</td>
                          <td className="p-3 border border-[#DEE2E6]">{farmer?.landAreaRu}</td>
                          <td className="p-3 border border-[#DEE2E6]">{seed?.company} - {seed?.variety}</td>
                          <td className="p-3 border border-[#DEE2E6] font-bold text-green-600">{fert?.name} ({fd.amountKg} kg)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
          
          {reportType === 'seed' && Object.keys(groupedData).length === 0 && (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
              Tidak ada data distribusi benih yang sesuai dengan filter.
            </div>
          )}
          {reportType === 'fertilizer' && Object.keys(groupedFertData).length === 0 && (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
              Tidak ada data distribusi pupuk yang sesuai dengan filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
