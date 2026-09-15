const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined

export default function Terms() {
  return (
    <div className="landing privacy">
      <nav className="landing-nav">
        <a className="brand" href="/">⛽ GazLog</a>
        <a className="btn ghost" href="/">Wróć</a>
      </nav>

      <h1>Regulamin</h1>
      <p className="muted">Ostatnia aktualizacja: 15 września 2026</p>

      <h2>1. Czym jest GazLog</h2>
      <p>
        GazLog to bezpłatna aplikacja do zapisywania tankowań LPG i szacowania oszczędności względem benzyny.
        Prowadzi ją osoba fizyczna, niekomercyjnie
        {CONTACT ? <> (kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>)</> : null}.
      </p>

      <h2>2. Konto</h2>
      <p>
        Korzystanie wymaga zalogowania kontem Google. Zakładając konto, akceptujesz ten regulamin i{' '}
        <a href="/privacy">politykę prywatności</a>. Możesz usunąć konto w każdej chwili w Ustawieniach.
      </p>

      <h2>3. Zasady</h2>
      <ul>
        <li>Używasz aplikacji na własne potrzeby, zgodnie z prawem.</li>
        <li>Nie próbujesz uzyskać dostępu do danych innych użytkowników ani zakłócać działania serwisu.</li>
        <li>Nie wpisujesz w notatkach danych osobowych innych osób ani treści bezprawnych.</li>
      </ul>

      <h2>4. Charakter wyliczeń</h2>
      <p>
        Oszczędności są szacunkiem opartym na danych, które wpisujesz, i na podanym przez Ciebie spalaniu na benzynie.
        Nie są poradą finansową ani gwarancją jakichkolwiek wyników.
      </p>

      <h2>5. Dostępność i odpowiedzialność</h2>
      <p>
        Aplikacja jest udostępniana „tak jak jest", bez gwarancji ciągłości działania ani zachowania danych. Rób
        własne kopie ważnych informacji. Administrator może zmienić lub zakończyć działanie serwisu, informując o tym
        na stronie głównej z rozsądnym wyprzedzeniem, gdy to możliwe. Odpowiedzialność administratora jest ograniczona
        do zakresu wymaganego bezwzględnie obowiązującymi przepisami prawa.
      </p>

      <h2>6. Zmiany regulaminu</h2>
      <p>
        O istotnych zmianach poinformujemy komunikatem w aplikacji. Dalsze korzystanie po zmianie oznacza jej
        akceptację. Jeśli się nie zgadzasz, usuń konto.
      </p>

      <h2>7. Prawo</h2>
      <p>Regulamin podlega prawu polskiemu.</p>

      <footer className="landing-footer">
        <a href="/">GazLog</a> · <a href="/privacy">Polityka prywatności</a> ·{' '}
        <a href="https://github.com/Maciekek/GazLog">GitHub</a>
      </footer>
    </div>
  )
}
