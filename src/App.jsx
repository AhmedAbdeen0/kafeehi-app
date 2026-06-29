import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import UserLayout from './components/UserLayout'
import { AdminRoute, UserRoute, GuestRoute, StaffRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CashierPage from './pages/CashierPage'
import MenuPage from './pages/MenuPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import CustomerOrderPage from './pages/CustomerOrderPage'
import ToastContainer from './components/ToastContainer'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<StaffRoute />}>
              <Route element={<Layout />}>
                <Route index element={<CashierPage />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<Layout />}>
                <Route path="menu" element={<MenuPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route element={<UserRoute />}>
              <Route element={<UserLayout />}>
                <Route path="order" element={<CustomerOrderPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}
