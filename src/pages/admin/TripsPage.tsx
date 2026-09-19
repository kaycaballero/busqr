import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/results'
import type { Bus, RouteRow, Trip } from '../../types'

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'gray'> = {
  ACTIVE: 'green',
  SCHEDULED: 'yellow',
  FINISHED: 'gray'
}

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [showForm, setShowForm] = useState(false)
  const [routeId, setRouteId] = useState('')
  const [busId, setBusId] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [arrivalAt, setArrivalAt] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [t, r, b] = await Promise.all([
      supabase.from('trips').select('*, routes(*), buses(*)').order('departure_at', { ascending: false }),
      supabase.from('routes').select('*').eq('active', true).order('name'),
      supabase.from('buses').select('*').eq('active', true).order('plate')
    ])
    setTrips((t.data as Trip[]) || [])
    setRoutes((r.data as RouteRow[]) || [])
    setBuses((b.data as Bus[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('trips').insert({
      route_id: routeId,
      bus_id: busId,
      departure_at: new Date(departureAt).toISOString(),
      arrival_at: new Date(arrivalAt).toISOString()
    })
    setSaving(false)
    if (error) {
      alert('No se pudo crear el viaje.')
      return
    }
    setShowForm(false)
    setRouteId('')
    setBusId('')
    setDepartureAt('')
    setArrivalAt('')
    load()
  }

  async function setStatus(t: Trip, status: 'ACTIVE' | 'FINISHED' | 'SCHEDULED') {
    const patch: Record<string, unknown> = { status }
    if (status === 'ACTIVE') patch.started_at = new Date().toISOString()
    if (status === 'FINISHED') patch.finished_at = new Date().toISOString()
    await supabase.from('trips').update(patch).eq('id', t.id)
    load()
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Viajes</h1>
          <p className="subtitle" style={{ margin: 0 }}>Crea viajes, ábrelos para abordaje y asigna operadores.</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Nuevo viaje</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Ruta</th><th>Bus</th><th>Salida</th><th>Llegada</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td>{t.routes?.origin} → {t.routes?.destination}</td>
                <td>{t.buses?.plate}</td>
                <td>{formatDateTime(t.departure_at)}</td>
                <td>{formatDateTime(t.arrival_at)}</td>
                <td><Badge color={STATUS_COLOR[t.status]}>{t.status}</Badge></td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Link className="btn secondary" to={`/admin/viajes/${t.id}`}>Detalle</Link>
                  {t.status === 'SCHEDULED' && <button className="btn" onClick={() => setStatus(t, 'ACTIVE')}>Activar</button>}
                  {t.status === 'ACTIVE' && <button className="btn danger" onClick={() => setStatus(t, 'FINISHED')}>Finalizar</button>}
                </td>
              </tr>
            ))}
            {trips.length === 0 && <tr><td colSpan={6}>Todavía no hay viajes.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo viaje" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Ruta</label>
              <select className="input" required value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                <option value="">Selecciona una ruta</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Bus</label>
              <select className="input" required value={busId} onChange={(e) => setBusId(e.target.value)}>
                <option value="">Selecciona un bus</option>
                {buses.map((b) => <option key={b.id} value={b.id}>{b.plate}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Fecha y hora de salida</label>
              <input className="input" type="datetime-local" required value={departureAt} onChange={(e) => setDepartureAt(e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha y hora estimada de llegada</label>
              <input className="input" type="datetime-local" required value={arrivalAt} onChange={(e) => setArrivalAt(e.target.value)} />
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={saving}>{saving ? 'Creando...' : 'Crear viaje'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
