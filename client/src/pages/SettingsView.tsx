import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api, type Settings } from '../api'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { useTracker } from './Tracker'

/** /settings. Renders once settings are loaded so inputs seed from server values. */
export default function SettingsView({ onLogout }: { onLogout: () => void }) {
  const { settings, saveSettings } = useTracker()
  if (!settings) return null
  return <SettingsForm settings={settings} onSave={saveSettings} onDeleteAccount={async () => { await api.deleteAccount(); onLogout() }} />
}

type Props = { settings: Settings; onSave: (s: Settings) => Promise<void>; onDeleteAccount: () => Promise<void> }

function SettingsForm({ settings, onSave, onDeleteAccount }: Props) {
  const navigate = useNavigate()
  const [pc, setPc] = useState(String(settings.petrolConsumption))
  const [ic, setIc] = useState(String(settings.installCost))
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave({ petrolConsumption: Number(pc.replace(',', '.')), installCost: Number(ic.replace(',', '.')) || 0 })
      navigate('/')
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
        <p>Usuwa konto, wszystkie tankowania i ustawienia. Nieodwracalne. Szczegóły w <a href="/privacy">polityce prywatności</a>.</p>
        <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>Usuń konto i wszystkie dane</button>
      </div>
      {confirmDelete && <ConfirmDeleteModal onConfirm={onDeleteAccount} onCancel={() => setConfirmDelete(false)} />}
    </div>
  )
}
