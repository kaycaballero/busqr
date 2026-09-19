import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/admin/dashboard', label: 'Panel' },
  { to: '/admin/viajes', label: 'Viajes' },
  { to: '/admin/rutas', label: 'Rutas' },
  { to: '/admin/buses', label: 'Buses' },
  { to: '/admin/pasajeros', label: 'Pasajeros' },
  { to: '/admin/boletos', label: 'Boletos' },
  { to: '/admin/validaciones', label: 'Validaciones' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/estadisticas', label: 'Estadísticas' }
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-shell">
      <div className="sidebar">
        <h2>Panel admin</h2>
        <span className="role-tag">{profile?.full_name || profile?.email}</span>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="signout">
          <button className="btn secondary" style={{ width: '100%' }} onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
