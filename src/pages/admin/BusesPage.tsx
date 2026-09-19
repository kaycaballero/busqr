import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import type { Bus } from '../../types'

export function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [showForm, setShowForm] = useState(false)
  const [plate, setPlate] = useState('')
  const [code, setCode] = useState('')
  const [capacity, setCapacity] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('buses').select('*').order('plate')
    setBuses((data as Bus[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('buses').insert({
      plate,
      code: code || null,
      capacity: capacity ? Number(capacity) : null
    })
    setSaving(false)
    if (error) {
      setError('No se pudo guardar. ¿La placa ya existe?')
      return
    }
    setShowForm(false)
    setPlate('')
    setCode('')
    setCapacity('')
    load()
  }

  async function toggleActive(b: Bus) {
    await supabase.from('buses').update({ active: !b.active }).eq('id', b.id)
    load()
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Buses</h1>
          <p className="subtitle" style={{ margin: 0 }}>Flota disponible para asignar a viajes.</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Nuevo bus</button>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Placa</th><th>Código</th><th>Capacidad</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b.id}>
                <td>{b.plate}</td>
                <td>{b.code || '—'}</td>
                <td>{b.capacity ?? '—'}</td>
                <td><Badge color={b.active ? 'green' : 'gray'}>{b.active ? 'Activo' : 'Inactivo'}</Badge></td>
                <td><button className="btn secondary" onClick={() => toggleActive(b)}>{b.active ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
            {buses.length === 0 && <tr><td colSpan={5}>Todavía no hay buses.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo bus" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Placa</label>
              <input className="input" required value={plate} onChange={(e) => setPlate(e.target.value)} />
            </div>
            <div className="field">
              <label>Código interno (opcional)</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="field">
              <label>Capacidad (opcional, informativa)</label>
              <input className="input" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" style={{ width: '100%' }} disabled={saving}>{saving ? 'Guardando...' : 'Guardar bus'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
