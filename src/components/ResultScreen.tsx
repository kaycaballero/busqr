import { RESULT_INFO } from '../lib/results'
import type { ValidateTicketResponse } from '../types'

export function ResultScreen({
  response,
  onConfirm,
  onReentry,
  onNext,
  confirming
}: {
  response: ValidateTicketResponse
  onConfirm: () => void
  onReentry: () => void
  onNext: () => void
  confirming: boolean
}) {
  const info = RESULT_INFO[response.result]

  return (
    <div className={`result-screen ${info.color}`}>
      <div className="result-label">{info.label}</div>
      {response.passenger_name && <div className="result-name">{response.passenger_name}</div>}
      {response.ticket_number && <div style={{ opacity: 0.85, marginBottom: 6 }}>Boleto {response.ticket_number}</div>}
      <div className="result-desc">{response.message || info.description}</div>

      <div className="result-actions">
        {response.result === 'AUTHORIZED' && (
          <button className="btn big secondary" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Confirmando...' : 'Confirmar abordaje'}
          </button>
        )}
        {response.result === 'ALREADY_USED' && (
          <button className="btn big secondary" onClick={onReentry}>
            Registrar reingreso
          </button>
        )}
        <button className="btn big" style={{ background: 'rgba(255,255,255,0.2)' }} onClick={onNext}>
          Siguiente escaneo
        </button>
      </div>
    </div>
  )
}
