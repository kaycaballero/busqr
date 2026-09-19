import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/results'
import { useAuth } from '../../hooks/useAuth'
import type { Profile } from '../../types'

export function UsersPage() {
  const { profile: myProfile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleActive(u: Profile) {
    await supabase.from('profiles').update({ active: !u.active }).eq('id', u.id)
    load()
  }

  async function toggleRole(u: Profile) {
    const newRole = u.role === 'admin' ? 'operator' : 'admin'
    if (!confirm(`¿Cambiar el rol de ${u.full_name || u.email} a ${newRole === 'admin' ? 'Administrador' : 'Operador'}?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
    load()
  }

  return (
    <div className="page">
      <h1>Usuarios</h1>
      <p className="subtitle">Activa a los operadores que se registran y gestiona sus roles.</p>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Registrado</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === myProfile?.id
              return (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td><Badge color={u.role === 'admin' ? 'green' : 'gray'}>{u.role === 'admin' ? 'Administrador' : 'Operador'}</Badge></td>
                  <td><Badge color={u.active ? 'green' : 'yellow'}>{u.active ? 'Activo' : 'Pendiente'}</Badge></td>
                  <td>{formatDateTime(u.created_at)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" disabled={isMe} onClick={() => toggleActive(u)}>
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn secondary" disabled={isMe} onClick={() => toggleRole(u)}>
                      Hacer {u.role === 'admin' ? 'operador' : 'admin'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && <tr><td colSpan={6}>No hay usuarios todavía.</td></tr>}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        No puedes activarte, desactivarte ni cambiar tu propio rol desde aquí.
      </p>
    </div>
  )
}
