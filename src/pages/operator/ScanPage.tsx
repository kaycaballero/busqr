import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { getCurrentPosition } from '../../hooks/useGeolocation'
import { useWakeLock } from '../../hooks/useWakeLock'
import { ResultScreen } from '../../components/ResultScreen'
import type { ConfirmBoardingResponse, ValidateTicketResponse } from '../../types'

const READER_ID = 'qr-reader'

export function ScanPage() {
  const [result, setResult] = useState<ValidateTicketResponse | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCodeRef = useRef<{ code: string; time: number } | null>(null)
  const processingRef = useRef(false)

  useWakeLock(!result)

  useEffect(() => {
    if (result) return

    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras.length) {
          setCameraError('No se encontró ninguna cámara en este dispositivo.')
          return
        }
        const backCamera = cameras.find((c) => /back|rear|trasera/i.test(c.label)) || cameras[cameras.length - 1]
        scanner
          .start(
            backCamera.id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => handleScan(decodedText),
            () => {}
          )
          .catch(() => setCameraError('No se pudo iniciar la cámara. Revisa los permisos.'))
      })
      .catch(() => setCameraError('No se pudo acceder a la cámara. Revisa los permisos del navegador.'))

    return () => {
      scanner.stop().catch(() => {}).finally(() => scanner.clear())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  async function handleScan(code: string) {
    const now = Date.now()
    if (processingRef.current) return
    if (lastCodeRef.current && lastCodeRef.current.code === code && now - lastCodeRef.current.time < 4000) {
      return
    }
    lastCodeRef.current = { code, time: now }
    processingRef.current = true

    if (navigator.vibrate) navigator.vibrate(120)

    const { lat, lon } = await getCurrentPosition()

    const { data, error } = await supabase.rpc('validate_ticket', {
      p_code: code,
      p_lat: lat,
      p_lon: lon
    })

    processingRef.current = false

    if (error) {
      setResult({ result: 'SYSTEM_ERROR', validation_log_id: '', message: 'Sin conexión, reintenta.' } as ValidateTicketResponse)
      return
    }

    setResult(data as ValidateTicketResponse)
  }

  async function handleConfirm() {
    if (!result) return
    setConfirming(true)
    const { data, error } = await supabase.rpc('confirm_boarding', {
      p_validation_log_id: result.validation_log_id
    })
    setConfirming(false)

    if (error) {
      alert('No se pudo confirmar por un problema de conexión. Vuelve a intentar.')
      return
    }

    const response = data as ConfirmBoardingResponse
    if (response.result === 'ALREADY_USED') {
      setResult({ result: 'ALREADY_USED', validation_log_id: result.validation_log_id, message: response.message })
    } else {
      setResult(null)
    }
  }

  async function handleReentry() {
    if (!result) return
    const { lat, lon } = await getCurrentPosition()
    const { error } = await supabase.rpc('register_reentry', {
      p_validation_log_id: result.validation_log_id,
      p_lat: lat,
      p_lon: lon
    })
    if (error) {
      alert('No se pudo registrar el reingreso, revisa tu conexión.')
      return
    }
    setResult(null)
  }

  if (result) {
    return (
      <ResultScreen
        response={result}
        confirming={confirming}
        onConfirm={handleConfirm}
        onReentry={handleReentry}
        onNext={() => setResult(null)}
      />
    )
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, color: 'white' }}>Escanear boleto</h2>
      {cameraError && <div className="error-text">{cameraError}</div>}
      <div className="qr-reader-box">
        <div id={READER_ID} />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
        Apunta la cámara al código QR del boleto.
      </p>
    </div>
  )
}
