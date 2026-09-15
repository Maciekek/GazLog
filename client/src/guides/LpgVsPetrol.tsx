import { useMemo, useState } from 'react'
import GuideLayout from './GuideLayout'
import { GUIDES } from './index'

const meta = GUIDES[1]
const pln = (n: number) => n.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
const num = (n: number, d = 1) => n.toLocaleString('pl-PL', { maximumFractionDigits: d })

export default function LpgVsPetrol() {
  const [petrolCons, setPetrolCons] = useState('8')
  const [petrolPrice, setPetrolPrice] = useState('6.30')
  const [lpgPrice, setLpgPrice] = useState('3.20')
  const [extra, setExtra] = useState('20')
  const [kmYear, setKmYear] = useState('15000')
  const [install, setInstall] = useState('3500')

  const r = useMemo(() => {
    const n = (s: string) => Number(String(s).replace(',', '.')) || 0
    const pc = n(petrolCons), pp = n(petrolPrice), lp = n(lpgPrice), ex = n(extra) / 100, km = n(kmYear), inst = n(install)
    const lc = pc * (1 + ex)
    const petrol100 = pc * pp
    const lpg100 = lc * lp
    const save100 = petrol100 - lpg100
    const saveYear = (km / 100) * save100
    const breakEvenKm = save100 > 0 ? (inst / save100) * 100 : Infinity
    const breakEvenMonths = saveYear > 0 ? (inst / saveYear) * 12 : Infinity
    const maxLpgPrice = lc > 0 ? petrol100 / lc : 0
    return { lc, petrol100, lpg100, save100, saveYear, breakEvenKm, breakEvenMonths, maxLpgPrice, pct: petrol100 > 0 ? (save100 / petrol100) * 100 : 0 }
  }, [petrolCons, petrolPrice, lpgPrice, extra, kmYear, install])

  return (
    <GuideLayout {...meta}>
      <p>
        „Gaz jest o połowę tańszy” to najczęstszy mit. Cena za litr owszem, ale litr LPG ma mniej energii, więc
        auto pali go więcej. Realna oszczędność to zwykle 30–45% kosztu paliwa, nie 50%. Policz dla swojego auta.
      </p>

      <div className="calc card">
        <h2>Kalkulator LPG vs benzyna</h2>
        <div className="calc-grid">
          <label>Spalanie na benzynie (l/100 km)<input type="number" step="any" inputMode="decimal" value={petrolCons} onChange={(e) => setPetrolCons(e.target.value)} /></label>
          <label>Cena benzyny (zł/l)<input type="number" step="any" inputMode="decimal" value={petrolPrice} onChange={(e) => setPetrolPrice(e.target.value)} /></label>
          <label>Cena LPG (zł/l)<input type="number" step="any" inputMode="decimal" value={lpgPrice} onChange={(e) => setLpgPrice(e.target.value)} /></label>
          <label>Wzrost spalania na LPG (%)<input type="number" step="any" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} /></label>
          <label>Przebieg roczny (km)<input type="number" step="any" inputMode="numeric" value={kmYear} onChange={(e) => setKmYear(e.target.value)} /></label>
          <label>Koszt instalacji (zł)<input type="number" step="any" inputMode="numeric" value={install} onChange={(e) => setInstall(e.target.value)} /></label>
        </div>
        <div className="calc-out">
          <div><span>Spalanie na LPG</span><strong>{num(r.lc)} l/100 km</strong></div>
          <div><span>100 km na benzynie</span><strong>{pln(r.petrol100)}</strong></div>
          <div><span>100 km na LPG</span><strong>{pln(r.lpg100)}</strong></div>
          <div className="hl"><span>Oszczędność na 100 km</span><strong>{pln(r.save100)} ({num(r.pct, 0)}%)</strong></div>
          <div className="hl"><span>Oszczędność rocznie</span><strong>{pln(r.saveYear)}</strong></div>
          <div><span>Zwrot instalacji</span><strong>{Number.isFinite(r.breakEvenKm) ? `${num(r.breakEvenKm, 0)} km (~${num(r.breakEvenMonths, 0)} mies.)` : 'nigdy'}</strong></div>
          <div><span>LPG przestaje się opłacać powyżej</span><strong>{pln(r.maxLpgPrice)}/l</strong></div>
        </div>
      </div>

      <h2>Skąd wzrost spalania na LPG</h2>
      <p>
        Wartość energetyczna LPG to ok. 25–26 MJ/l, benzyny ok. 32 MJ/l. Sama fizyka daje więc ~20–25% więcej litrów
        na ten sam dystans. Dobrze skalibrowana instalacja sekwencyjna w praktyce mieści się w 15–20%, kiepska lub
        zimowa mieszanka gazu z większym udziałem butanu potrafi dać 25% i więcej. W kalkulatorze domyślnie 20%.
        Jeśli masz już instalację, wstaw własną różnicę, mierzoną metodą „do pełna”.
      </p>

      <h2>Kiedy LPG się nie opłaca</h2>
      <ul>
        <li><strong>Mały przebieg.</strong> Poniżej ~7 tys. km rocznie zwrot instalacji wychodzi poza 3–4 lata.</li>
        <li><strong>Mała różnica cen.</strong> Sprawdź ostatni wiersz kalkulatora. Gdy LPG zbliża się do tego progu, oszczędność znika. Historycznie stosunek cen LPG/benzyna w Polsce oscylował wokół 0,45–0,55.</li>
        <li><strong>Silnik z problematycznym wtryskiem bezpośrednim</strong>, gdzie instalacja jest droga i część benzyny wciąż musi być wtryskiwana dla chłodzenia wtryskiwaczy.</li>
        <li><strong>Auto na sprzedaż za rok.</strong> Instalacja nie podnosi ceny odsprzedaży o tyle, ile kosztowała.</li>
      </ul>

      <h2>Co pomija ten kalkulator</h2>
      <p>
        Roczny przegląd instalacji, filtry, legalizację zbiornika po 10 latach, ewentualną regulację zaworów. Razem to
        zwykle 150–400 zł rocznie. Odejmij od rocznej oszczędności, jeśli chcesz mieć pełny obraz. Szczegóły w
        artykule o <a href="/guides/ile-kosztuje-instalacja-lpg-i-kiedy-sie-zwraca">kosztach instalacji</a>.
      </p>

      <h2>Kalkulator vs rzeczywistość</h2>
      <p>
        Powyżej liczysz na założeniach. Po montażu liczby będą inne: ceny na stacjach zmieniają się co tydzień, a
        spalanie zimą rośnie. Dlatego lepiej zapisywać każde tankowanie z aktualną ceną benzyny obok i liczyć
        oszczędność z faktów. Do tego jest GazLog.
      </p>
    </GuideLayout>
  )
}
