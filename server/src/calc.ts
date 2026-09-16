import type { Fillup, Settings } from "./db.js";

export type FillupWithCalc = Omit<Fillup, "user_id"> & {
  is_baseline: boolean;
  lpg_cost: number;
  petrol_cost: number;
  saved: number;
  lpg_per_100: number;
};

export const isBaseline = (f: Pick<Fillup, "distance_km" | "lpg_liters">) => f.distance_km === 0 && f.lpg_liters === 0;

export function enrich(f: Fillup, s: Settings): FillupWithCalc {
  const lpg_cost = f.lpg_liters * f.lpg_price;
  const petrol_cost = (f.distance_km / 100) * s.petrolConsumption * f.petrol_price;
  const { user_id: _uid, ...rest } = f;
  return {
    ...rest,
    is_baseline: isBaseline(f),
    lpg_cost: round(lpg_cost),
    petrol_cost: round(petrol_cost),
    saved: round(petrol_cost - lpg_cost),
    lpg_per_100: f.distance_km > 0 ? round((f.lpg_liters / f.distance_km) * 100) : 0,
  };
}

export function summary(all: FillupWithCalc[], s: Settings) {
  const items = all.filter((f) => !f.is_baseline);
  const totals = items.reduce(
    (a, f) => {
      a.km += f.distance_km;
      a.liters += f.lpg_liters;
      a.lpgCost += f.lpg_cost;
      a.petrolCost += f.petrol_cost;
      a.saved += f.saved;
      return a;
    },
    { km: 0, liters: 0, lpgCost: 0, petrolCost: 0, saved: 0 }
  );
  const avgLpgPer100 = totals.km > 0 ? (totals.liters / totals.km) * 100 : 0;
  const savedPerKm = totals.km > 0 ? totals.saved / totals.km : 0;
  const remaining = Math.max(0, s.installCost - totals.saved);
  return {
    count: items.length,
    km: round(totals.km),
    liters: round(totals.liters),
    lpgCost: round(totals.lpgCost),
    petrolCost: round(totals.petrolCost),
    saved: round(totals.saved),
    avgLpgPer100: round(avgLpgPer100),
    installCost: s.installCost,
    paidOff: s.installCost > 0 && totals.saved >= s.installCost,
    remainingToPayOff: round(remaining),
    kmToPayOff: savedPerKm > 0 ? Math.round(remaining / savedPerKm) : null,
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
