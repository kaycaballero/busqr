import type { ValidationResult } from '../types'

export const RESULT_INFO: Record<
  ValidationResult,
  { label: string; color: 'green' | 'red' | 'yellow'; description: string }
> = {
  AUTHORIZED: { label: 'AUTORIZADO', color: 'green', description: 'El boleto es válido para este viaje.' },
  ALREADY_USED: { label: 'YA USADO', color: 'red', description: 'Este boleto ya fue abordado antes.' },
  EXPIRED: { label: 'VENCIDO', color: 'red', description: 'El viaje ya finalizó o pasó su hora de llegada.' },
  INVALID_CODE: { label: 'CÓDIGO INVÁLIDO', color: 'red', description: 'El código escaneado no existe.' },
  WRONG_TRIP: { label: 'OTRO VIAJE', color: 'red', description: 'Este boleto pertenece a otro viaje.' },
  TRIP_NOT_ACTIVE: { label: 'VIAJE NO ACTIVO', color: 'red', description: 'El administrador aún no abrió el abordaje.' },
  CANCELLED: { label: 'CANCELADO', color: 'red', description: 'Este boleto fue cancelado.' },
  PASSENGER_NOT_FOUND: { label: 'PASAJERO NO VÁLIDO', color: 'red', description: 'El pasajero no está activo.' },
  UNAUTHORIZED: { label: 'SIN AUTORIZACIÓN', color: 'yellow', description: 'Tu usuario no tiene un viaje asignado o está inactivo.' },
  SYSTEM_ERROR: { label: 'ERROR', color: 'yellow', description: 'Ocurrió un error inesperado.' }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}
