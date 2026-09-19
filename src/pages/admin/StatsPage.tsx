import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ValidationLog } from '../../types'
import { RESULT_INFO } from '../../lib/results'

export function StatsPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([])
  const [operators, setOperators] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const [l, p] = await Promise.all([
        supabase.from('validation_logs').select('*').order('scanned_at', { ascending: false }).limit(1000),
        supabase.from('profiles').select('id, full_name, email')
      ])
      setLogs((l.data as ValidationLog[]) || [])
      const map: Record<string, string> = {}
      ;((p.data as { id: string; full_name: string; email: string }[]) || []).forEach((u) => {
        map[u.id] = u.full_name || u.email
      })
      setOperators(map)
    }
    load()
  }, [])

  const totalsByResult: Record<string, number> = {}
  logs.forEach((l) => {
    totalsByResult[l.result] = (totalsByResult[l.result] || 0) + 1
  })

  const totalsByOperator: Record<string, { total: number; invalid: number }> = {}
  logs.forEach((l) => {
    const key = l.operator_id
    if (!totalsByOperator[key]) totalsByOperator[key] = { total: 0, invalid: 0 }
    totalsByOperator[key].total += 1
    if (l.result !== 'AUTHORIZED' && l.result !== 'ALREADY_USED') totalsByOperator[key].invalid += 1
  })

  return (
    <div className="page">
      <h1>Estadísticas</h1>
      <p className="subtitle">Resumen de escaneos por resultado y por operador.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Escaneos por resultado</h3>
        <div className="stat-grid">
          {Object.entries(RESULT_INFO).map(([key, info]) => (
            <div className="stat-card" key={key}>
              <div className="value">{totalsByResult[key] || 0}</div>
              <div className="label">{info.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        <h3 style={{ marginTop: 0 }}>Actividad por operador</h3>
        <table className="data">
          <thead><tr><th>Operador</th><th>Escaneos totales</th><th>Intentos inválidos</th></tr></thead>
          <tbody>
            {Object.entries(totalsByOperator).map(([opId, v]) => (
              <tr key={opId}>
                <td>{operators[opId] || opId}</td>
                <td>{v.total}</td>
                <td>{v.invalid}</td>
              </tr>
            ))}
            {Object.keys(totalsByOperator).length === 0 && <tr><td colSpan={3}>Todavía no hay actividad registrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
