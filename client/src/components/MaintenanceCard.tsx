import type { Maintenance, Settings } from '../api'
import { num } from '../format'

type Props = { m: Maintenance; settings: Settings; onSave: (s: Settings) => Promise<void> }

const longDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
const today = () => new Date().toISOString().slice(0, 10)

/** Warnings for filter change and periodic inspection. Rendered only when something is due, soon due, or unset. */
export default function MaintenanceCard({ m, settings, onSave }: Props) {
  const items: { key: string; level: 'warn' | 'due' | 'info'; text: string; action?: { label: string; run: () => Promise<void> } }[] = []

  if (m.filter.enabled) {
    const markDone = { label: 'Wymieniłem filtry', run: () => onSave({ ...settings, filterLastKm: m.positionKm }) }
    if (m.filter.status === 'due') items.push({ key: 'f', level: 'due', text: `Filtry LPG do wymiany: przejechane ${num(-(m.filter.leftKm ?? 0), 0)} km po terminie (co ${num(settings.filterIntervalKm, 0)} km).`, action: markDone })
    else if (m.filter.status === 'soon') items.push({ key: 'f', level: 'warn', text: `Wymiana filtrów LPG za ok. ${num(m.filter.leftKm ?? 0, 0)} km.`, action: markDone })
  }

  if (m.inspection.enabled) {
    const markDone = { label: 'Przegląd zrobiony', run: () => onSave({ ...settings, inspectionLastDate: today() }) }
    if (m.inspection.status === 'unset') items.push({ key: 'i', level: 'info', text: 'Ustaw datę ostatniego przeglądu instalacji, żeby dostać przypomnienie.', action: { label: 'Przegląd był dzisiaj', run: markDone.run } })
    else if (m.inspection.status === 'due') items.push({ key: 'i', level: 'due', text: `Przegląd instalacji LPG po terminie od ${longDate(m.inspection.dueDate!)} (${num(-(m.inspection.leftDays ?? 0), 0)} dni).`, action: markDone })
    else if (m.inspection.status === 'soon') items.push({ key: 'i', level: 'warn', text: `Przegląd instalacji LPG za ${m.inspection.leftDays} dni (${longDate(m.inspection.dueDate!)}).`, action: markDone })
  }

  if (items.length === 0) return null
  return (
    <div className="maint">
      {items.map((it) => (
        <div key={it.key} className={`maint-item ${it.level}`} role={it.level === 'due' ? 'alert' : 'status'}>
          <span className="maint-icon" aria-hidden="true">{it.level === 'due' ? '⚠️' : it.level === 'warn' ? '🔧' : 'ℹ️'}</span>
          <span className="maint-text">{it.text}</span>
          {it.action && <button type="button" className="secondary small" onClick={it.action.run}>{it.action.label}</button>}
        </div>
      ))}
    </div>
  )
}
