import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function DashboardPage() {
  const [stats, setStats] = useState({
    trips: 0,
    activeTrips: 0,
    tickets: 0,
    passengers: 0,
    pendingUsers: 0
  })

  useEffect(() => {
    async function load() {
      const [trips, activeTrips, tickets, passengers, pendingUsers] = await Promise.all([
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('passengers').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('active', false)
      ])
      setStats({
        trips: trips.count || 0,
        activeTrips: activeTrips.count || 0,
        tickets: tickets.count || 0,
        passengers: passengers.count || 0,
        pendingUsers: pendingUsers.count || 0
      })
    }
    load()
  }, [])

  return (
    <div className="page">
      <h1>Panel de administración</h1>
      <p className="subtitle">Resumen general del sistema.</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{stats.activeTrips}</div>
          <div className="label">Viajes activos ahora</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.trips}</div>
          <div className="label">Viajes totales</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.tickets}</div>
          <div className="label">Boletos emitidos</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.passengers}</div>
          <div className="label">Pasajeros registrados</div>
        </div>
      </div>

      {stats.pendingUsers > 0 && (
        <div className="card" style={{ borderColor: '#fbbf24', background: '#fffbeb', marginBottom: 20 }}>
          Tienes <b>{stats.pendingUsers}</b> usuario(s) esperando activación.{' '}
          <Link to="/admin/usuarios">Ir a Usuarios</Link>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Primeros pasos</h3>
        <ol style={{ paddingLeft: 18, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <li>Crea tus rutas y buses.</li>
          <li>Crea un viaje eligiendo ruta, bus, salida y llegada.</li>
          <li>Activa a los operadores en la sección Usuarios y asígnalos a un viaje desde Viajes.</li>
          <li>Registra pasajeros y emite sus boletos para ese viaje.</li>
          <li>Pon el viaje en estado Activo para permitir el abordaje.</li>
        </ol>
      </div>
    </div>
  )
}
