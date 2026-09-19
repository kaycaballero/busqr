import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { QrCodeDisplay } from '../../components/QrCodeDisplay'
import { downloadCsv } from '../../lib/csv'
import { formatDateTime } from '../../lib/results'
import type { Passenger, Ticket, Trip } from '../../types'

const STATUS_COLOR: Record<string, 'green' | 'red' | 'gray'> = {
  AVAILABLE: 'green',
  USED: 'gray',
  CANCELLED: 'red'
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)
  const [passengerId, setPassengerId] = useState('')
  const [tripId, setTripId] = useState('')
  const [saving, setSaving] = useState(false)
  const [newTicket, setNewTicket] = useState<Ticket | null>(null)

  async function load() {
    const [t, p, tr] = await Promise.all([
      supabase.from('tickets').select('*, passengers(*), trips(*, routes(*), buses(*))').order('created_at', { ascending: false }),
      supabase.from('passengers').select('*').eq('active', true).order('full_name'),
      supabase.from('trips').select('*, routes(*), buses(*)').order('departure_at', { ascending: false })
    ])
    setTickets((t.data as Ticket[]) || [])
    setPassengers((p.data as Passenger[]) || [])
    setTrips((tr.data as Trip[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase
      .from('tickets')
      .insert({ passenger_id: passengerId, trip_id: tripId })
      .select()
      .single()
    setSaving(false)
    if (error) {
      alert('No se pudo crear el boleto.')
      return
    }
    setShowForm(false)
    setPassengerId('')
    setTripId('')
    setNewTicket(data as Ticket)
    load()
  }

  async function cancelTicket(t: Ticket) {
    if (!confirm(`¿Cancelar el boleto ${t.ticket_number}?`)) return
    await supabase.from('tickets').update({ status: 'CANCELLED' }).eq('id', t.id)
    load()
  }

  function exportCsv() {
    downloadCsv(
      'boletos.csv',
      tickets.map((t) => ({
        ticket_number: t.ticket_number,
        code: t.code,
        pasajero: t.passengers?.full_name,
        documento: t.passengers?.document_number,
        viaje: `${t.trips?.routes?.origin} - ${t.trips?.routes?.destination}`,
        bus: t.trips?.buses?.plate,
        estado: t.status,
        creado: t.created_at
      }))
    )
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Boletos</h1>
          <p className="subtitle" style={{ margin: 0 }}>Emisión y control de boletos por viaje.</p>
        </div>
        <div className="toolbar-actions">
          <button className="btn secondary" onClick={exportCsv}>Exportar CSV</button>
          <button className="btn" onClick={() => setShowForm(true)}>+ Nuevo boleto</button>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>N.° boleto</th><th>Pasajero</th><th>Viaje</th><th>Bus</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.ticket_number}</td>
                <td>{t.passengers?.full_name}</td>
                <td>{t.trips?.routes?.origin} → {t.trips?.routes?.destination}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(t.trips?.departure_at)}</span></td>
                <td>{t.trips?.buses?.plate}</td>
                <td><Badge color={STATUS_COLOR[t.status]}>{t.status}</Badge></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn secondary" onClick={() => setNewTicket(t)}>Ver QR</button>
                  {t.status === 'AVAILABLE' && (
                    <button className="btn danger" onClick={() => cancelTicket(t)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={6}>Todavía no hay boletos.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo boleto" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Pasajero</label>
              <select className="input" required value={passengerId} onChange={(e) => setPassengerId(e.target.value)}>
                <option value="">Selecciona un pasajero</option>
                {passengers.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} — {p.document_number}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Viaje</label>
              <select className="input" required value={tripId} onChange={(e) => setTripId(e.target.value)}>
                <option value="">Selecciona un viaje</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.routes?.origin} → {t.routes?.destination} · {formatDateTime(t.departure_at)} · Bus {t.buses?.plate}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={saving}>{saving ? 'Creando...' : 'Crear boleto'}</button>
          </form>
        </Modal>
      )}

      {newTicket && (
        <Modal title={`Boleto ${newTicket.ticket_number}`} onClose={() => setNewTicket(null)}>
          <QrCodeDisplay value={newTicket.code} label="Este QR se imprime o se muestra al pasajero." />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
            Código: {newTicket.code}
          </p>
        </Modal>
      )}
    </div>
  )
}
