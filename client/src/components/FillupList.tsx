import type { Fillup } from '../api'
import { num, pln } from '../format'

type Props = { items: Fillup[]; onEdit: (f: Fillup) => void; onDelete: (f: Fillup) => void }

export default function FillupList({ items, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Historia</h2>
      {items.length === 0 ? (
        <div className="empty">Brak wpisów. Zacznij od stanu licznika, klikając „Pierwsze tankowanie”.</div>
      ) : (
        <div className="list">
          {items.map((f) => (
            <FillupRow key={f.id} f={f} onEdit={() => onEdit(f)} onDelete={() => onDelete(f)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FillupRow({ f, onEdit, onDelete }: { f: Fillup; onEdit: () => void; onDelete: () => void }) {
  if (f.is_baseline) {
    return (
      <div className="row baseline">
        <div className="main">
          <span className="date">{f.date}</span>
          <span className="badge">start</span>
          <span>licznik {num(f.odometer_km ?? 0, 0)} km</span>
          {f.lpg_liters > 0 && <span>{num(f.lpg_liters)} l × {num(f.lpg_price, 2)} zł = {pln(f.lpg_cost)}</span>}
          {f.note && <span className="muted">„{f.note}”</span>}
        </div>
        <div className="btns">
          <button className="secondary small" onClick={onEdit}>Edytuj</button>
          <button className="danger small" onClick={onDelete}>Usuń</button>
        </div>
      </div>
    )
  }
  return (
    <div className="row">
      <div className="main">
        <span className="date">{f.date}</span>
        <span>{num(f.distance_km, 0)} km{f.odometer_km !== null && <span className="muted"> · licznik {num(f.odometer_km, 0)}</span>}</span>
        <span>{num(f.lpg_liters)} l × {num(f.lpg_price, 2)} zł = {pln(f.lpg_cost)}</span>
        <span className="muted">benzyna: {pln(f.petrol_cost)} @ {num(f.petrol_price, 2)} zł/l</span>
        <span className="muted">{num(f.lpg_per_100)} l/100km</span>
        <span className={'saved' + (f.saved < 0 ? ' neg' : '')}>{f.saved >= 0 ? '+' : ''}{pln(f.saved)}</span>
        {f.note && <span className="muted">„{f.note}”</span>}
      </div>
      <div className="btns">
        <button className="secondary small" onClick={onEdit}>Edytuj</button>
        <button className="danger small" onClick={onDelete}>Usuń</button>
      </div>
    </div>
  )
}
