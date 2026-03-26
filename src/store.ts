import { useState, useEffect } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution, DetasselingRecord, VillageMaster, GroupMaster, SprayingRecord } from './types';

export function useStore() {
  const [villages, setVillages] = useState<VillageMaster[]>([]);
  const [groups, setGroups] = useState<GroupMaster[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [seeds, setSeeds] = useState<SeedMaster[]>([]);
  const [fertilizers, setFertilizers] = useState<FertilizerMaster[]>([]);
  const [seedDistributions, setSeedDistributions] = useState<SeedDistribution[]>([]);
  const [fertilizerDistributions, setFertilizerDistributions] = useState<FertilizerDistribution[]>([]);
  const [detasselingRecords, setDetasselingRecords] = useState<DetasselingRecord[]>([]);
  const [sprayingRecords, setSprayingRecords] = useState<SprayingRecord[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const load = (key: string, setter: any) => {
      const data = localStorage.getItem(key);
      if (data) setter(JSON.parse(data));
    };
    load('corn_villages', setVillages);
    load('corn_groups', setGroups);
    load('corn_farmers', setFarmers);
    load('corn_seeds', setSeeds);
    load('corn_fertilizers', setFertilizers);
    load('corn_seed_dist', setSeedDistributions);
    load('corn_fert_dist', setFertilizerDistributions);
    load('corn_detasseling', setDetasselingRecords);
    load('corn_spraying', setSprayingRecords);
    
    const auth = localStorage.getItem('corn_auth');
    if (auth === 'true') setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('corn_villages', JSON.stringify(villages));
    localStorage.setItem('corn_groups', JSON.stringify(groups));
    localStorage.setItem('corn_farmers', JSON.stringify(farmers));
    localStorage.setItem('corn_seeds', JSON.stringify(seeds));
    localStorage.setItem('corn_fertilizers', JSON.stringify(fertilizers));
    localStorage.setItem('corn_seed_dist', JSON.stringify(seedDistributions));
    localStorage.setItem('corn_fert_dist', JSON.stringify(fertilizerDistributions));
    localStorage.setItem('corn_detasseling', JSON.stringify(detasselingRecords));
    localStorage.setItem('corn_spraying', JSON.stringify(sprayingRecords));
    localStorage.setItem('corn_auth', isLoggedIn ? 'true' : 'false');
  }, [villages, groups, farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions, detasselingRecords, sprayingRecords, isLoggedIn]);

  return {
    villages, setVillages,
    groups, setGroups,
    farmers, setFarmers,
    seeds, setSeeds,
    fertilizers, setFertilizers,
    seedDistributions, setSeedDistributions,
    fertilizerDistributions, setFertilizerDistributions,
    detasselingRecords, setDetasselingRecords,
    sprayingRecords, setSprayingRecords,
    isLoggedIn, setIsLoggedIn
  };
}
