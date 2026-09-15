import { useEffect, useRef, useState } from 'react'
import type { Me } from '../api'

type Props = { me: Me; onSettings: () => void; onAdmin?: () => void; onLogout: () => void }

export default function UserMenu({ me, onSettings, onAdmin, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const initial = (me.name ?? me.email).trim().charAt(0).toUpperCase()

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu użytkownika"
        onClick={() => setOpen((v) => !v)}
      >
        {me.picture ? <img src={me.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback">{initial}</span>}
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-header">
            <div className="menu-name">{me.name ?? me.email}</div>
            {me.name && <div className="menu-email">{me.email}</div>}
          </div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onSettings() }}>⚙️ Ustawienia</button>
          {me.role === 'admin' && onAdmin && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onAdmin() }}>🛠️ Admin</button>
          )}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout() }}>↪ Wyloguj</button>
        </div>
      )}
    </div>
  )
}
