import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getHomePath(role) {
  return role === 'admin' || role === 'cashier' ? '/' : '/order'
}

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-cream dark:bg-[#1A1613]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
    </div>
  )
}

export function StaffRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role !== 'admin' && user.role !== 'cashier') return <Navigate to="/order" replace />

  return <Outlet />
}

export function AdminRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role === 'cashier') return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/order" replace />

  return <Outlet />
}

export function UserRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role === 'admin' || user.role === 'cashier') return <Navigate to="/" replace />

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (isAuthenticated) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return <Outlet />
}
