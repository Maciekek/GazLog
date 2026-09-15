import type { Summary } from '../api'
import { num, pln } from '../format'

export default function SummaryCard({ s }: { s: Summary }) {
  const payback = s.installCost > 0
    ? s.paidOff
      ? `Instalacja (${pln(s.installCost)}) spłacona 🎉`
      : `Do spłaty instalacji: ${pln(s.remainingToPayOff)}${s.kmToPayOff ? ` (~${num(s.kmToPayOff, 0)} km)` : ''}`
    : 'Ustaw koszt instalacji, żeby śledzić zwrot'

  return (
    <div className="card">
      <div className="stats">
        <div className="stat big">
          <div className="label">Zaoszczędzono łącznie</div>
          <div className="value">{pln(s.saved)}</div>
          <div className="sub">{payback}</div>
        </div>
        <Stat label="Przejechane" value={`${num(s.km, 0)} km`} />
        <Stat label="Tankowań" value={String(s.count)} />
        <Stat label="Wydano na LPG" value={pln(s.lpgCost)} />
        <Stat label="Kosztowałoby na benzynie" value={pln(s.petrolCost)} />
        <Stat label="Śr. spalanie LPG" value={`${num(s.avgLpgPer100)} l/100`} />
        <Stat label="Zatankowano" value={`${num(s.liters, 0)} l`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
