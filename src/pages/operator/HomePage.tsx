import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../lib/results'
import type { Trip } from '../../types'

export function HomePage() {
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data: assignments } = await supabase
        .from('trip_assignments')
        .select('trip_id, trips(*, routes(*), buses(*))')
        .eq('user_id', profile.id)

      const trips = (assignments || [])
        .map((a: any) => a.trips as Trip)
        .filter(Boolean)
        .sort((a, b) => {
          if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
          if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1
          return new Date(b.departure_at).getTime() - new Date(a.departure_at).getTime()
        })
      setTrip(trips[0] || null)
      setLoading(false)
    }
    load()
  }, [profile])

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Hola, {profile?.full_name || profile?.email}</h2>
      {!trip && (
        <div className="card" style={{ background: '#1e293b', border: 'none', color: 'white' }}>
          Todavía no tienes un viaje asignado. Contacta al administrador.
        </div>
      )}
      {trip && (
        <div className="card" style={{ background: '#1e293b', border: 'none', color: 'white' }}>
          <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 6 }}>
            {trip.status === 'ACTIVE' ? 'VIAJE ACTIVO' : trip.status === 'FINISHED' ? 'VIAJE FINALIZADO' : 'VIAJE PROGRAMADO'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {trip.routes?.origin} → {trip.routes?.destination}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>Bus {trip.buses?.plate}</div>
          <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 8 }}>
            Salida: {formatDateTime(trip.departure_at)}
            <br />
            Llegada estimada: {formatDateTime(trip.arrival_at)}
          </div>
          {trip.status === 'ACTIVE' && (
            <Link to="/app/escanear" className="btn big" style={{ marginTop: 16 }}>
              Empezar a escanear
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
