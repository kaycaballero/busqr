import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import type { Passenger } from '../../types'

export function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('passengers').select('*').order('created_at', { ascending: false })
    setPassengers((data as Passenger[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('passengers').insert({
      full_name: fullName,
      document_number: document,
      phone: phone || null,
      email: email || null
    })
    setSaving(false)
    setShowForm(false)
    setFullName('')
    setDocument('')
    setPhone('')
    setEmail('')
    load()
  }

  async function toggleActive(p: Passenger) {
    await supabase.from('passengers').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  const filtered = passengers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.document_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Pasajeros</h1>
          <p className="subtitle" style={{ margin: 0 }}>Base de datos de pasajeros para emitir boletos.</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Nuevo pasajero</button>
      </div>

      <input
        className="input"
        placeholder="Buscar por nombre o documento..."
        style={{ marginBottom: 14, maxWidth: 320 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.document_number}</td>
                <td>{p.phone || '—'}</td>
                <td>{p.email || '—'}</td>
                <td><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Activo' : 'Inactivo'}</Badge></td>
                <td><button className="btn secondary" onClick={() => toggleActive(p)}>{p.active ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6}>No se encontraron pasajeros.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo pasajero" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Nombre completo</label>
              <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label>Número de documento</label>
              <input className="input" required value={document} onChange={(e) => setDocument(e.target.value)} />
            </div>
            <div className="field">
              <label>Teléfono (opcional)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field">
              <label>Correo (opcional)</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={saving}>{saving ? 'Guardando...' : 'Guardar pasajero'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
