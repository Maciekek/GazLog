import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { fetchMe, logout, type Me } from './api'
import Landing from './pages/Landing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import Tracker from './pages/Tracker'
import HomeView from './pages/HomeView'
import FillupFormView from './pages/FillupFormView'
import SettingsView from './pages/SettingsView'
import GuidesIndex from './guides/GuidesIndex'
import InstallCost from './guides/InstallCost'
import LpgVsPetrol from './guides/LpgVsPetrol'
import FuelConsumption from './guides/FuelConsumption'

type Auth = { loading: boolean; me: Me | null; loginEnabled: boolean }

export default function App() {
  const [auth, setAuth] = useState<Auth>({ loading: true, me: null, loginEnabled: true })
  const onLogout = async () => {
    await logout().catch(() => {})
    setAuth((s) => ({ ...s, me: null }))
  }

  useEffect(() => {
    fetchMe().then((r) => setAuth({ loading: false, me: r.user, loginEnabled: r.loginEnabled }))
  }, [])

  return (
    <Routes>
      {/* Public pages, no session needed. Keep in sync with PUBLIC_PAGES in server/src/index.ts. */}
      <Route path="/prywatnosc" element={<Privacy />} />
      <Route path="/regulamin" element={<Terms />} />
      <Route path="/poradnik" element={<GuidesIndex />} />
      <Route path="/poradnik/ile-kosztuje-instalacja-lpg-i-kiedy-sie-zwraca" element={<InstallCost />} />
      <Route path="/poradnik/lpg-czy-benzyna-kalkulator" element={<LpgVsPetrol />} />
      <Route path="/poradnik/jak-liczyc-spalanie-lpg" element={<FuelConsumption />} />

      {/* App: landing when logged out, tracker layout with nested views when logged in. */}
      <Route element={<AuthGate auth={auth} />}>
        <Route element={<Tracker me={auth.me!} onLogout={onLogout} />}>
          <Route index element={<HomeView />} />
          <Route path="nowe" element={<FillupFormView />} />
          <Route path="edytuj/:id" element={<FillupFormView />} />
          <Route path="ustawienia" element={<SettingsView onLogout={onLogout} />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

import { Outlet } from 'react-router'

/** Renders nested app routes for a signed-in user; otherwise the landing page (at /) or a redirect to it. */
function AuthGate({ auth }: { auth: Auth }) {
  const { pathname } = useLocation()
  if (auth.loading) return null
  if (auth.me) return <Outlet />
  if (pathname !== '/') return <Navigate to="/" replace />
  const error = new URLSearchParams(window.location.search).get('error')
  return <Landing loginEnabled={auth.loginEnabled} error={error} />
}
