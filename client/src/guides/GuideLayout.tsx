import { useEffect } from 'react'
import { GUIDES } from './index'

type Props = {
  slug: string
  title: string
  description: string
  published: string
  updated?: string
  readingMinutes: number
  children: React.ReactNode
}

export default function GuideLayout({ slug, title, description, published, updated, readingMinutes, children }: Props) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} – GazLog`
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = meta?.content ?? ''
    if (meta) meta.content = description
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const prevCanonical = canonical?.href ?? ''
    if (canonical) canonical.href = `${window.location.origin}/guides/${slug}`
    return () => {
      document.title = prevTitle
      if (meta) meta.content = prevDesc
      if (canonical) canonical.href = prevCanonical
    }
  }, [slug, title, description])

  const others = GUIDES.filter((g) => g.slug !== slug)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: published,
    dateModified: updated ?? published,
    inLanguage: 'pl',
    author: { '@type': 'Organization', name: 'GazLog' },
    publisher: { '@type': 'Organization', name: 'GazLog' },
    mainEntityOfPage: `${window.location.origin}/guides/${slug}`,
  }

  return (
    <div className="landing guide">
      <nav className="landing-nav">
        <a className="brand" href="/">⛽ GazLog</a>
        <a className="btn ghost" href="/guides">Poradnik</a>
      </nav>

      <main>
      <article>
        <p className="crumbs"><a href="/">GazLog</a> › <a href="/guides">Poradnik</a></p>
        <h1>{title}</h1>
        <p className="meta">
          <time dateTime={published}>{formatDate(updated ?? published)}</time> · {readingMinutes} min czytania
        </p>
        <p className="lead">{description}</p>
        {children}
      </article>
      </main>

      <aside className="cta card">
        <h2>Policz to na własnych liczbach</h2>
        <p>
          GazLog to darmowy dziennik tankowań LPG. Wpisujesz km, litry i ceny, a apka liczy oszczędność względem
          benzyny i pokazuje, kiedy instalacja się spłaci.
        </p>
        <a className="btn primary" href="/">Zaloguj się i zacznij liczyć</a>
      </aside>

      {others.length > 0 && (
        <section className="more">
          <h2>Czytaj dalej</h2>
          <ul>
            {others.map((g) => (
              <li key={g.slug}><a href={`/guides/${g.slug}`}>{g.title}</a></li>
            ))}
          </ul>
        </section>
      )}

      <footer className="landing-footer">
        <a href="/">GazLog</a> · <a href="/guides">Poradnik</a> · <a href="/privacy">Polityka prywatności</a> ·{' '}
        <a href="/terms">Regulamin</a>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}
