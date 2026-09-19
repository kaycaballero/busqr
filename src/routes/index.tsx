import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

import { LoginPage } from '../pages/public/LoginPage'
import { RegisterPage } from '../pages/public/RegisterPage'
import { PendingPage } from '../pages/public/PendingPage'

import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/operator/HomePage'
import { ScanPage } from '../pages/operator/ScanPage'
import { TripPage } from '../pages/operator/TripPage'
import { RecordsPage } from '../pages/operator/RecordsPage'

import { AdminLayout } from '../components/layout/AdminLayout'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { PassengersPage } from '../pages/admin/PassengersPage'
import { TicketsPage } from '../pages/admin/TicketsPage'
import { RoutesPage } from '../pages/admin/RoutesPage'
import { BusesPage } from '../pages/admin/BusesPage'
import { TripsPage } from '../pages/admin/TripsPage'
import { TripDetailPage } from '../pages/admin/TripDetailPage'
import { ValidationsPage } from '../pages/admin/ValidationsPage'
import { UsersPage } from '../pages/admin/UsersPage'
import { StatsPage } from '../pages/admin/StatsPage'

function FullPageLoader() {
  return <div className="center-page">Cargando...</div>
}

function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireActive() {
  const { profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!profile || !profile.active) return <Navigate to="/pendiente" replace />
  return <Outlet />
}

function RequireAdmin() {
  const { profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!profile || profile.role !== 'admin' || !profile.active) return <Navigate to="/app" replace />
  return <Outlet />
}

function RoleHome() {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/app" replace />
}

export function AppRoutes() {
  const { session, profile, loading } = useAuth()

  if (loading) return <FullPageLoader />

  return (
    <Routes>
      <Route path="/login" element={session ? <RoleHome /> : <LoginPage />} />
      <Route path="/registro" element={session ? <RoleHome /> : <RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/pendiente" element={profile?.active ? <RoleHome /> : <PendingPage />} />

        <Route element={<RequireActive />}>
          <Route path="/" element={<RoleHome />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="escanear" element={<ScanPage />} />
            <Route path="viaje" element={<TripPage />} />
            <Route path="registros" element={<RecordsPage />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="pasajeros" element={<PassengersPage />} />
              <Route path="boletos" element={<TicketsPage />} />
              <Route path="rutas" element={<RoutesPage />} />
              <Route path="buses" element={<BusesPage />} />
              <Route path="viajes" element={<TripsPage />} />
              <Route path="viajes/:id" element={<TripDetailPage />} />
              <Route path="validaciones" element={<ValidationsPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="estadisticas" element={<StatsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<div className="center-page"><div><h1>404</h1><p>Página no encontrada.</p></div></div>} />
    </Routes>
  )
}
