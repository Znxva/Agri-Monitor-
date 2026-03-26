import React, { useState, useMemo } from 'react';
import { Farmer, SeedMaster, SeedDistribution, SprayingRecord } from '../types';
import { ClipboardList, Printer, Filter, Download, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  seedDistributions: SeedDistribution[];
  sprayingRecords: SprayingRecord[];
}

export default function SprayingAttendance({ farmers, seeds, seedDistributions, sprayingRecords }: Props) {
  const [filterDate, setFilterDate] = useState('');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVariety, setFilterVariety] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [minBlankRows, setMinBlankRows] = useState(20);

  const recordsWithDetails = useMemo(() => {
    return sprayingRecords.filter(record => {
      const dist = seedDistributions.find(d => d.id === record.seedDistributionId);
      return dist?.hasSprayingSchedule && dist.sprayingTypes?.includes(record.type);
    }).map(record => {
      const dist = seedDistributions.find(d => d.id === record.seedDistributionId);
      const farmer = farmers.find(f => f.id === dist?.farmerId);
      const seed = seeds.find(s => s.id === dist?.seedId);

      return {
        ...record,
        farmerName: farmer?.name || 'Unknown',
        village: farmer?.village || 'Unknown',
        groupName: farmer?.groupName || 'Unknown',
        seedCompany: seed?.company || 'Unknown',
        seedVariety: seed?.variety || 'Unknown',
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sprayingRecords, seedDistributions, farmers, seeds]);

  // Filter Options
  const dates = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.date))) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [recordsWithDetails]);
  const supervisors = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.supervisor))) as string[]).filter(s => s).sort(), [recordsWithDetails]);
  const villages = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.village))) as string[]).filter(v => v !== 'Unknown').sort(), [recordsWithDetails]);
  const groups = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.groupName))) as string[]).filter(g => g !== 'Unknown').sort(), [recordsWithDetails]);
  const companies = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.seedCompany))) as string[]).filter(c => c !== 'Unknown').sort(), [recordsWithDetails]);
  const varieties = useMemo(() => (Array.from(new Set(recordsWithDetails.map(p => p.seedVariety))) as string[]).filter(v => v !== 'Unknown').sort(), [recordsWithDetails]);

  const filteredRecords = useMemo(() => {
    return recordsWithDetails.filter(p => {
      if (filterDate && p.date !== filterDate) return false;
      if (filterSupervisor && p.supervisor !== filterSupervisor) return false;
      if (filterVillage && p.village !== filterVillage) return false;
      if (filterGroup && p.groupName !== filterGroup) return false;
      if (filterCompany && p.seedCompany !== filterCompany) return false;
      if (filterVariety && p.seedVariety !== filterVariety) return false;
      return true;
    });
  }, [recordsWithDetails, filterDate, filterSupervisor, filterVillage, filterGroup, filterCompany, filterVariety]);

  const downloadCSV = () => {
    const headers = ['No', 'Tanggal', 'Pengawas', 'Nama Pekerja', 'Lahan Petani', 'Desa / Kelompok', 'Perusahaan / Varietas', 'Jenis Semprot'];
    
    const rows: string[][] = [];
    let no = 1;
    
    filteredRecords.forEach(r => {
      const workers = r.workerNames && r.workerNames.length > 0 
        ? r.workerNames 
        : Array(r.workerCount || 1).fill('');
        
      workers.forEach(worker => {
        rows.push([
          (no++).toString(),
          format(parseISO(r.date), 'dd/MM/yyyy'),
          r.supervisor,
          worker || '-',
          r.farmerName,
          `${r.village} / ${r.groupName}`,
          `${r.seedCompany} / ${r.seedVariety}`,
          r.type
        ]);
      });
    });

    const csvContent = '\ufeff' + [
      headers.join(';'),
      ...rows.map(e => e.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Absensi_Penyemprotan_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {!showPrintPreview ? (
        <div className="p-6 space-y-6 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-6 border-b border-[#E9ECEF] bg-[#F8F9FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2">
                  <ClipboardList className="text-blue-600" size={24} />
                  Absensi Pekerja Penyemprotan
                </h3>
                <p className="text-sm text-gray-500 mt-1">Kelola dan cetak daftar hadir pekerja berdasarkan jadwal penyemprotan.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowPrintPreview(true)}
                  className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1B4332] transition-colors font-medium text-sm shadow-sm flex-1 md:flex-none"
                >
                  <Printer size={18} />
                  Cetak Absensi
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="p-4 border-b border-[#E9ECEF] bg-white flex flex-wrap gap-4 items-end">
              <div className="flex items-center gap-2 text-gray-500 mb-1 w-full">
                <Filter size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">Filter Data</span>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                  <option value="">Semua Tanggal</option>
                  {dates.map(d => <option key={d} value={d}>{format(parseISO(d), 'dd MMM yyyy')}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Pengawas</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterSupervisor} onChange={e => setFilterSupervisor(e.target.value)}>
                  <option value="">Semua Pengawas</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Desa</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterVillage} onChange={e => setFilterVillage(e.target.value)}>
                  <option value="">Semua Desa</option>
                  {villages.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Kelompok Tani</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                  <option value="">Semua Kelompok</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Perusahaan Benih</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
                  <option value="">Semua Perusahaan</option>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Varietas</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={filterVariety} onChange={e => setFilterVariety(e.target.value)}>
                  <option value="">Semua Varietas</option>
                  {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {(filterDate || filterSupervisor || filterVillage || filterGroup || filterCompany || filterVariety) && (
                <button 
                  onClick={() => { setFilterDate(''); setFilterSupervisor(''); setFilterVillage(''); setFilterGroup(''); setFilterCompany(''); setFilterVariety(''); }}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E9ECEF] text-[#495057] text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold border-b">Tanggal & Jenis</th>
                    <th className="p-4 font-bold border-b">Pengawas</th>
                    <th className="p-4 font-bold border-b">Petani & Lokasi</th>
                    <th className="p-4 font-bold border-b">Varietas</th>
                    <th className="p-4 font-bold border-b text-center">Validasi</th>
                    <th className="p-4 font-bold border-b text-center">Jml Pekerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[#212529]">{format(parseISO(record.date), 'dd MMM yyyy')}</div>
                        <div className="text-sm text-gray-500">{record.type}</div>
                      </td>
                      <td className="p-4 font-medium text-[#212529]">{record.supervisor || '-'}</td>
                      <td className="p-4">
                        <div className="font-bold text-[#212529]">{record.farmerName}</div>
                        <div className="text-sm text-gray-500">{record.village} / {record.groupName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[#212529]">{record.seedVariety}</div>
                        <div className="text-sm text-gray-500">{record.seedCompany}</div>
                      </td>
                      <td className="p-4 text-center">
                        {record.isValidated ? (
                          <span className="inline-flex items-center justify-center bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs">
                            Sesuai
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-xs">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                          {record.workerCount || 0} Orang
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data absensi yang sesuai filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white">
          <div className="max-w-6xl mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
              <h2 className="text-xl font-bold text-[#212529]">Preview Cetak Absensi</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <label className="text-sm font-bold text-gray-700">Minimal Baris Kosong:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={minBlankRows} 
                    onChange={e => setMinBlankRows(Number(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-center text-sm font-bold"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors">
                    <X size={18}/> Tutup Preview
                  </button>
                  <button onClick={downloadCSV} className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg hover:bg-[#1B4332] font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Download size={18} /> Download CSV (Excel)
                  </button>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Printer size={18} /> Print Sekarang
                  </button>
                </div>
              </div>
            </div>

            {/* Printable Content */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-wider">Daftar Hadir Pekerja Penyemprotan</h1>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-3 text-sm font-medium">
                {filterDate && <span>Tanggal: {format(parseISO(filterDate), 'dd MMM yyyy')}</span>}
                {filterSupervisor && <span>Pengawas: {filterSupervisor}</span>}
                {filterVillage && <span>Desa: {filterVillage}</span>}
                {filterGroup && <span>Kelompok: {filterGroup}</span>}
                {filterCompany && <span>Perusahaan: {filterCompany}</span>}
                {filterVariety && <span>Varietas: {filterVariety}</span>}
              </div>
            </div>

            <div className="space-y-12">
              {filteredRecords.map((record) => {
                // Determine how many rows to show. At least minBlankRows, or more if workerCount is higher.
                const rowCount = Math.max(minBlankRows, record.workerCount || 0, record.workerNames?.length || 0);
                const workers = Array(rowCount).fill('');
                if (record.workerNames && record.workerNames.length > 0) {
                  record.workerNames.forEach((name, i) => {
                    if (i < rowCount) workers[i] = name;
                  });
                }

                return (
                  <div key={record.id} className="break-inside-avoid">
                    <div className="mb-3 p-4 border-2 border-black bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <table className="w-full">
                            <tbody>
                              <tr><td className="w-32 font-bold py-1">Nama Petani</td><td className="w-4">:</td><td className="font-bold">{record.farmerName}</td></tr>
                              <tr><td className="font-bold py-1">Desa / Kelompok</td><td>:</td><td>{record.village} / {record.groupName}</td></tr>
                              <tr><td className="font-bold py-1">Perusahaan / Varietas</td><td>:</td><td>{record.seedCompany} / {record.seedVariety}</td></tr>
                            </tbody>
                          </table>
                        </div>
                        <div>
                          <table className="w-full">
                            <tbody>
                              <tr><td className="w-32 font-bold py-1">Tanggal</td><td className="w-4">:</td><td className="font-bold">{format(parseISO(record.date), 'dd MMMM yyyy')}</td></tr>
                              <tr><td className="font-bold py-1">Jenis Semprot</td><td>:</td><td>Semprot {record.type}</td></tr>
                              <tr><td className="font-bold py-1">Nama Pengawas</td><td>:</td><td className="font-bold">{record.supervisor || '-'}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <table className="w-full border-collapse border border-black text-[13px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-2 text-center w-12">No</th>
                          <th className="border border-black p-2 text-left w-1/2">Nama Pekerja</th>
                          <th className="border border-black p-2 text-center w-1/2" colSpan={2}>Tanda Tangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((worker, wIndex) => (
                          <tr key={`${record.id}-${wIndex}`}>
                            <td className="border border-black p-2 text-center h-8">{wIndex + 1}</td>
                            <td className="border border-black p-2">{worker}</td>
                            <td className="border border-black p-2 w-1/4 relative">
                              {wIndex % 2 === 0 && <span className="absolute top-1 left-2 text-[10px] text-gray-500">{wIndex + 1}.</span>}
                            </td>
                            <td className="border border-black p-2 w-1/4 relative">
                              {wIndex % 2 !== 0 && <span className="absolute top-1 left-2 text-[10px] text-gray-500">{wIndex + 1}.</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              
              {filteredRecords.length === 0 && (
                <div className="text-center p-8 border border-gray-300 text-gray-500">
                  Belum ada data absensi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}