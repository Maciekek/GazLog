import { useEffect, useMemo, useRef, useState } from 'react'
import type { Fillup } from '../api'

const pln = (n: number) => n.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })
const num = (n: number, d = 1) => n.toLocaleString('pl-PL', { maximumFractionDigits: d })
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
const longDate = (iso: string) => new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 52 }
const IH = H - PAD.top - PAD.bottom

/** Measured pixel width of the chart container so the SVG renders 1:1 (no tiny scaled text on phones). */
function useWidth() {
  const ref = useRef<HTMLElement>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, W: w, IW: w - PAD.left - PAD.right }
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step - 1e-9) * step
  const out: number[] = []
  for (let v = 0; v <= top + step * 0.001; v += step) out.push(Math.round(v * 1000) / 1000)
  return out
}

/** Chronological (oldest → newest) fill-ups with running totals. */
function series(items: Fillup[]) {
  const asc = [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id))
  let cum = 0
  let cumKm = 0
  return asc.map((f, i) => {
    cum += f.saved
    cumKm += f.distance_km
    const win = asc.slice(Math.max(0, i - 2), i + 1).filter((x) => !x.is_baseline)
    const winKm = win.reduce((s, x) => s + x.distance_km, 0)
    const winL = win.reduce((s, x) => s + x.lpg_liters, 0)
    return { ...f, cumSaved: cum, cumKm, rolling: winKm > 0 ? (winL / winKm) * 100 : 0 }
  })
}

/** Illustrative fill-ups shown blurred behind the placeholder until the user has 2+ real ones. */
const MOCK_ITEMS: Fillup[] = [
  ['2026-03-02', 380, 40.1], ['2026-03-16', 402, 41.8], ['2026-03-30', 355, 38.9], ['2026-04-14', 410, 39.2],
  ['2026-04-29', 395, 36.4], ['2026-05-13', 420, 37.1], ['2026-06-01', 388, 35.2], ['2026-06-20', 445, 39.0],
].map(([date, km, l], i) => {
  const lpg_price = 3.15, petrol_price = 6.3
  const lpg_cost = (l as number) * lpg_price
  const petrol_cost = ((km as number) / 100) * 8 * petrol_price
  return {
    id: -(i + 1), date: date as string, distance_km: km as number, lpg_liters: l as number, lpg_price, petrol_price, odometer_km: null, note: null, is_baseline: false,
    lpg_cost, petrol_cost, saved: petrol_cost - lpg_cost, lpg_per_100: ((l as number) / (km as number)) * 100,
  }
})

export default function Charts({ items: allItems, installCost }: { items: Fillup[]; installCost: number }) {
  const items = useMemo(() => allItems.filter((f) => !f.is_baseline), [allItems])
  const enough = items.length >= 2
  // Savings accumulate over every entry (the baseline tank is a cost); consumption only over real intervals.
  const savingsData = useMemo(() => series(enough ? allItems : MOCK_ITEMS), [allItems, enough])
  const data = useMemo(() => series(enough ? items : MOCK_ITEMS), [items, enough])
  if (enough) {
    return (
      <div className="charts">
        <SavingsChart data={savingsData} installCost={installCost} />
        <ConsumptionChart data={data} />
      </div>
    )
  }
  const missing = 2 - items.length
  return (
    <div className="charts placeholder" aria-hidden="false">
      <div className="charts-mock" aria-hidden="true">
        <SavingsChart data={data} installCost={600} />
        <ConsumptionChart data={data} />
      </div>
      <div className="charts-overlay" role="status">
        <strong>Wykresy pojawią się po dodaniu co najmniej dwóch tankowań.</strong>
        <span>{items.length === 0 ? 'Dodaj pierwsze tankowanie, żeby zacząć.' : `Brakuje jeszcze ${missing === 1 ? 'jednego' : missing}.`}</span>
      </div>
    </div>
  )
}

type Point = ReturnType<typeof series>[number]

function useHover(n: number, IW: number) {
  const ref = useRef<SVGSVGElement>(null)
  const [idx, setIdx] = useState<number | null>(null)
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = ref.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const x = clientX - rect.left - PAD.left
    const i = Math.round((x / IW) * (n - 1))
    setIdx(Math.max(0, Math.min(n - 1, i)))
  }
  return { ref, idx, onMove, onLeave: () => setIdx(null) }
}

function SavingsChart({ data, installCost }: { data: Point[]; installCost: number }) {
  const { ref: box, W, IW } = useWidth()
  const { ref, idx, onMove, onLeave } = useHover(data.length, IW)
  const maxY = Math.max(...data.map((d) => d.cumSaved), installCost > 0 ? installCost : 0, 1)
  const ticks = niceTicks(maxY)
  const top = ticks[ticks.length - 1]
  const x = (i: number) => PAD.left + (i / (data.length - 1)) * IW
  const y = (v: number) => PAD.top + IH - (Math.max(0, v) / top) * IH
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.cumSaved).toFixed(1)}`).join(' ')
  const area = `${path} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const paidIdx = installCost > 0 ? data.findIndex((d) => d.cumSaved >= installCost) : -1
  const last = data[data.length - 1]
  const h = idx !== null ? data[idx] : null

  return (
    <figure className="chart card" ref={box as React.RefObject<HTMLElement>}>
      <figcaption>
        <span className="chart-title">Skumulowana oszczędność</span>
        <span className="chart-sub">{pln(last.cumSaved)} po {num(last.cumKm, 0)} km{installCost > 0 ? ` · instalacja ${pln(installCost)}` : ''}</span>
      </figcaption>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Wykres skumulowanej oszczędności w czasie"
        onMouseMove={onMove} onMouseLeave={onLeave} onTouchStart={onMove} onTouchMove={onMove} onTouchEnd={onLeave}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={PAD.left - 8} y={y(t)} dy="0.35em" textAnchor="end">{t >= 1000 ? `${num(t / 1000, 1)}k` : num(t, 0)}</text>
          </g>
        ))}
        <text className="tick" x={x(0)} y={H - 8} textAnchor="start">{shortDate(data[0].date)}</text>
        <text className="tick" x={x(data.length - 1)} y={H - 8} textAnchor="end">{shortDate(last.date)}</text>
        {installCost > 0 && installCost <= top && (
          <g>
            <line className="ref" x1={PAD.left} x2={W - PAD.right} y1={y(installCost)} y2={y(installCost)} />
            <text className="ref-label" x={W - PAD.right} y={y(installCost) - 6} textAnchor="end">koszt instalacji</text>
          </g>
        )}
        <path className="area" d={area} />
        <path className="line" d={path} />
        {paidIdx >= 0 && <circle className="dot paid" cx={x(paidIdx)} cy={y(data[paidIdx].cumSaved)} r={5} />}
        <circle className="dot" cx={x(data.length - 1)} cy={y(last.cumSaved)} r={4} />
        {h && idx !== null && (
          <g>
            <line className="crosshair" x1={x(idx)} x2={x(idx)} y1={PAD.top} y2={PAD.top + IH} />
            <circle className="dot hover" cx={x(idx)} cy={y(h.cumSaved)} r={5} />
          </g>
        )}
      </svg>
      {h && (
        <div className="tooltip">
          <strong>{longDate(h.date)}</strong>
          <span>Łącznie: <b>{h.cumSaved.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</b></span>
          <span>To tankowanie: {h.saved >= 0 ? '+' : ''}{h.saved.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
          <span>Przebieg: {num(h.cumKm, 0)} km</span>
        </div>
      )}
      {paidIdx >= 0 && <p className="chart-note">Instalacja spłacona {longDate(data[paidIdx].date)}, po {num(data[paidIdx].cumKm, 0)} km.</p>}
    </figure>
  )
}

function ConsumptionChart({ data }: { data: Point[] }) {
  const { ref: box, W, IW } = useWidth()
  const { ref, idx, onMove, onLeave } = useHover(data.length, IW)
  const vals = data.map((d) => d.lpg_per_100)
  const maxY = Math.max(...vals, ...data.map((d) => d.rolling), 1)
  const ticks = niceTicks(maxY, 5)
  const top = ticks[ticks.length - 1]
  const slot = IW / data.length
  const bw = Math.max(4, Math.min(28, slot - 4))
  const xc = (i: number) => PAD.left + slot * i + slot / 2
  const y = (v: number) => PAD.top + IH - (Math.max(0, v) / top) * IH
  const avg = data[data.length - 1].rolling
  const overall = (data.reduce((s, d) => s + d.lpg_liters, 0) / data.reduce((s, d) => s + d.distance_km, 0)) * 100
  const rollPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xc(i).toFixed(1)},${y(d.rolling).toFixed(1)}`).join(' ')
  const h = idx !== null ? data[idx] : null

  return (
    <figure className="chart card" ref={box as React.RefObject<HTMLElement>}>
      <figcaption>
        <span className="chart-title">Spalanie LPG</span>
        <span className="chart-sub">ostatnio {num(avg)} l/100 km · średnio {num(overall)} l/100 km</span>
      </figcaption>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Wykres spalania LPG na 100 km dla kolejnych tankowań"
        onMouseMove={onMove} onMouseLeave={onLeave} onTouchStart={onMove} onTouchMove={onMove} onTouchEnd={onLeave}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={PAD.left - 8} y={y(t)} dy="0.35em" textAnchor="end">{num(t, 1)}</text>
          </g>
        ))}
        <text className="tick" x={PAD.left} y={H - 8} textAnchor="start">{shortDate(data[0].date)}</text>
        <text className="tick" x={W - PAD.right} y={H - 8} textAnchor="end">{shortDate(data[data.length - 1].date)}</text>
        {data.map((d, i) => {
          const hgt = Math.max(0, y(0) - y(d.lpg_per_100))
          return (
            <rect key={d.id} className={'bar' + (idx === i ? ' hover' : '')} x={xc(i) - bw / 2} y={y(d.lpg_per_100)} width={bw} height={hgt} rx={Math.min(4, bw / 2)} />
          )
        })}
        {/* square off the bottom corners: overlay a small rect at the baseline */}
        {data.map((d, i) => {
          const hgt = Math.max(0, y(0) - y(d.lpg_per_100))
          return hgt > 4 ? <rect key={'b' + d.id} className={'bar' + (idx === i ? ' hover' : '')} x={xc(i) - bw / 2} y={y(0) - 4} width={bw} height={4} /> : null
        })}
        <path className="line rolling" d={rollPath} />
        {h && idx !== null && <circle className="dot hover" cx={xc(idx)} cy={y(h.rolling)} r={5} />}
      </svg>
      <div className="legend">
        <span><i className="sw bar" /> tankowanie</span>
        <span><i className="sw line" /> średnia z 3 tankowań</span>
      </div>
      {h && (
        <div className="tooltip">
          <strong>{longDate(h.date)}</strong>
          <span>Spalanie: <b>{num(h.lpg_per_100)} l/100 km</b></span>
          <span>Średnia z 3: {num(h.rolling)} l/100 km</span>
          <span>{num(h.lpg_liters)} l na {num(h.distance_km, 0)} km</span>
        </div>
      )}
    </figure>
  )
}
