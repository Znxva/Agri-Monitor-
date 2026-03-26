export interface VillageMaster {
  id: string;
  name: string;
}

export interface GroupMaster {
  id: string;
  name: string;
}

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
  detasseling1Days?: number;
  maleSlashingDays?: number;
  harvestDays?: number;
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
  babatSlamburDone?: boolean;
  babatSlamburDate?: string;
  harvestDone?: boolean;
  harvestDate?: string;
  hasSprayingSchedule?: boolean;
  sprayingTypes?: string[];
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

export interface DetasselingRecord {
  id: string;
  seedDistributionId: string;
  phase: 1 | 2 | 3;
  date: string;
  supervisor: string;
  workerCount: number;
  workerNames?: string[];
  costPerWorker: number;
  totalCost: number;
  isClean: boolean;
  createdAt: string;
}

export interface SprayingRecord {
  id: string;
  seedDistributionId: string;
  type: string;
  date: string;
  supervisor: string;
  workerCount: number;
  workerNames?: string[];
  costPerWorker: number;
  totalCost: number;
  isValidated?: boolean;
  createdAt: string;
}
