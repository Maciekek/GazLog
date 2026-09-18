import type { Fillup, Settings } from "./db.js";

export type FillupWithCalc = Omit<Fillup, "user_id"> & {
  is_baseline: boolean;
  lpg_cost: number;
  petrol_cost: number;
  saved: number;
  lpg_per_100: number;
};

export const isBaseline = (f: Pick<Fillup, "distance_km">) => f.distance_km === 0;

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

export type Maintenance = {
  /** Current position in km: latest odometer reading if any, otherwise total km logged. */
  positionKm: number;
  positionIsOdometer: boolean;
  filter: { enabled: boolean; lastKm: number | null; dueKm: number | null; leftKm: number | null; status: "ok" | "soon" | "due" | "unset" };
  inspection: { enabled: boolean; lastDate: string | null; dueDate: string | null; leftDays: number | null; status: "ok" | "soon" | "due" | "unset" };
};

const FILTER_SOON_KM = 1000;
const INSPECTION_SOON_DAYS = 30;

export function maintenance(all: FillupWithCalc[], s: Settings, totalKm: number, today = new Date()): Maintenance {
  const odometers = all.map((f) => f.odometer_km).filter((v): v is number => v !== null);
  const positionIsOdometer = odometers.length > 0;
  const positionKm = positionIsOdometer ? Math.max(...odometers) : totalKm;

  // Filter: if the user never set a "last change", assume the first known odometer / 0 km.
  const firstOdometer = positionIsOdometer ? Math.min(...odometers) : 0;
  const lastKm = s.filterLastKm ?? (positionIsOdometer || totalKm > 0 ? firstOdometer : null);
  const filterEnabled = s.filterIntervalKm > 0;
  let filter: Maintenance["filter"] = { enabled: filterEnabled, lastKm, dueKm: null, leftKm: null, status: "unset" };
  if (filterEnabled && lastKm !== null) {
    const dueKm = lastKm + s.filterIntervalKm;
    const leftKm = round(dueKm - positionKm);
    filter = { enabled: true, lastKm, dueKm, leftKm, status: leftKm <= 0 ? "due" : leftKm <= FILTER_SOON_KM ? "soon" : "ok" };
  }

  const inspectionEnabled = s.inspectionIntervalMonths > 0;
  let inspection: Maintenance["inspection"] = { enabled: inspectionEnabled, lastDate: s.inspectionLastDate, dueDate: null, leftDays: null, status: "unset" };
  if (inspectionEnabled && s.inspectionLastDate) {
    const due = new Date(s.inspectionLastDate + "T00:00:00Z");
    due.setUTCMonth(due.getUTCMonth() + s.inspectionIntervalMonths);
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const leftDays = Math.round((due.getTime() - todayUtc) / 86_400_000);
    inspection = {
      enabled: true,
      lastDate: s.inspectionLastDate,
      dueDate: due.toISOString().slice(0, 10),
      leftDays,
      status: leftDays <= 0 ? "due" : leftDays <= INSPECTION_SOON_DAYS ? "soon" : "ok",
    };
  }

  return { positionKm: round(positionKm), positionIsOdometer, filter, inspection };
}

export function summary(all: FillupWithCalc[], s: Settings) {
  // Distance-based stats (count, km, consumption) use real fill-ups only; money and liters include the
  // baseline tank, which was paid for but has no measurable interval behind it.
  const items = all.filter((f) => !f.is_baseline);
  const totals = all.reduce(
    (a, f) => {
      a.km += f.distance_km;
      a.liters += f.lpg_liters;
      a.lpgCost += f.lpg_cost;
      a.petrolCost += f.petrol_cost;
      a.saved += f.saved;
      if (!f.is_baseline) a.litersDriven += f.lpg_liters;
      return a;
    },
    { km: 0, liters: 0, litersDriven: 0, lpgCost: 0, petrolCost: 0, saved: 0 }
  );
  const avgLpgPer100 = totals.km > 0 ? (totals.litersDriven / totals.km) * 100 : 0;
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
    maintenance: maintenance(all, s, totals.km),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
