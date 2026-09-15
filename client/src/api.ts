export type Settings = { petrolConsumption: number; installCost: number };

export type FillupInput = {
  date: string;
  distance_km: number;
  lpg_liters: number;
  lpg_price: number;
  petrol_price: number;
  note?: string | null;
};

export type Fillup = FillupInput & {
  id: number;
  note: string | null;
  lpg_cost: number;
  petrol_cost: number;
  saved: number;
  lpg_per_100: number;
};

export type Summary = {
  count: number;
  km: number;
  liters: number;
  lpgCost: number;
  petrolCost: number;
  saved: number;
  avgLpgPer100: number;
  installCost: number;
  paidOff: boolean;
  remainingToPayOff: number;
  kmToPayOff: number | null;
};

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  if (r.status === 204) return undefined as T;
  return r.json();
}

export const api = {
  settings: () => req<Settings>('/api/settings'),
  saveSettings: (s: Settings) => req<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(s) }),
  fillups: () => req<{ items: Fillup[]; summary: Summary }>('/api/fillups'),
  addFillup: (f: FillupInput) => req<Fillup>('/api/fillups', { method: 'POST', body: JSON.stringify(f) }),
  updateFillup: (id: number, f: FillupInput) =>
    req<Fillup>(`/api/fillups/${id}`, { method: 'PUT', body: JSON.stringify(f) }),
  deleteFillup: (id: number) => req<void>(`/api/fillups/${id}`, { method: 'DELETE' }),
};
