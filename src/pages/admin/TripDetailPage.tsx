import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/results'
import type { BoardingRecord, Profile, Ticket, Trip } from '../../types'

const TICKET_COLOR: Record<string, 'green' | 'red' | 'gray'> = {
  AVAILABLE: 'green',
  USED: 'gray',
  CANCELLED: 'red'
}

export function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [boardings, setBoardings] = useState<BoardingRecord[]>([])
  const [operators, setOperators] = useState<Profile[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])

  async function load() {
    if (!id) return
    const [t, tk, br, ops, assigns] = await Promise.all([
      supabase.from('trips').select('*, routes(*), buses(*)').eq('id', id).single(),
      supabase.from('tickets').select('*, passengers(*)').eq('trip_id', id).order('created_at', { ascending: false }),
      supabase.from('boarding_records').select('*').eq('trip_id', id).order('boarded_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'operator').eq('active', true).order('full_name'),
      supabase.from('trip_assignments').select('user_id').eq('trip_id', id)
    ])
    setTrip(t.data as Trip)
    setTickets((tk.data as Ticket[]) || [])
    setBoardings((br.data as BoardingRecord[]) || [])
    setOperators((ops.data as Profile[]) || [])
    setAssignedIds(((assigns.data as { user_id: string }[]) || []).map((a) => a.user_id))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function toggleAssign(userId: string) {
    if (!id) return
    if (assignedIds.includes(userId)) {
      await supabase.from('trip_assignments').delete().eq('trip_id', id).eq('user_id', userId)
    } else {
      await supabase.from('trip_assignments').insert({ trip_id: id, user_id: userId })
    }
    load()
  }

  if (!trip) return <div className="page">Cargando...</div>

  const usedCount = tickets.filter((t) => t.status === 'USED').length

  return (
    <div className="page">
      <Link to="/admin/viajes" style={{ fontSize: 13 }}>← Volver a viajes</Link>
      <h1 style={{ marginBottom: 2 }}>{trip.routes?.origin} → {trip.routes?.destination}</h1>
      <p className="subtitle">
        Bus {trip.buses?.plate} · Salida {formatDateTime(trip.departure_at)} · Llegada {formatDateTime(trip.arrival_at)} · <Badge color={trip.status === 'ACTIVE' ? 'green' : trip.status === 'FINISHED' ? 'gray' : 'yellow'}>{trip.status}</Badge>
      </p>

      <div className="stat-grid">
        <div className="stat-card"><div className="value">{tickets.length}</div><div className="label">Boletos emitidos</div></div>
        <div className="stat-card"><div className="value">{usedCount}</div><div className="label">Abordajes confirmados</div></div>
        <div className="stat-card"><div className="value">{boardings.filter((b) => b.kind === 'REENTRY').length}</div><div className="label">Reingresos</div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Operadores asignados a este viaje</h3>
        {operators.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay operadores activos todavía. Actívalos en Usuarios.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {operators.map((o) => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={assignedIds.includes(o.id)} onChange={() => toggleAssign(o.id)} />
              {o.full_name || o.email}
            </label>
          ))}
        </div>
      </div>

      <div className="card table-wrap" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Boletos del viaje</h3>
        <table className="data">
          <thead><tr><th>N.° boleto</th><th>Pasajero</th><th>Estado</th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.ticket_number}</td>
                <td>{t.passengers?.full_name}</td>
                <td><Badge color={TICKET_COLOR[t.status]}>{t.status}</Badge></td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={3}>No hay boletos para este viaje.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h3 style={{ marginTop: 0 }}>Abordajes registrados</h3>
        <table className="data">
          <thead><tr><th>Tipo</th><th>Hora</th></tr></thead>
          <tbody>
            {boardings.map((b) => (
              <tr key={b.id}>
                <td><Badge color={b.kind === 'BOARDING' ? 'green' : 'yellow'}>{b.kind === 'BOARDING' ? 'Abordaje' : 'Reingreso'}</Badge></td>
                <td>{formatDateTime(b.boarded_at)}</td>
              </tr>
            ))}
            {boardings.length === 0 && <tr><td colSpan={2}>Todavía no hay abordajes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
