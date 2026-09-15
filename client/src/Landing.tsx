const errors: Record<string, string> = {
  state: 'Logowanie przerwane. Spróbuj ponownie.',
  token: 'Google odrzucił logowanie. Spróbuj ponownie.',
  userinfo: 'Nie udało się pobrać profilu Google.',
  email: 'Konto Google bez zweryfikowanego e-maila.',
  forbidden: 'To konto nie ma dostępu do tej instancji GazLog.',
  internal: 'Błąd serwera. Spróbuj ponownie.',
}

export default function Landing({ loginEnabled, error }: { loginEnabled: boolean; error: string | null }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="brand">⛽ GazLog</span>
        {loginEnabled && <a className="btn ghost" href="/api/auth/google">Zaloguj</a>}
      </nav>

      <section className="hero">
        <div className="hero-text">
          <h1>Ile naprawdę oszczędzasz na gazie?</h1>
          <p>
            Jedno tankowanie, cztery liczby, zero arkuszy. GazLog liczy, ile kosztowałby ten sam dystans na
            benzynie i pokazuje, kiedy instalacja LPG się spłaci.
          </p>
          {error && <div className="landing-error">{errors[error] ?? 'Coś poszło nie tak.'}</div>}
          {loginEnabled ? (
            <a className="btn google" href="/api/auth/google">
              <GoogleIcon /> Zaloguj się przez Google
            </a>
          ) : (
            <div className="landing-error">Logowanie nie jest skonfigurowane (brak GOOGLE_CLIENT_ID).</div>
          )}
          <p className="fine">Bez rejestracji, bez hasła. Tylko konto Google. Logując się akceptujesz <a href="/regulamin">regulamin</a> i <a href="/prywatnosc">politykę prywatności</a>.</p>
        </div>

        <div className="hero-card" aria-hidden="true">
          <div className="hc-label">Zaoszczędzono łącznie</div>
          <div className="hc-value">2 864,80 zł</div>
          <div className="hc-bar"><div className="hc-fill" style={{ width: '72%' }} /></div>
          <div className="hc-sub">72% zwrotu instalacji · ~4 100 km do końca</div>
          <div className="hc-grid">
            <div><span>12 340 km</span><small>przejechane</small></div>
            <div><span>10,1 l/100</span><small>spalanie LPG</small></div>
            <div><span>38 tankowań</span><small>w historii</small></div>
          </div>
        </div>
      </section>

      <section className="features">
        <Feature icon="⏱️" title="10 sekund na stacji">
          Data, km, litry, cena gazu i benzyny. Ceny podpowiadane z ostatniego tankowania.
        </Feature>
        <Feature icon="🧮" title="Uczciwe porównanie">
          Koszt benzyny liczony z Twojego realnego spalania, nie z reklamy producenta.
        </Feature>
        <Feature icon="📈" title="Zwrot instalacji">
          Widzisz ile zostało do spłaty i za ile kilometrów gaz zacznie zarabiać na siebie.
        </Feature>
        <Feature icon="📱" title="Działa na telefonie">
          Lekki interfejs, tryb ciemny, dane na Twoim serwerze. Bez reklam, bez śledzenia.
        </Feature>
      </section>

      <section className="how">
        <h2>Jak to liczymy</h2>
        <div className="formula">
          <div className="f-line"><span className="f-k">Koszt LPG</span><span>= litry × cena LPG</span></div>
          <div className="f-line"><span className="f-k">Koszt benzyny</span><span>= km ÷ 100 × spalanie × cena benzyny</span></div>
          <div className="f-line total"><span className="f-k">Oszczędność</span><span>= koszt benzyny − koszt LPG</span></div>
        </div>
        <p className="fine">Spalanie na benzynie ustawiasz raz w ustawieniach. Reszta liczy się sama.</p>
      </section>

      <footer className="landing-footer">
        GazLog · <a href="https://github.com/Maciekek/GazLog">GitHub</a> · <a href="/prywatnosc">Polityka prywatności</a> · <a href="/regulamin">Regulamin</a>
      </footer>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="feature">
      <div className="f-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.7c-.3 2.1-1.7 5.3-4.8 7.4l7.4 5.7c4.4-4.1 7.2-10.1 7.2-17.2z"/>
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.1z"/>
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.4-5.7c-2 1.4-4.7 2.4-8.2 2.4-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  )
}
