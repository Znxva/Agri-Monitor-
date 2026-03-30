import { useState, useEffect, useRef } from 'react';
import { Farmer, SeedMaster, FertilizerMaster, SeedDistribution, FertilizerDistribution, DetasselingRecord, VillageMaster, GroupMaster, SprayingRecord } from './types';
import { supabase } from './lib/supabase';

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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'error'>('connecting');
  
  const isInitialMount = useRef(true);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setSyncStatus('connecting');
        const { data, error } = await supabase.from('app_state').select('*');
        
        if (error) {
          console.error('Error loading from Supabase:', error);
          setSyncStatus('error');
          loadLocal();
          setIsLoaded(true);
          return;
        }

        if (data && data.length > 0) {
          isRemoteUpdate.current = true;
          data.forEach(row => {
            if (row.key === 'corn_villages') setVillages(row.value || []);
            if (row.key === 'corn_groups') setGroups(row.value || []);
            if (row.key === 'corn_farmers') setFarmers(row.value || []);
            if (row.key === 'corn_seeds') setSeeds(row.value || []);
            if (row.key === 'corn_fertilizers') setFertilizers(row.value || []);
            if (row.key === 'corn_seed_dist') setSeedDistributions(row.value || []);
            if (row.key === 'corn_fert_dist') setFertilizerDistributions(row.value || []);
            if (row.key === 'corn_detasseling') setDetasselingRecords(row.value || []);
            if (row.key === 'corn_spraying') setSprayingRecords(row.value || []);
          });
          setTimeout(() => { isRemoteUpdate.current = false; }, 500);
          setSyncStatus('synced');
        } else {
          loadLocal();
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('Failed to connect to Supabase:', err);
        setSyncStatus('error');
        loadLocal();
      }
      
      const auth = localStorage.getItem('corn_auth');
      if (auth === 'true') setIsLoggedIn(true);
      
      setIsLoaded(true);
    };

    const loadLocal = () => {
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
    };

    loadData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('app_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
        const row = payload.new as any;
        if (row && row.key) {
          isRemoteUpdate.current = true;
          if (row.key === 'corn_villages') setVillages(row.value || []);
          if (row.key === 'corn_groups') setGroups(row.value || []);
          if (row.key === 'corn_farmers') setFarmers(row.value || []);
          if (row.key === 'corn_seeds') setSeeds(row.value || []);
          if (row.key === 'corn_fertilizers') setFertilizers(row.value || []);
          if (row.key === 'corn_seed_dist') setSeedDistributions(row.value || []);
          if (row.key === 'corn_fert_dist') setFertilizerDistributions(row.value || []);
          if (row.key === 'corn_detasseling') setDetasselingRecords(row.value || []);
          if (row.key === 'corn_spraying') setSprayingRecords(row.value || []);
          setTimeout(() => { isRemoteUpdate.current = false; }, 500);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    // Save to localStorage as backup
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

    // Skip the first render sync or if the update came from Supabase real-time
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isRemoteUpdate.current) {
      return;
    }

    // Sync to Supabase
    const syncToSupabase = async () => {
      setSyncStatus('connecting');
      const updates = [
        { key: 'corn_villages', value: villages },
        { key: 'corn_groups', value: groups },
        { key: 'corn_farmers', value: farmers },
        { key: 'corn_seeds', value: seeds },
        { key: 'corn_fertilizers', value: fertilizers },
        { key: 'corn_seed_dist', value: seedDistributions },
        { key: 'corn_fert_dist', value: fertilizerDistributions },
        { key: 'corn_detasseling', value: detasselingRecords },
        { key: 'corn_spraying', value: sprayingRecords }
      ];

      try {
        const { error } = await supabase.from('app_state').upsert(updates, { onConflict: 'key' });
        if (error) {
          console.error('Supabase upsert error:', error);
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('Error syncing to Supabase:', err);
        setSyncStatus('error');
      }
    };

    // Debounce the sync slightly to avoid too many requests
    const timeoutId = setTimeout(() => {
      syncToSupabase();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [villages, groups, farmers, seeds, fertilizers, seedDistributions, fertilizerDistributions, detasselingRecords, sprayingRecords, isLoggedIn, isLoaded]);

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
    isLoggedIn, setIsLoggedIn,
    syncStatus
  };
}
