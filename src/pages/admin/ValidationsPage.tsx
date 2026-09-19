import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RESULT_INFO, formatDateTime } from '../../lib/results'
import { Badge } from '../../components/ui/Badge'
import { downloadCsv } from '../../lib/csv'
import type { ValidationLog } from '../../types'

export function ValidationsPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([])
  const [filter, setFilter] = useState('')

  async function load() {
    const { data } = await supabase
      .from('validation_logs')
      .select('*')
      .order('scanned_at', { ascending: false })
      .limit(300)
    setLogs((data as ValidationLog[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = filter ? logs.filter((l) => l.result === filter) : logs

  function exportCsv() {
    downloadCsv(
      'validaciones.csv',
      filtered.map((l) => ({
        fecha: l.scanned_at,
        resultado: l.result,
        codigo: l.received_code,
        operador_id: l.operator_id,
        confirmado: l.confirmed_at ? 'sí' : 'no'
      }))
    )
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Validaciones</h1>
          <p className="subtitle" style={{ margin: 0 }}>Todos los escaneos realizados por los operadores.</p>
        </div>
        <div className="toolbar-actions">
          <select className="input" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos los resultados</option>
            {Object.entries(RESULT_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
          <button className="btn secondary" onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Fecha</th><th>Resultado</th><th>Código</th><th>Confirmado</th><th>Ubicación</th></tr></thead>
          <tbody>
            {filtered.map((l) => {
              const info = RESULT_INFO[l.result]
              return (
                <tr key={l.id}>
                  <td>{formatDateTime(l.scanned_at)}</td>
                  <td><Badge color={info.color}>{info.label}</Badge></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.received_code}</td>
                  <td>{l.confirmed_at ? 'Sí' : 'No'}</td>
                  <td>{l.latitude && l.longitude ? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}` : '—'}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={5}>No hay registros que coincidan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
