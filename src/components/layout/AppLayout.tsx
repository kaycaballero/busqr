import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/app', label: 'Inicio', end: true },
  { to: '/app/escanear', label: 'Escanear' },
  { to: '/app/viaje', label: 'Mi viaje' },
  { to: '/app/registros', label: 'Registros' }
]

export function AppLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="mobile-shell">
      <div className="mobile-topbar">
        <div className="title">Validador de boletos</div>
        <button className="btn secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={signOut}>
          Salir
        </button>
      </div>
      <div className="mobile-content">
        {profile?.role === 'admin' && (
          <div style={{ marginBottom: 12 }}>
            <NavLink to="/admin/dashboard" style={{ color: '#93c5fd', fontSize: 13 }}>
              ← Ir al panel de administrador
            </NavLink>
          </div>
        )}
        <Outlet />
      </div>
      <div className="mobile-tabbar">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
