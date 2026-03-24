// 1 ru = 14.0625 m2
// 100 ru = 1406.25 m2 = 0.140625 ha
const RU_TO_HA = 0.0140625;

export function calculateSeeds(ru: number) {
  const ha = ru * RU_TO_HA;
  const totalSeed = ha * 25; // 25kg per ha
  return {
    male: Number((totalSeed * 0.2).toFixed(2)), // 1:4 ratio
    female: Number((totalSeed * 0.8).toFixed(2))
  };
}

export function calculateFertilizer(ru: number) {
  const ha = ru * RU_TO_HA;
  return {
    npk: Number((ha * 300).toFixed(2)),
    phonska: Number((ha * 200).toFixed(2)),
    urea: Number((ha * 200).toFixed(2))
  };
}

export function formatRu(ru: number) {
  return `${ru} ru`;
}

export function formatKg(kg: number) {
  return `${kg.toFixed(2)} kg`;
}
