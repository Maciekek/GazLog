import { useEffect, useState } from 'react'
import { api, type AdminUser } from '../api'
import { num, pln } from '../format'

const dt = (iso: string | null) => (iso ? new Date(iso.replace(' ', 'T') + (iso.includes('T') || iso.includes('Z') ? '' : 'Z')).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '–')

/** /admin: read-only list of accounts. The server enforces the role; the client only hides the route. */
export default function AdminView() {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.adminUsers().then((r) => setUsers(r.users)).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="card error">{error}</div>
  if (!users) return null

  const totals = users.reduce(
    (a, u) => ({ fillups: a.fillups + u.fillups, km: a.km + u.km, lpg: a.lpg + u.lpg_cost }),
    { fillups: 0, km: 0, lpg: 0 },
  )

  return (
    <>
      <div className="card">
        <div className="stats">
          <div className="stat"><div className="label">Użytkownicy</div><div className="value">{users.length}</div></div>
          <div className="stat"><div className="label">Tankowań</div><div className="value">{totals.fillups}</div></div>
          <div className="stat"><div className="label">Kilometrów</div><div className="value">{num(totals.km, 0)}</div></div>
          <div className="stat"><div className="label">Wydano na LPG</div><div className="value">{pln(totals.lpg)}</div></div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Konta</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Użytkownik</th>
                <th>Rola</th>
                <th>Założone</th>
                <th>Ostatnie logowanie</th>
                <th className="r">Tankowań</th>
                <th className="r">km</th>
                <th className="r">LPG</th>
                <th>Ostatnie tankowanie</th>
                <th className="r">Sesje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="u-cell">
                      {u.picture ? <img src={u.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback sm">{(u.name ?? u.email).charAt(0).toUpperCase()}</span>}
                      <div>
                        <div className="u-name">{u.name ?? '–'}</div>
                        <div className="u-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.role === 'admin' ? <span className="badge admin">admin</span> : <span className="badge">user</span>}</td>
                  <td className="muted">{dt(u.created_at)}</td>
                  <td className="muted">{dt(u.last_login_at)}</td>
                  <td className="r">{u.fillups}</td>
                  <td className="r">{num(u.km, 0)}</td>
                  <td className="r">{pln(u.lpg_cost)}</td>
                  <td className="muted">{u.last_fillup ?? '–'}</td>
                  <td className="r">{u.active_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
