import GuideLayout from './GuideLayout'
import { GUIDES } from './index'

const meta = GUIDES[0]

export default function InstallCost() {
  return (
    <GuideLayout {...meta}>
      <p>
        Instalacja gazowa to inwestycja, która zwraca się w kilometrach, nie w miesiącach. Poniżej orientacyjne
        koszty z polskiego rynku i prosty sposób, żeby policzyć próg zwrotu dla własnego auta. Ceny podajemy jako
        przedziały z ostatnich lat, przed decyzją sprawdź aktualne oferty w Twojej okolicy.
      </p>

      <h2>Ile kosztuje montaż</h2>
      <p>Cena zależy głównie od typu silnika i klasy instalacji:</p>
      <table>
        <thead>
          <tr><th>Silnik</th><th>Typ instalacji</th><th>Orientacyjny koszt</th></tr>
        </thead>
        <tbody>
          <tr><td>Wtrysk pośredni, 4 cylindry</td><td>Sekwencyjna (IV generacja)</td><td>2 500 – 4 000 zł</td></tr>
          <tr><td>Wtrysk pośredni, 6–8 cylindrów</td><td>Sekwencyjna</td><td>4 000 – 6 000 zł</td></tr>
          <tr><td>Wtrysk bezpośredni (TSI, GDI, T-GDI…)</td><td>Dedykowana do DI, często z wtryskiem ciekłej fazy</td><td>5 500 – 9 000 zł</td></tr>
          <tr><td>Hybryda z silnikiem benzynowym</td><td>Dedykowana, ograniczona oferta</td><td>6 000 – 10 000 zł</td></tr>
        </tbody>
      </table>
      <p>
        W cenie zwykle jest zbiornik (toroidalny w miejsce koła zapasowego lub cylindryczny w bagażniku), reduktor,
        wtryskiwacze, sterownik, przewody, wpis do dowodu i badanie techniczne po montażu. Zapytaj, czy tak jest,
        bo „cena od” lubi tego nie zawierać.
      </p>

      <h2>Koszty, o których warsztat mówi ciszej</h2>
      <ul>
        <li>
          <strong>Badanie techniczne co roku.</strong> Auto z LPG traci prawo do dłuższego okresu między przeglądami i
          płaci dopłatę za sprawdzenie instalacji. Rząd kilkudziesięciu złotych rocznie.
        </li>
        <li>
          <strong>Legalizacja zbiornika.</strong> Zbiornik ma ważność 10 lat od daty produkcji. Potem wymiana (kilkaset
          złotych z robocizną) albo ponowna legalizacja, jeśli jest dostępna dla Twojego typu.
        </li>
        <li>
          <strong>Serwis instalacji.</strong> Filtry fazy lotnej i ciekłej co 10–20 tys. km, ok. 100–250 zł. Reduktor
          wytrzymuje zwykle 100–150 tys. km.
        </li>
        <li>
          <strong>Częstsza kontrola luzów zaworowych</strong> w silnikach bez hydraulicznej regulacji. LPG spala się
          w wyższej temperaturze, ważne zwłaszcza w starszych japońskich i koreańskich konstrukcjach.
        </li>
        <li>
          <strong>Wyższe spalanie.</strong> Litr LPG ma mniej energii niż litr benzyny. Realnie zużycie rośnie o 15–25%
          objętościowo. To nie „koszt ukryty”, ale trzeba go wliczyć w oszczędność.
        </li>
        <li><strong>Utrata miejsca</strong> na koło zapasowe albo część bagażnika.</li>
      </ul>

      <h2>Wzór na zwrot</h2>
      <p>Oszczędność na 100 km:</p>
      <pre>
oszczędność/100 km = spalanie_benzyny × cena_benzyny − spalanie_LPG × cena_LPG
      </pre>
      <p>Próg zwrotu w kilometrach:</p>
      <pre>
km do zwrotu = koszt instalacji ÷ oszczędność/100 km × 100
      </pre>

      <h3>Przykład</h3>
      <p>
        Auto pali 8,0 l/100 km benzyny za 6,30 zł/l. Na gazie 9,6 l/100 km (20% więcej) po 3,20 zł/l. Instalacja
        3 500 zł.
      </p>
      <pre>
benzyna: 8,0 × 6,30 = 50,40 zł / 100 km
LPG:     9,6 × 3,20 = 30,72 zł / 100 km
oszczędność:          19,68 zł / 100 km  (~39%)

zwrot: 3 500 ÷ 19,68 × 100 ≈ 17 800 km
      </pre>
      <p>
        Przy 15 tys. km rocznie instalacja zwraca się po niecałych 14 miesiącach. Przy 8 tys. km rocznie to ponad 2
        lata, plus roczny przegląd i serwis, który zjada część zysku. Poniżej 6–7 tys. km rocznie LPG rzadko ma
        sens ekonomiczny.
      </p>

      <h2>Na co uważać przy wyborze warsztatu</h2>
      <ul>
        <li>Instalacje znanych marek z dostępnym serwisem w Twoim regionie, a nie „no-name” z hurtowni.</li>
        <li>Gwarancja na montaż, nie tylko na części, na piśmie.</li>
        <li>Doświadczenie z Twoim konkretnym silnikiem. Wtrysk bezpośredni to inna liga.</li>
        <li>Kalibracja na hamowni lub przynajmniej długa jazda próbna z logowaniem korekt sterownika.</li>
      </ul>

      <h2>Jak to śledzić w praktyce</h2>
      <p>
        Wzór jest prosty, ale ceny paliw zmieniają się co tydzień, a spalanie zależy od pory roku i trasy. Zamiast
        liczyć raz „na oko”, zapisuj każde tankowanie: kilometry, litry, cenę LPG i aktualną cenę benzyny. Wtedy
        oszczędność liczy się z realnych danych, a próg zwrotu aktualizuje się sam. Dokładnie to robi GazLog.
      </p>
    </GuideLayout>
  )
}
