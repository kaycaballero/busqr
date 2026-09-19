import { useEffect, useRef } from 'react'

// Mantiene la pantalla encendida mientras el componente está montado (si el navegador lo soporta).
export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function requestLock() {
      try {
        if ('wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen')
          if (!cancelled) {
            lockRef.current = lock
          } else {
            lock.release()
          }
        }
      } catch {
        // Silencioso: no todos los navegadores lo soportan.
      }
    }

    requestLock()

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        requestLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      lockRef.current?.release?.().catch(() => {})
      lockRef.current = null
    }
  }, [enabled])
}
