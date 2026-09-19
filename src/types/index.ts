export type UserRole = 'admin' | 'operator'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
  created_at: string
}

export type TripStatus = 'SCHEDULED' | 'ACTIVE' | 'FINISHED'
export type TicketStatus = 'AVAILABLE' | 'USED' | 'CANCELLED'
export type BoardingKind = 'BOARDING' | 'REENTRY'

export type ValidationResult =
  | 'AUTHORIZED'
  | 'ALREADY_USED'
  | 'EXPIRED'
  | 'INVALID_CODE'
  | 'WRONG_TRIP'
  | 'TRIP_NOT_ACTIVE'
  | 'CANCELLED'
  | 'PASSENGER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'SYSTEM_ERROR'

export interface Passenger {
  id: string
  full_name: string
  document_number: string
  phone: string | null
  email: string | null
  active: boolean
  created_at: string
}

export interface RouteRow {
  id: string
  name: string
  origin: string
  destination: string
  active: boolean
}

export interface Bus {
  id: string
  plate: string
  code: string | null
  capacity: number | null
  active: boolean
}

export interface Trip {
  id: string
  route_id: string
  bus_id: string
  departure_at: string
  arrival_at: string
  status: TripStatus
  started_at: string | null
  finished_at: string | null
  created_at: string
  routes?: RouteRow
  buses?: Bus
}

export interface TripAssignment {
  trip_id: string
  user_id: string
  profiles?: Profile
}

export interface Ticket {
  id: string
  ticket_number: string
  code: string
  passenger_id: string
  trip_id: string
  status: TicketStatus
  used_at: string | null
  created_at: string
  created_by: string | null
  passengers?: Passenger
  trips?: Trip
}

export interface BoardingRecord {
  id: string
  ticket_id: string
  passenger_id: string
  trip_id: string
  route_id: string
  bus_id: string
  operator_id: string
  kind: BoardingKind
  validation_log_id: string | null
  latitude: number | null
  longitude: number | null
  boarded_at: string
}

export interface ValidationLog {
  id: string
  scanned_at: string
  operator_id: string
  received_code: string
  ticket_id: string | null
  passenger_id: string | null
  trip_id: string | null
  route_id: string | null
  bus_id: string | null
  assigned_trip_id: string | null
  result: ValidationResult
  latitude: number | null
  longitude: number | null
  details: Record<string, unknown> | null
  confirmed_at: string | null
}

export interface ValidateTicketResponse {
  result: ValidationResult
  validation_log_id: string
  ticket_number?: string
  passenger_name?: string
  details?: Record<string, unknown>
  message?: string
}

export interface ConfirmBoardingResponse {
  result: ValidationResult | 'OK'
  already_confirmed?: boolean
  passenger_name?: string
  message?: string
  boarding_id?: string
}
