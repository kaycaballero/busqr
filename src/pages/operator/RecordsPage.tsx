import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { RESULT_INFO, formatDateTime } from '../../lib/results'
import { Badge } from '../../components/ui/Badge'
import type { ValidationLog } from '../../types'

export function RecordsPage() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<ValidationLog[]>([])

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data } = await supabase
        .from('validation_logs')
        .select('*')
        .eq('operator_id', profile.id)
        .order('scanned_at', { ascending: false })
        .limit(100)
      setLogs((data as ValidationLog[]) || [])
    }
    load()
  }, [profile])

  return (
    <div>
      <h2 style={{ marginTop: 0, color: 'white' }}>Mis registros</h2>
      {logs.length === 0 && <p style={{ color: '#94a3b8' }}>Todavía no has escaneado boletos.</p>}
      {logs.map((l) => {
        const info = RESULT_INFO[l.result]
        return (
          <div key={l.id} className="card" style={{ background: '#1e293b', border: 'none', color: 'white', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge color={info.color}>{info.label}</Badge>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDateTime(l.scanned_at)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Código: {l.received_code}</div>
          </div>
        )
      })}
    </div>
  )
}
