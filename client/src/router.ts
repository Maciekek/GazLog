import { useEffect, useState } from 'react'

const normalize = (p: string) => p.replace(/\/+$/, '') || '/'

/** Current pathname, kept in sync with back/forward navigation. */
export function usePath() {
  const [path, setPath] = useState(() => normalize(window.location.pathname))
  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

/** Push a new history entry and notify usePath() listeners. */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (normalize(window.location.pathname) === normalize(to)) return
  if (opts.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

/** Go back if there is in-app history to return to, otherwise fall back to `to`. */
export function back(to = '/') {
  if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) window.history.back()
  else navigate(to, { replace: true })
}

export const APP_PATHS = /^\/(nowe|ustawienia|edytuj\/\d+)$/
