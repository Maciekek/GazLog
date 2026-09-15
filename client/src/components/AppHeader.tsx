import { Link, useNavigate } from 'react-router'
import type { Me } from '../api'
import UserMenu from './UserMenu'

export default function AppHeader({ me, showBack, onLogout }: { me: Me; showBack: boolean; onLogout: () => void }) {
  const navigate = useNavigate()
  return (
    <header>
      <h1><Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>⛽ GazLog</Link></h1>
      <div className="user">
        {showBack && <Link className="btn-link secondary small" to="/">← Wróć</Link>}
        <UserMenu me={me} onSettings={() => navigate('/settings')} onLogout={onLogout} />
      </div>
    </header>
  )
}
