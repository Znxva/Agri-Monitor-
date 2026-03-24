import React, { useMemo } from 'react';
import { Users, Package, Sprout, TrendingUp, Clock, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution } from '../types';

interface Props {
  farmers: Farmer[];
  seeds: SeedMaster[];
  fertilizers: FertilizerMaster[];
  seedDistributions: SeedDistribution[];
  fertilizerDistributions: FertilizerDistribution[];
}

export default function Dashboard({ farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions }: Props) {
  const totalArea = farmers.reduce((acc, f) => acc + f.landAreaRu, 0);
  const totalSeeds = seedDistributions.reduce((acc, d) => acc + d.maleSeedsKg + d.femaleSeedsKg, 0);
  const totalFertilizer = fertilizerDistributions.reduce((acc, d) => acc + d.amountKg, 0);

  const activities = [
    ...seedDistributions.map(d => ({ ...d, type: 'seed' as const, date: new Date(d.createdAt) })),
    ...fertilizerDistributions.map(d => ({ ...d, type: 'fert' as const, date: new Date(d.createdAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  // 1. Rekap Benih: Perusahaan -> Varietas -> Desa -> Jantan/Betina
  const seedSummary = useMemo(() => {
    const summary: Record<string, { male: number, female: number }> = {};
    seedDistributions.forEach(sd => {
      const seed = seeds.find(s => s.id === sd.seedId);
      const farmer = farmers.find(f => f.id === sd.farmerId);
      if (seed && farmer) {
        const key = `${seed.company}|${seed.variety}|${farmer.village}`;
        if (!summary[key]) summary[key] = { male: 0, female: 0 };
        summary[key].male += sd.maleSeedsKg;
        summary[key].female += sd.femaleSeedsKg;
      }
    });
    return Object.entries(summary).map(([key, val]) => {
      const [company, variety, village] = key.split('|');
      return { company, variety, village, ...val };
    }).sort((a, b) => a.company.localeCompare(b.company) || a.variety.localeCompare(b.variety) || a.village.localeCompare(b.village));
  }, [seedDistributions, seeds, farmers]);

  // 2. Rekap Pupuk: Jenis Pupuk -> Desa -> Total
  const fertSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    fertilizerDistributions.forEach(fd => {
      const fert = fertilizers.find(f => f.id === fd.fertilizerId);
      const farmer = farmers.find(f => f.id === fd.farmerId);
      if (fert && farmer) {
        const key = `${fert.name}|${farmer.village}`;
        if (!summary[key]) summary[key] = 0;
        summary[key] += fd.amountKg;
      }
    });
    return Object.entries(summary).map(([key, amount]) => {
      const [name, village] = key.split('|');
      return { name, village, amount };
    }).sort((a, b) => a.name.localeCompare(b.name) || a.village.localeCompare(b.village));
  }, [fertilizerDistributions, fertilizers, farmers]);

  // 3. Pantauan Petani: Desa -> Kelompok -> Petani -> Status
  const farmerMonitoring = useMemo(() => {
    return farmers.map(farmer => {
      const fSeeds = seedDistributions.filter(sd => sd.farmerId === farmer.id);
      const fFerts = fertilizerDistributions.filter(fd => fd.farmerId === farmer.id);
      
      let status = 'Belum Dapat Apa-apa';
      let statusColor = 'bg-red-100 text-red-800 border-red-200';
      let Icon = AlertCircle;

      if (fSeeds.length > 0 && fFerts.length > 0) {
        status = 'Lengkap (Benih & Pupuk)';
        statusColor = 'bg-green-100 text-green-800 border-green-200';
        Icon = CheckCircle2;
      } else if (fSeeds.length > 0) {
        status = 'Baru Dapat Benih';
        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        Icon = HelpCircle;
      } else if (fFerts.length > 0) {
        status = 'Hanya Dapat Pupuk';
        statusColor = 'bg-orange-100 text-orange-800 border-orange-200';
        Icon = HelpCircle;
      }

      return { farmer, seeds: fSeeds, ferts: fFerts, status, statusColor, Icon };
    }).sort((a, b) => a.farmer.village.localeCompare(b.farmer.village) || a.farmer.groupName.localeCompare(b.farmer.groupName) || a.farmer.name.localeCompare(b.farmer.name));
  }, [farmers, seedDistributions, fertilizerDistributions]);

  return (
    <div className="p-6 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users size={24} />} title="Total Petani" value={farmers.length.toString()} color="bg-blue-500" />
        <StatCard icon={<TrendingUp size={24} />} title="Total Lahan (ru)" value={totalArea.toString()} color="bg-emerald-500" />
        <StatCard icon={<Sprout size={24} />} title="Benih Didistribusikan" value={`${totalSeeds.toFixed(1)} kg`} color="bg-amber-500" />
        <StatCard icon={<Package size={24} />} title="Pupuk Didistribusikan" value={`${totalFertilizer.toFixed(1)} kg`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summaries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Seed Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2"><Sprout size={20} className="text-amber-600"/> Rekap Benih per Desa & Varietas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-white border-b border-[#E9ECEF]">
                    <th className="p-3 font-bold text-[#495057]">Perusahaan</th>
                    <th className="p-3 font-bold text-[#495057]">Varietas</th>
                    <th className="p-3 font-bold text-[#495057]">Desa</th>
                    <th className="p-3 font-bold text-[#495057] text-right">Jantan (kg)</th>
                    <th className="p-3 font-bold text-[#495057] text-right">Betina (kg)</th>
                    <th className="p-3 font-bold text-[#495057] text-right">Total (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {seedSummary.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                      <td className="p-3 font-medium">{row.company}</td>
                      <td className="p-3">{row.variety}</td>
                      <td className="p-3">{row.village}</td>
                      <td className="p-3 text-right">{row.male.toFixed(1)}</td>
                      <td className="p-3 text-right">{row.female.toFixed(1)}</td>
                      <td className="p-3 text-right font-bold text-[#2D6A4F]">{(row.male + row.female).toFixed(1)}</td>
                    </tr>
                  ))}
                  {seedSummary.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">Belum ada data distribusi benih.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fertilizer Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2"><Package size={20} className="text-purple-600"/> Rekap Pupuk per Desa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-white border-b border-[#E9ECEF]">
                    <th className="p-3 font-bold text-[#495057]">Jenis Pupuk</th>
                    <th className="p-3 font-bold text-[#495057]">Desa</th>
                    <th className="p-3 font-bold text-[#495057] text-right">Total Keluar (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {fertSummary.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#E9ECEF] hover:bg-[#F8F9FA]">
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3">{row.village}</td>
                      <td className="p-3 text-right font-bold text-[#2D6A4F]">{row.amount.toFixed(1)}</td>
                    </tr>
                  ))}
                  {fertSummary.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">Belum ada data distribusi pupuk.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Recent Activities */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
            <div className="p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <h3 className="text-lg font-bold text-[#212529]">Aktivitas Terbaru</h3>
            </div>
            <div className="p-0">
              {activities.length > 0 ? (
                <div className="divide-y divide-[#E9ECEF]">
                  {activities.map((act, idx) => {
                    const farmer = farmers.find(f => f.id === act.farmerId);
                    
                    if (act.type === 'seed') {
                      const seed = seeds.find(s => s.id === (act as SeedDistribution).seedId);
                      return (
                        <div key={idx} className="p-4 hover:bg-[#F8F9FA] flex items-start gap-4 transition-colors">
                          <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-1">
                            <Sprout size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-[#212529] text-sm">
                              Benih ke <span className="font-bold">{farmer?.name || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-[#6C757D]">
                              {seed?.company} - {seed?.variety} ({(act as SeedDistribution).maleSeedsKg + (act as SeedDistribution).femaleSeedsKg} kg)
                            </p>
                            <p className="text-[10px] text-[#ADB5BD] mt-1 flex items-center gap-1">
                              <Clock size={10} /> {act.date.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      const fert = fertilizers.find(f => f.id === (act as FertilizerDistribution).fertilizerId);
                      return (
                        <div key={idx} className="p-4 hover:bg-[#F8F9FA] flex items-start gap-4 transition-colors">
                          <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-[#212529] text-sm">
                              Pupuk ke <span className="font-bold">{farmer?.name || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-[#6C757D]">
                              {fert?.name} ({(act as FertilizerDistribution).amountKg} kg)
                            </p>
                            <p className="text-[10px] text-[#ADB5BD] mt-1 flex items-center gap-1">
                              <Clock size={10} /> {act.date.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <p className="text-[#6C757D] text-center py-8 text-sm">
                  Belum ada aktivitas distribusi.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Width: Farmer Monitoring */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E9ECEF] overflow-hidden">
        <div className="p-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
          <h3 className="text-lg font-bold text-[#212529] flex items-center gap-2"><Users size={20} className="text-blue-600"/> Pantauan Distribusi per Petani (Desa & Kelompok)</h3>
          <p className="text-xs text-[#6C757D] mt-1">Pantau siapa saja yang sudah mendapatkan benih dan pupuk, dan apa yang belum didapatkan.</p>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b-2 border-[#E9ECEF]">
                <th className="p-3 font-bold text-[#495057]">Desa</th>
                <th className="p-3 font-bold text-[#495057]">Kelompok</th>
                <th className="p-3 font-bold text-[#495057]">Nama Petani</th>
                <th className="p-3 font-bold text-[#495057]">Status Penerimaan</th>
                <th className="p-3 font-bold text-[#495057]">Rincian Benih</th>
                <th className="p-3 font-bold text-[#495057]">Rincian Pupuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {farmerMonitoring.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F8F9FA]">
                  <td className="p-3">{row.farmer.village}</td>
                  <td className="p-3">{row.farmer.groupName}</td>
                  <td className="p-3 font-medium">{row.farmer.name}</td>
                  <td className="p-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${row.statusColor}`}>
                      <row.Icon size={14} />
                      {row.status}
                    </div>
                  </td>
                  <td className="p-3">
                    {row.seeds.length > 0 ? (
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {row.seeds.map(sd => {
                          const seed = seeds.find(s => s.id === sd.seedId);
                          return (
                            <li key={sd.id}>
                              {seed?.company} - {seed?.variety} <span className="text-gray-500">({sd.maleSeedsKg}kg J, {sd.femaleSeedsKg}kg B)</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {row.ferts.length > 0 ? (
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {row.ferts.map(fd => {
                          const fert = fertilizers.find(f => f.id === fd.fertilizerId);
                          return (
                            <li key={fd.id}>
                              {fert?.name} <span className="text-gray-500">({fd.amountKg}kg, {fd.stage})</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {farmerMonitoring.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data petani.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E9ECEF] flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-[#6C757D] uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-[#212529]">{value}</p>
      </div>
    </div>
  );
}
