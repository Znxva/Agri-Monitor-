import React, { useState } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';
import { Printer, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  fertilizers: FertilizerMaster[];
  seedDistributions: SeedDistribution[];
  fertilizerDistributions: FertilizerDistribution[];
}

export default function Reports({ farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions }: Props) {
  const [filterDate, setFilterDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  const dates = Array.from(new Set(seedDistributions.map(d => d.plantingDate))).filter(Boolean).sort();
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

  const printReport = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text('Laporan Distribusi Benih & Pupuk', 14, 15);

    doc.setFontSize(10);
    const filters = [];
    if (filterDate) filters.push(`Tanggal: ${filterDate}`);
    if (filterPeriod) filters.push(`Periode: ${filterPeriod}`);
    if (filterCompany) filters.push(`Benih: ${filterCompany}`);
    if (filterVariety) filters.push(`Varietas: ${filterVariety}`);
    if (filterVillage) filters.push(`Desa: ${filterVillage}`);
    if (filterGroup) filters.push(`Kelompok: ${filterGroup}`);
    
    if (filters.length > 0) {
      doc.text(filters.join(' | '), 14, 22);
    } else {
      doc.text('Semua Data', 14, 22);
    }

    const tableData = filteredSeedDist.map(sd => {
      const farmer = farmers.find(f => f.id === sd.farmerId);
      const seed = seeds.find(s => s.id === sd.seedId);
      const ferts = fertilizerDistributions.filter(fd => fd.seedDistributionId === sd.id);
      
      const fertText = ferts.length > 0 
        ? ferts.map(f => {
            const fertMaster = fertilizers.find(fm => fm.id === f.fertilizerId);
            return `• ${fertMaster?.name}: ${f.amountKg}kg (${f.stage}) - ${f.status}${f.notes ? `\n  Catatan: ${f.notes}` : ''}`;
          }).join('\n')
        : '-';

      return [
        farmer?.name || '-',
        farmer?.village || '-',
        farmer?.groupName || '-',
        farmer?.landAreaRu?.toString() || '-',
        `${seed?.company || '-'} - ${seed?.variety || '-'}`,
        sd.maleSeedsKg.toString(),
        sd.femaleSeedsKg.toString(),
        fertText
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['Petani', 'Desa', 'Kelompok', 'Luas (ru)', 'Benih', 'Jantan (kg)', 'Betina (kg)', 'Pupuk Diterima & Catatan']],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        lineColor: [222, 226, 230],
        lineWidth: 0.1,
        textColor: [33, 37, 41]
      },
      headStyles: { 
        fillColor: [248, 249, 250],
        textColor: [73, 80, 87],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        7: { cellWidth: 80 }
      }
    });

    doc.save('Laporan_Distribusi.pdf');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-[#212529]">Laporan Distribusi</h2>
        <button 
          onClick={printReport}
          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#1B4332] transition-colors shadow-sm"
        >
          <Printer size={20} />
          Cetak Laporan (PDF)
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
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
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

      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] p-8 print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#212529] uppercase tracking-wider">Laporan Distribusi Benih & Pupuk</h1>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm print:text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b-2 border-[#DEE2E6] print:bg-transparent">
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Petani</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Desa</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Kelompok</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Luas (ru)</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Benih</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Jantan (kg)</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Betina (kg)</th>
                <th className="p-3 font-bold text-[#495057] border border-[#DEE2E6]">Pupuk Diterima & Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredSeedDist.map(sd => {
                const farmer = farmers.find(f => f.id === sd.farmerId);
                const seed = seeds.find(s => s.id === sd.seedId);
                const ferts = fertilizerDistributions.filter(fd => fd.seedDistributionId === sd.id);
                
                return (
                  <tr key={sd.id} className="border-b border-[#E9ECEF] page-break-inside-avoid">
                    <td className="p-3 border border-[#DEE2E6] font-medium">{farmer?.name}</td>
                    <td className="p-3 border border-[#DEE2E6]">{farmer?.village}</td>
                    <td className="p-3 border border-[#DEE2E6]">{farmer?.groupName}</td>
                    <td className="p-3 border border-[#DEE2E6] text-center">{farmer?.landAreaRu}</td>
                    <td className="p-3 border border-[#DEE2E6]">{seed?.company} - {seed?.variety}</td>
                    <td className="p-3 border border-[#DEE2E6] text-center">{sd.maleSeedsKg}</td>
                    <td className="p-3 border border-[#DEE2E6] text-center">{sd.femaleSeedsKg}</td>
                    <td className="p-3 border border-[#DEE2E6]">
                      {ferts.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {ferts.map(f => {
                            const fertMaster = fertilizers.find(fm => fm.id === f.fertilizerId);
                            return (
                              <li key={f.id} className="leading-tight">
                                <span>{fertMaster?.name}: {f.amountKg}kg ({f.stage}) - <span className="italic font-medium">{f.status}</span></span>
                                {f.notes && <span className="block text-[10px] text-gray-500 ml-4 mt-0.5">Catatan: {f.notes}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredSeedDist.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#6C757D] border border-[#DEE2E6]">Belum ada data distribusi yang sesuai dengan filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
