import { useAuth } from '../../hooks/useAuth'

export function PendingPage() {
  const { profile, signOut, refreshProfile } = useAuth()

  return (
    <div className="center-page">
      <div className="card" style={{ maxWidth: 420 }}>
        <h1 style={{ marginTop: 0 }}>Cuenta pendiente de activación</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Hola {profile?.full_name || profile?.email}. Tu cuenta fue creada correctamente, pero un
          administrador todavía debe activarla y asignarte un viaje antes de que puedas escanear boletos.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn secondary" onClick={() => refreshProfile()}>
            Ya me activaron, revisar de nuevo
          </button>
          <button className="btn secondary" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
