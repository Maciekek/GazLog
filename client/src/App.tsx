import { useEffect, useMemo, useState } from 'react'
import { api, fetchMe, logout, type Fillup, type FillupInput, type Me, type Settings, type Summary } from './api'
import Landing from './Landing'
import Privacy from './Privacy'
import Terms from './Terms'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import UserMenu from './UserMenu'
import Charts from './Charts'
import GuidesIndex from './guides/GuidesIndex'
import InstallCost from './guides/InstallCost'
import LpgVsPetrol from './guides/LpgVsPetrol'
import FuelConsumption from './guides/FuelConsumption'

const GUIDE_ROUTES: Record<string, () => React.ReactElement> = {
  'ile-kosztuje-instalacja-lpg-i-kiedy-sie-zwraca': InstallCost,
  'lpg-czy-benzyna-kalkulator': LpgVsPetrol,
  'jak-liczyc-spalanie-lpg': FuelConsumption,
}

const pln = (n: number) => n.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
const num = (n: number, d = 1) => n.toLocaleString('pl-PL', { maximumFractionDigits: d })
const today = () => new Date().toISOString().slice(0, 10)

type FormState = { date: string; distance_km: string; lpg_liters: string; lpg_price: string; petrol_price: string; note: string }

const emptyForm = (last?: Fillup): FormState => ({
  date: today(),
  distance_km: '',
  lpg_liters: '',
  lpg_price: last ? String(last.lpg_price) : '',
  petrol_price: last ? String(last.petrol_price) : '',
  note: '',
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

function Tracker({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [items, setItems] = useState<Fillup[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editId, setEditId] = useState<number | null>(null)
  const [view, setView] = useState<'home' | 'form' | 'settings'>('home')
  const goHome = () => { setView('home'); setEditId(null); setError(null); window.scrollTo({ top: 0 }) }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const [f, s] = await Promise.all([api.fillups(), api.settings()])
      setItems(f.items)
      setSummary(f.summary)
      setSettings(s)
      if (editId === null && !form.lpg_price && f.items[0]) setForm(emptyForm(f.items[0]))
    } catch (e) {
      setError(String(e))
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useMemo(() => {
    const inp = toInput(form)
    if (!inp || !settings) return null
    const lpg = inp.lpg_liters * inp.lpg_price
    const petrol = (inp.distance_km / 100) * settings.petrolConsumption * inp.petrol_price
    return { lpg, petrol, saved: petrol - lpg, per100: (inp.lpg_liters / inp.distance_km) * 100 }
  }, [form, settings])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const inp = toInput(form)
    if (!inp) return setError('Uzupełnij wszystkie pola liczbami > 0')
    setBusy(true); setError(null)
    try {
      if (editId === null) await api.addFillup(inp)
      else await api.updateFillup(editId, inp)
      const f = await api.fillups()
      setItems(f.items); setSummary(f.summary)
      setForm(emptyForm(f.items[0]))
      goHome()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (f: Fillup) => {
    setEditId(f.id)
    setForm({
      date: f.date, distance_km: String(f.distance_km), lpg_liters: String(f.lpg_liters),
      lpg_price: String(f.lpg_price), petrol_price: String(f.petrol_price), note: f.note ?? '',
    })
    setView('form')
    window.scrollTo({ top: 0 })
  }

  const startAdd = () => {
    setEditId(null)
    setForm(emptyForm(items[0]))
    setError(null)
    setView('form')
    window.scrollTo({ top: 0 })
  }

  const remove = async (f: Fillup) => {
    if (!confirm(`Usunąć tankowanie z ${f.date}?`)) return
    await api.deleteFillup(f.id)
    await load()
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }))

  return (
    <div className="app">
      <header>
        <h1 onClick={goHome} style={{ cursor: 'pointer' }}>⛽ GazLog</h1>
        <div className="user">
          {view !== 'home' && <button className="secondary small" onClick={goHome}>← Wróć</button>}
          <UserMenu me={me} onSettings={() => { setView('settings'); window.scrollTo({ top: 0 }) }} onLogout={onLogout} />
        </div>
      </header>

      {view === 'settings' && settings && (
        <SettingsCard settings={settings} onSave={async (s) => { setSettings(await api.saveSettings(s)); await load(); goHome() }} onDelete={async () => { await api.deleteAccount(); onLogout() }} />
      )}

      {view === 'home' && (
        <>
          {summary && <SummaryCard s={summary} />}
          <button className="fab" onClick={startAdd}>+ Nowe tankowanie</button>
          {settings && <Charts items={items} installCost={settings.installCost} />}
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Historia</h2>
            {items.length === 0 ? (
              <div className="empty">Brak tankowań. Kliknij „Nowe tankowanie”.</div>
            ) : (
              <div className="list">
                {items.map((f) => (
                  <div className="row" key={f.id}>
                    <div className="main">
                      <span className="date">{f.date}</span>
                      <span>{num(f.distance_km, 0)} km</span>
                      <span>{num(f.lpg_liters)} l × {num(f.lpg_price, 2)} zł = {pln(f.lpg_cost)}</span>
                      <span className="muted">benzyna: {pln(f.petrol_cost)} @ {num(f.petrol_price, 2)} zł/l</span>
                      <span className="muted">{num(f.lpg_per_100)} l/100km</span>
                      <span className={'saved' + (f.saved < 0 ? ' neg' : '')}>{f.saved >= 0 ? '+' : ''}{pln(f.saved)}</span>
                      {f.note && <span className="muted">„{f.note}”</span>}
                    </div>
                    <div className="btns">
                      <button className="secondary small" onClick={() => startEdit(f)}>Edytuj</button>
                      <button className="danger small" onClick={() => remove(f)}>Usuń</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'form' && (
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{editId === null ? 'Nowe tankowanie' : 'Edycja tankowania'}</h2>
        <form className="grid" onSubmit={submit}>
          <label>Data<input type="date" value={form.date} onChange={set('date')} required /></label>
          <label>Przejechane km<input type="number" inputMode="decimal" step="any" min="0" value={form.distance_km} onChange={set('distance_km')} placeholder="np. 420" required /></label>
          <label>Zatankowano LPG (l)<input type="number" inputMode="decimal" step="any" min="0" value={form.lpg_liters} onChange={set('lpg_liters')} placeholder="np. 38.5" required /></label>
          <label>Cena LPG (zł/l)<input type="number" inputMode="decimal" step="any" min="0" value={form.lpg_price} onChange={set('lpg_price')} placeholder="np. 3.19" required /></label>
          <label>Cena benzyny (zł/l)<input type="number" inputMode="decimal" step="any" min="0" value={form.petrol_price} onChange={set('petrol_price')} placeholder="np. 6.29" required /></label>
          <label>Notatka<input type="text" value={form.note} onChange={set('note')} placeholder="opcjonalnie" /></label>
          {preview && (
            <div className="preview">
              LPG: {pln(preview.lpg)} · benzyna kosztowałaby: {pln(preview.petrol)} · spalanie {num(preview.per100)} l/100km ·{' '}
              <strong>oszczędność {pln(preview.saved)}</strong>
            </div>
          )}
          {error && <div className="error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
          <div className="actions">
            <button type="submit" disabled={busy}>{editId === null ? 'Dodaj' : 'Zapisz'}</button>
            <button type="button" className="secondary" onClick={goHome}>Anuluj</button>
          </div>
        </form>
      </div>
      )}
      <div className="footer-links"><a href="/prywatnosc">Polityka prywatności</a> · <a href="/regulamin">Regulamin</a></div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<{ loading: boolean; me: Me | null; loginEnabled: boolean }>({ loading: true, me: null, loginEnabled: true })
  const error = new URLSearchParams(window.location.search).get('error')

  useEffect(() => {
    fetchMe().then((r) => setState({ loading: false, me: r.user, loginEnabled: r.loginEnabled }))
  }, [])

  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/prywatnosc') return <Privacy />
  if (path === '/regulamin') return <Terms />
  if (path === '/poradnik') return <GuidesIndex />
  if (path.startsWith('/poradnik/')) {
    const Guide = GUIDE_ROUTES[path.slice('/poradnik/'.length)]
    return Guide ? <Guide /> : <NotFound />
  }
  if (path !== '/') return <NotFound />
  if (state.loading) return null
  if (!state.me) return <Landing loginEnabled={state.loginEnabled} error={error} />
  return (
    <Tracker
      me={state.me}
      onLogout={async () => { await logout().catch(() => {}); setState((s) => ({ ...s, me: null })) }}
    />
  )
}

function NotFound() {
  return (
    <div className="landing guide">
      <nav className="landing-nav">
        <a className="brand" href="/">⛽ GazLog</a>
      </nav>
      <h1>Nie ma takiej strony</h1>
      <p className="lead">Może szukasz <a href="/poradnik">poradnika</a> albo <a href="/">aplikacji</a>?</p>
    </div>
  )
}

function SummaryCard({ s }: { s: Summary }) {
  return (
    <div className="card">
      <div className="stats">
        <div className="stat big">
          <div className="label">Zaoszczędzono łącznie</div>
          <div className="value">{pln(s.saved)}</div>
          <div className="sub">
            {s.installCost > 0
              ? s.paidOff
                ? `Instalacja (${pln(s.installCost)}) spłacona 🎉`
                : `Do spłaty instalacji: ${pln(s.remainingToPayOff)}${s.kmToPayOff ? ` (~${num(s.kmToPayOff, 0)} km)` : ''}`
              : 'Ustaw koszt instalacji, żeby śledzić zwrot'}
          </div>
        </div>
        <div className="stat"><div className="label">Przejechane</div><div className="value">{num(s.km, 0)} km</div></div>
        <div className="stat"><div className="label">Tankowań</div><div className="value">{s.count}</div></div>
        <div className="stat"><div className="label">Wydano na LPG</div><div className="value">{pln(s.lpgCost)}</div></div>
        <div className="stat"><div className="label">Kosztowałoby na benzynie</div><div className="value">{pln(s.petrolCost)}</div></div>
        <div className="stat"><div className="label">Śr. spalanie LPG</div><div className="value">{num(s.avgLpgPer100)} l/100</div></div>
        <div className="stat"><div className="label">Zatankowano</div><div className="value">{num(s.liters, 0)} l</div></div>
      </div>
    </div>
  )
}

function SettingsCard({ settings, onSave, onDelete }: { settings: Settings; onSave: (s: Settings) => Promise<void>; onDelete: () => Promise<void> }) {
  const [pc, setPc] = useState(String(settings.petrolConsumption))
  const [ic, setIc] = useState(String(settings.installCost))
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave({ petrolConsumption: Number(pc.replace(',', '.')), installCost: Number(ic.replace(',', '.')) || 0 })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Ustawienia</h2>
      <form className="grid" onSubmit={submit}>
        <label>Spalanie na benzynie (l/100 km)<input type="number" inputMode="decimal" step="any" min="0" value={pc} onChange={(e) => setPc(e.target.value)} required /></label>
        <label>Koszt instalacji LPG (zł)<input type="number" inputMode="decimal" step="any" min="0" value={ic} onChange={(e) => setIc(e.target.value)} /></label>
        <div className="preview">Spalanie benzyny służy do wyliczenia, ile kosztowałby ten sam dystans na benzynie.</div>
        <div className="actions"><button type="submit" disabled={busy}>Zapisz</button></div>
      </form>
      <div className="danger-zone">
        <p>Usuwa konto, wszystkie tankowania i ustawienia. Nieodwracalne. Szczegóły w <a href="/prywatnosc">polityce prywatności</a>.</p>
        <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>
          Usuń konto i wszystkie dane
        </button>
      </div>
      {confirmDelete && <ConfirmDeleteModal onConfirm={onDelete} onCancel={() => setConfirmDelete(false)} />}
    </div>
  )
}
