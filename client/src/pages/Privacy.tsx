const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined

export default function Privacy() {
  return (
    <div className="landing privacy">
      <nav className="landing-nav">
        <a className="brand" href="/">⛽ GazLog</a>
        <a className="btn ghost" href="/">Wróć</a>
      </nav>

      <h1>Polityka prywatności</h1>
      <p className="muted">Ostatnia aktualizacja: 15 września 2026</p>

      <h2>Kto</h2>
      <p>
        GazLog to prywatna, niekomercyjna aplikacja prowadzona przez osobę fizyczną
        {CONTACT ? <> (kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>)</> : null}. Nie ma reklam, nie
        sprzedaje danych i nie przekazuje ich nikomu.
      </p>

      <h2>Jakie dane</h2>
      <ul>
        <li>
          <strong>Z konta Google</strong> po zalogowaniu: identyfikator konta, adres e-mail, imię i nazwisko, adres
          zdjęcia profilowego. Nie mamy dostępu do hasła, poczty, kontaktów ani innych danych Google.
        </li>
        <li>
          <strong>Wpisane przez Ciebie</strong>: data tankowania, przejechane kilometry, litry LPG, ceny paliw, notatki,
          ustawienia (spalanie, koszt instalacji).
        </li>
        <li>
          <strong>Techniczne</strong>: plik cookie sesji (<code>gazlog_session</code>), niezbędny do utrzymania
          zalogowania. Bez cookies analitycznych i śledzących.
        </li>
      </ul>

      <h2>Po co</h2>
      <p>
        Wyłącznie do działania aplikacji: rozpoznanie Cię po zalogowaniu i przypisanie tankowań do Twojego konta oraz
        liczenie oszczędności. Nie profilujemy, nie wysyłamy newsletterów.
      </p>

      <h2>Gdzie i jak długo</h2>
      <p>
        Dane są przechowywane w bazie SQLite na serwerze administratora aplikacji. Sesja wygasa po 30 dniach lub po
        wylogowaniu. Dane konta i tankowań trzymamy do momentu, aż je usuniesz.
      </p>

      <h2>Usunięcie danych</h2>
      <p>
        W aplikacji: Ustawienia → „Usuń konto i wszystkie dane". Usuwa natychmiast i nieodwracalnie konto, tankowania,
        ustawienia i sesje. Możesz też cofnąć dostęp aplikacji w ustawieniach konta Google
        (myaccount.google.com → Bezpieczeństwo → Połączenia z aplikacjami innych firm).
        {CONTACT ? <> Możesz też napisać na <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> : null}
      </p>

      <h2>Twoje prawa</h2>
      <p>
        Masz prawo dostępu do danych, ich poprawienia, usunięcia i przeniesienia. Wszystkie wpisane dane widzisz i
        edytujesz bezpośrednio w aplikacji. Przysługuje Ci też skarga do Prezesa Urzędu Ochrony Danych Osobowych.
      </p>

      <h2>Podmioty trzecie</h2>
      <p>
        Logowanie obsługuje Google (Google Ireland Ltd.) zgodnie z{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">polityką prywatności Google</a>.
        Poza tym żadne dane nie opuszczają serwera aplikacji.
      </p>

      <footer className="landing-footer">
        <a href="/">GazLog</a> · <a href="/terms">Regulamin</a> · <a href="https://github.com/Maciekek/GazLog">GitHub</a>
      </footer>
    </div>
  )
}
