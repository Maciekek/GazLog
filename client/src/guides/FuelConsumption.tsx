import GuideLayout from './GuideLayout'
import { GUIDES } from './index'

const meta = GUIDES[2]

export default function FuelConsumption() {
  return (
    <GuideLayout {...meta}>
      <p>
        Na benzynie wystarczy spojrzeć na komputer pokładowy. Na gazie to nie działa: większość aut nie wie, że
        jedzie na LPG, i pokazuje spalanie benzyny, której nie zużywa. Jedyna wiarygodna metoda to liczenie z
        tankowań.
      </p>

      <h2>Metoda „do pełna”</h2>
      <ol>
        <li>Zatankuj gaz do odcięcia pistoletu. Zapisz stan licznika (albo wyzeruj licznik dzienny).</li>
        <li>Jedź normalnie, aż zapali się rezerwa lub auto przełączy się na benzynę.</li>
        <li>Zatankuj znów do odcięcia. Zapisz litry z dystrybutora i przejechane km.</li>
        <li>Policz:</li>
      </ol>
      <pre>
spalanie [l/100 km] = litry ÷ przejechane km × 100
      </pre>
      <p>Przykład: 38,5 l na 395 km → 38,5 ÷ 395 × 100 = <strong>9,7 l/100 km</strong>.</p>

      <h2>Dlaczego jeden pomiar nie wystarczy</h2>
      <p>
        Zbiornik LPG ma zawór odcinający na ok. 80% pojemności, a moment odcięcia zależy od temperatury gazu,
        ciśnienia na stacji i tego, jak stoi auto. Różnica między tankowaniami sięga 2–3 litrów, co przy 40 l
        zbiorniku daje błąd ±7%. Dlatego:
      </p>
      <ul>
        <li>Licz średnią z <strong>minimum 3–5 tankowań</strong>, najlepiej krocząco.</li>
        <li>Tankuj na tej samej stacji, jeśli się da. Dystrybutory LPG bywają różnie skalibrowane.</li>
        <li>Nie „dobijaj” po odcięciu. Zawór 80% jest po coś, a wynik i tak się rozjedzie.</li>
      </ul>

      <h2>Typowe błędy</h2>
      <ul>
        <li>
          <strong>Ignorowanie benzyny na rozruch.</strong> Auto startuje na benzynie i przełącza się na gaz po
          rozgrzaniu reduktora. Zimą, przy krótkich trasach, to 0,3–0,8 l benzyny na 100 km. Jeśli liczysz koszt
          jazdy, dolicz. Jeśli benzyna leci szybciej niż 1 l/100 km, coś jest źle ustawione.
        </li>
        <li>
          <strong>Porównywanie lato vs zima.</strong> Zimą spalanie rośnie o 10–15% na każdym paliwie, a mieszanka
          LPG ma więcej butanu. Porównuj tylko podobne okresy albo licz średnią roczną.
        </li>
        <li>
          <strong>Liczenie „ile wlałem za 100 zł”.</strong> Cena zmienia wynik, spalanie nie. Zawsze przeliczaj na litry.
        </li>
        <li>
          <strong>Wiara w komputer pokładowy „po przeliczeniu”.</strong> Niektóre sterowniki LPG emulują sygnał
          wtrysku, żeby komputer pokazywał sensowne wartości. To szacunek na podstawie kalibracji, nie pomiar.
        </li>
      </ul>

      <h2>Ile powinno wyjść</h2>
      <p>
        Weź spalanie na benzynie z tej samej trasy i pomnóż przez 1,15–1,25. Auto palące 7,5 l benzyny powinno
        mieścić się w 8,6–9,4 l LPG. Jeśli wychodzi 30% więcej i więcej, instalacja jest źle skalibrowana albo
        reduktor nie nadąża. Jeśli wychodzi mniej niż na benzynie, licznik albo dystrybutor kłamie.
      </p>

      <h2>Przełóż spalanie na pieniądze</h2>
      <p>Koszt 100 km na LPG i to, ile kosztowałby ten sam dystans na benzynie:</p>
      <pre>
koszt LPG     = spalanie_LPG × cena_LPG
koszt benzyny = spalanie_benzyny × cena_benzyny
oszczędność   = koszt benzyny − koszt LPG
      </pre>
      <p>
        Spalanie na benzynie znasz z czasów przed instalacją albo z kilku tankowań benzyną po montażu. Wystarczy
        ustawić je raz. Potem przy każdym tankowaniu zapisujesz km, litry, cenę LPG i cenę benzyny z tej samej
        stacji. Średnia krocząca, oszczędność i próg zwrotu liczą się same. Tak działa GazLog. Jeśli wolisz arkusz,
        wzory wyżej wystarczą.
      </p>
    </GuideLayout>
  )
}
