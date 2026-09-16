import { Link, Outlet, useLocation, useOutletContext } from 'react-router'
import type { Me } from '../api'
import { useTrackerData } from '../hooks/useTrackerData'
import AppHeader from '../components/AppHeader'

export type TrackerContext = ReturnType<typeof useTrackerData>

/** Logged-in layout: header, the routed view, footer. Data is shared with child routes via outlet context. */
export default function Tracker({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const data = useTrackerData()
  const { pathname } = useLocation()

  return (
    <div className="app">
      <AppHeader me={me} showBack={pathname !== '/'} onLogout={onLogout} />
      <main>
        <Outlet context={data} />
      </main>
      {data.error && <div className="error">{data.error}</div>}
      <div className="footer-links">
        <Link to="/privacy">Polityka prywatności</Link> · <Link to="/terms">Regulamin</Link>
      </div>
    </div>
  )
}

export function useTracker() {
  return useOutletContext<TrackerContext>()
}
