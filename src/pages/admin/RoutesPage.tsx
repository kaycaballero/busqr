import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import type { RouteRow } from '../../types'

export function RoutesPage() {
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('routes').select('*').order('name')
    setRoutes((data as RouteRow[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('routes').insert({ name, origin, destination })
    setSaving(false)
    setShowForm(false)
    setName('')
    setOrigin('')
    setDestination('')
    load()
  }

  async function toggleActive(r: RouteRow) {
    await supabase.from('routes').update({ active: !r.active }).eq('id', r.id)
    load()
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Rutas</h1>
          <p className="subtitle" style={{ margin: 0 }}>Orígenes y destinos que usarán tus viajes.</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Nueva ruta</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Nombre</th><th>Origen</th><th>Destino</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.origin}</td>
                <td>{r.destination}</td>
                <td><Badge color={r.active ? 'green' : 'gray'}>{r.active ? 'Activa' : 'Inactiva'}</Badge></td>
                <td><button className="btn secondary" onClick={() => toggleActive(r)}>{r.active ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
            {routes.length === 0 && <tr><td colSpan={5}>Todavía no hay rutas.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nueva ruta" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Nombre de la ruta</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cochabamba - Santa Cruz" />
            </div>
            <div className="field">
              <label>Origen</label>
              <input className="input" required value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            <div className="field">
              <label>Destino</label>
              <input className="input" required value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={saving}>{saving ? 'Guardando...' : 'Guardar ruta'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
