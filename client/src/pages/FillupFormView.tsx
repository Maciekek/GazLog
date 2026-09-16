import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { Fillup, FillupInput } from '../api'
import { num, pln, today } from '../format'
import { useTracker } from './Tracker'

type FormState = { date: string; odometer_km: string; distance_km: string; lpg_liters: string; lpg_price: string; petrol_price: string; note: string }

const emptyForm = (last?: Fillup): FormState => ({
  date: today(),
  odometer_km: '',
  distance_km: '',
  lpg_liters: '',
  lpg_price: last ? String(last.lpg_price) : '',
  petrol_price: last ? String(last.petrol_price) : '',
  note: '',
})

const fromFillup = (f: Fillup): FormState => ({
  date: f.date,
  odometer_km: f.odometer_km === null ? '' : String(f.odometer_km),
  distance_km: String(f.distance_km),
  lpg_liters: String(f.lpg_liters),
  lpg_price: String(f.lpg_price),
  petrol_price: String(f.petrol_price),
  note: f.note ?? '',
})

const toInput = (f: FormState): FillupInput | null => {
  const n = (s: string) => Number(s.replace(',', '.'))
  const odo = f.odometer_km.trim() === '' ? null : n(f.odometer_km)
  if (odo !== null && !(Number.isFinite(odo) && odo >= 0)) return null
  const out = {
    date: f.date,
    odometer_km: odo,
    distance_km: n(f.distance_km),
    lpg_liters: n(f.lpg_liters),
    lpg_price: n(f.lpg_price),
    petrol_price: n(f.petrol_price),
    note: f.note.trim() || null,
  }
  const ok = [out.distance_km, out.lpg_liters, out.lpg_price, out.petrol_price].every((v) => Number.isFinite(v) && v > 0)
  return ok && f.date ? out : null
}

/** /new and /edit/:id. Waits for data before rendering so the form seeds from the right fill-up. */
export default function FillupFormView() {
  const { id } = useParams()
  const { items, settings, saveFillup, loaded } = useTracker()
  if (!loaded) return null
  const editId = id ? Number(id) : null
  const editing = editId !== null ? items.find((f) => f.id === editId) ?? null : null
  if (editId !== null && !editing) return <Navigate to="/" replace />
  // items are newest-first; "previous" = the entry just older than the one being edited (or the newest for a new entry)
  const olderThanEdited = editing ? items.slice(items.findIndex((f) => f.id === editing.id) + 1) : items
  const prevOdometer = olderThanEdited.find((f) => f.odometer_km !== null)?.odometer_km ?? null
  return <FillupForm key={editId ?? 'new'} editing={editing} lastFillup={items[0]} prevOdometer={prevOdometer}
    petrolConsumption={settings?.petrolConsumption} onSubmit={(input) => saveFillup(input, editId)} />
}

type Props = {
  editing: Fillup | null
  lastFillup: Fillup | undefined
  prevOdometer: number | null
  petrolConsumption: number | undefined
  onSubmit: (input: FillupInput) => Promise<void>
}

type Mode = 'distance' | 'odometer'
const MODE_KEY = 'gazlog.distanceMode'
const readMode = (fallback: Mode): Mode => {
  try { const v = localStorage.getItem(MODE_KEY); return v === 'distance' || v === 'odometer' ? v : fallback } catch { return fallback }
}
const saveMode = (m: Mode) => { try { localStorage.setItem(MODE_KEY, m) } catch { /* ignore */ } }

function FillupForm({ editing, lastFillup, prevOdometer, petrolConsumption, onSubmit }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(() => (editing ? fromFillup(editing) : emptyForm(lastFillup)))
  const [mode, setMode] = useState<Mode>(() => readMode(editing?.odometer_km != null || prevOdometer !== null ? 'odometer' : 'distance'))
  const switchMode = (m: Mode) => { setMode(m); saveMode(m) }
  // Odometer mode needs a previous reading to derive distance; the very first reading also asks for km.
  const needsDistanceToo = mode === 'odometer' && prevOdometer === null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const inp = toInput(form)
    if (!inp || petrolConsumption === undefined) return null
    const lpg = inp.lpg_liters * inp.lpg_price
    const petrol = (inp.distance_km / 100) * petrolConsumption * inp.petrol_price
    return { lpg, petrol, saved: petrol - lpg, per100: (inp.lpg_liters / inp.distance_km) * 100 }
  }, [form, petrolConsumption])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const inp = toInput(form)
    if (!inp) return setError(mode === 'odometer' && !form.distance_km ? 'Wpisz stan licznika większy niż poprzedni.' : 'Uzupełnij wszystkie pola liczbami > 0')
    setBusy(true)
    setError(null)
    try {
      await onSubmit(inp)
      navigate('/')
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }))

  const parse = (v: string) => Number(v.replace(',', '.'))
  const fmt = (n: number) => String(Math.round(n * 10) / 10)

  // Odometer and distance are linked through the previous odometer reading, whichever the user types last wins.
  const setOdometer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm((s) => {
      const odo = parse(v)
      const linked = prevOdometer !== null && v.trim() !== '' && Number.isFinite(odo) && odo > prevOdometer
      return { ...s, odometer_km: v, distance_km: linked ? fmt(odo - prevOdometer) : s.distance_km }
    })
  }
  const setDistance = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm((s) => {
      const d = parse(v)
      const linked = prevOdometer !== null && v.trim() !== '' && Number.isFinite(d) && d > 0
      return { ...s, distance_km: v, odometer_km: linked ? fmt(prevOdometer + d) : s.odometer_km }
    })
  }
  const odoNum = parse(form.odometer_km)
  const odoWarning = prevOdometer !== null && form.odometer_km.trim() !== '' && Number.isFinite(odoNum) && odoNum <= prevOdometer
    ? `Stan licznika nie może być mniejszy niż poprzedni (${num(prevOdometer, 0)} km).`
    : null

  const numberField = (k: keyof FormState, label: string, placeholder: string) => (
    <label>
      {label}
      <input type="number" inputMode="decimal" step="any" min="0" value={form[k]} onChange={set(k)} placeholder={placeholder} required />
    </label>
  )

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{editing ? 'Edycja tankowania' : 'Nowe tankowanie'}</h2>
      <form className="grid" onSubmit={submit}>
        <label>Data<input type="date" value={form.date} onChange={set('date')} required /></label>
        <div className="field-switch" role="group" aria-label="Sposób podania dystansu">
          <div className="seg">
            <button type="button" className={mode === 'distance' ? 'on' : ''} onClick={() => switchMode('distance')}>Przejechane km</button>
            <button type="button" className={mode === 'odometer' ? 'on' : ''} onClick={() => switchMode('odometer')}>Stan licznika</button>
          </div>
          {mode === 'distance' ? (
            <label>
              <span>Przejechane km</span>
              <input type="number" inputMode="decimal" step="any" min="0" value={form.distance_km} onChange={setDistance} placeholder="np. 420" required autoFocus />
              {prevOdometer !== null && form.distance_km && Number.isFinite(parse(form.distance_km)) && (
                <small className="hint">licznik: {num(prevOdometer + parse(form.distance_km), 0)} km</small>
              )}
            </label>
          ) : (
            <label>
              <span>Stan licznika (km){prevOdometer !== null && <small className="hint"> · poprzedni {num(prevOdometer, 0)}</small>}</span>
              <input type="number" inputMode="numeric" step="any" min="0" value={form.odometer_km} onChange={setOdometer} placeholder={prevOdometer !== null ? `np. ${num(prevOdometer + 400, 0).replace(/\s/g, '')}` : 'np. 120400'} required autoFocus />
              {prevOdometer !== null && form.distance_km && !odoWarning && <small className="hint">przejechane: {num(parse(form.distance_km), 0)} km</small>}
            </label>
          )}
          {needsDistanceToo && (
            <label>
              <span>Przejechane km <small className="hint">· pierwszy odczyt, brak poprzedniego stanu</small></span>
              <input type="number" inputMode="decimal" step="any" min="0" value={form.distance_km} onChange={set('distance_km')} placeholder="np. 420" required />
            </label>
          )}
        </div>
        {numberField('lpg_liters', 'Zatankowano LPG (l)', 'np. 38.5')}
        {numberField('lpg_price', 'Cena LPG (zł/l)', 'np. 3.19')}
        {numberField('petrol_price', 'Cena benzyny (zł/l)', 'np. 6.29')}
        <label>Notatka<input type="text" value={form.note} onChange={set('note')} placeholder="opcjonalnie" /></label>
        {preview && (
          <div className="preview">
            LPG: {pln(preview.lpg)} · benzyna kosztowałaby: {pln(preview.petrol)} · spalanie {num(preview.per100)} l/100km ·{' '}
            <strong>oszczędność {pln(preview.saved)}</strong>
          </div>
        )}
        {odoWarning && <div className="error" style={{ gridColumn: '1 / -1' }}>{odoWarning}</div>}
        {error && <div className="error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
        <div className="actions">
          <button type="submit" disabled={busy || !!odoWarning}>{editing ? 'Zapisz' : 'Dodaj'}</button>
          <button type="button" className="secondary" onClick={() => navigate('/')}>Anuluj</button>
        </div>
      </form>
    </div>
  )
}
