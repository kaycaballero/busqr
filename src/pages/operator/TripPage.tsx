import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../lib/results'
import type { Trip } from '../../types'

export function TripPage() {
  const { profile } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data } = await supabase
        .from('trip_assignments')
        .select('trips(*, routes(*), buses(*))')
        .eq('user_id', profile.id)
      const list = (data || []).map((a: any) => a.trips as Trip).filter(Boolean)
      list.sort((a, b) => new Date(b.departure_at).getTime() - new Date(a.departure_at).getTime())
      setTrips(list)
    }
    load()
  }, [profile])

  return (
    <div>
      <h2 style={{ marginTop: 0, color: 'white' }}>Mis viajes asignados</h2>
      {trips.length === 0 && <p style={{ color: '#94a3b8' }}>No tienes viajes asignados.</p>}
      {trips.map((t) => (
        <div key={t.id} className="card" style={{ background: '#1e293b', border: 'none', color: 'white', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#93c5fd' }}>{t.status}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {t.routes?.origin} → {t.routes?.destination}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 13 }}>Bus {t.buses?.plate}</div>
          <div style={{ color: '#cbd5e1', fontSize: 13 }}>
            Salida {formatDateTime(t.departure_at)} · Llegada {formatDateTime(t.arrival_at)}
          </div>
        </div>
      ))}
    </div>
  )
}
