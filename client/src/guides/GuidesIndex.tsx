import { useEffect } from 'react'
import { GUIDES } from './index'

export default function GuidesIndex() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Poradnik LPG – koszty, spalanie, zwrot instalacji – GazLog'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="landing guide">
      <nav className="landing-nav">
        <a className="brand" href="/">⛽ GazLog</a>
        <a className="btn ghost" href="/">Aplikacja</a>
      </nav>
      <h1>Poradnik LPG</h1>
      <p className="lead">Konkretne liczby i wzory zamiast opinii z forów. Krótko, po polsku, bez sponsorowanych warsztatów.</p>
      <div className="guide-list">
        {GUIDES.map((g) => (
          <a className="guide-card card" href={`/guides/${g.slug}`} key={g.slug}>
            <h2>{g.title}</h2>
            <p>{g.description}</p>
            <span className="muted">{g.readingMinutes} min czytania</span>
          </a>
        ))}
      </div>
      <footer className="landing-footer">
        <a href="/">GazLog</a> · <a href="/privacy">Polityka prywatności</a> · <a href="/terms">Regulamin</a>
      </footer>
    </div>
  )
}
