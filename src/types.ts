export interface Farmer {
  id: string;
  name: string;
  village: string;
  groupName: string;
  landAreaRu: number;
  createdAt: string;
}

export interface SeedMaster {
  id: string;
  company: string;
  variety: string;
}

export interface FertilizerMaster {
  id: string;
  name: string;
}

export interface SeedDistribution {
  id: string;
  farmerId: string;
  seedId: string;
  maleSeedsKg: number;
  femaleSeedsKg: number;
  plantingDate: string;
  plantingPeriod: string;
  createdAt: string;
}

export interface FertilizerDistribution {
  id: string;
  farmerId: string;
  seedDistributionId: string;
  fertilizerId: string;
  amountKg: number;
  stage: 'Awal' | 'Babat Jantan/Slambur' | 'Lainnya';
  status: 'Bantuan' | 'Pinjaman' | 'Mandiri';
  notes: string;
  createdAt: string;
}
