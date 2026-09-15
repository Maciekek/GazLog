import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { Fillup, FillupInput } from '../api'
import { num, pln, today } from '../format'
import { useTracker } from './Tracker'

type FormState = { date: string; distance_km: string; lpg_liters: string; lpg_price: string; petrol_price: string; note: string }

const emptyForm = (last?: Fillup): FormState => ({
  date: today(),
  distance_km: '',
  lpg_liters: '',
  lpg_price: last ? String(last.lpg_price) : '',
  petrol_price: last ? String(last.petrol_price) : '',
  note: '',
})

const fromFillup = (f: Fillup): FormState => ({
  date: f.date,
  distance_km: String(f.distance_km),
  lpg_liters: String(f.lpg_liters),
  lpg_price: String(f.lpg_price),
  petrol_price: String(f.petrol_price),
  note: f.note ?? '',
})

const toInput = (f: FormState): FillupInput | null => {
  const n = (s: string) => Number(s.replace(',', '.'))
  const out = {
    date: f.date,
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
  return <FillupForm key={editId ?? 'new'} editing={editing} lastFillup={items[0]} petrolConsumption={settings?.petrolConsumption}
    onSubmit={(input) => saveFillup(input, editId)} />
}

type Props = {
  editing: Fillup | null
  lastFillup: Fillup | undefined
  petrolConsumption: number | undefined
  onSubmit: (input: FillupInput) => Promise<void>
}

function FillupForm({ editing, lastFillup, petrolConsumption, onSubmit }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(() => (editing ? fromFillup(editing) : emptyForm(lastFillup)))
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
    if (!inp) return setError('Uzupełnij wszystkie pola liczbami > 0')
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
        {numberField('distance_km', 'Przejechane km', 'np. 420')}
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
        {error && <div className="error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
        <div className="actions">
          <button type="submit" disabled={busy}>{editing ? 'Zapisz' : 'Dodaj'}</button>
          <button type="button" className="secondary" onClick={() => navigate('/')}>Anuluj</button>
        </div>
      </form>
    </div>
  )
}
