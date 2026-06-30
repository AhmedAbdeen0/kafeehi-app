import { NavLink } from 'react-router-dom'
import {
  Calculator,
  Coffee,
  Package,
  BarChart3,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getArabicDate, getStockStatus } from '../data/mockData'

const navItems = [
  { to: '/', label: 'الكاشير', icon: Calculator },
  { to: '/menu', label: 'المنيو', icon: Coffee },
  { to: '/inventory', label: 'المخزون', icon: Package },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { resetData, inventory, getPendingCustomerOrders, darkMode, toggleDarkMode } = useApp()
  const lowStockCount = inventory.filter((i) => getStockStatus(i.quantity, i.alertLimit).label === 'منخفض').length
  const pendingCount = getPendingCustomerOrders().length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-56 flex-col bg-sidebar text-gray-700 transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
      <div className="border-b border-cream-dark px-5 py-6">
        <h1 className="text-xl font-bold text-gray-900">كافيهي</h1>
        <p className="mt-1 text-xs text-gray-500">{getArabicDate()}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => user?.role !== 'cashier' || item.to === '/')
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 hover:-translate-x-1.5 active-press ${
                  isActive
                    ? 'bg-sidebar-active font-bold text-gray-900 active'
                    : 'hover:bg-sidebar-hover text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l bg-accent" />
                  )}
                  <Icon size={18} className={isActive ? 'text-accent' : 'text-gray-500'} />
                  <span className="flex-1">{label}</span>
                  {to === '/' && user?.role !== 'admin' && pendingCount > 0 && (
                    <span className="relative flex h-5 w-5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-cream-dark px-4 py-4">
        {user && (
          <div className="mb-3 rounded-lg bg-sidebar-hover px-3 py-2">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="mt-0.5 text-xs text-accent font-semibold">{user.role === 'admin' ? 'مدير' : 'كاشير'}</p>
          </div>
        )}
        {/* Shift status removed */}
        {lowStockCount > 0 && (
          <p className="mt-2 text-center text-xs text-orange-600 dark:text-orange-300 font-semibold">
            ⚠ {lowStockCount} خامة منخفضة المخزون
          </p>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={resetData}
            className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-700 transition-colors active-press"
          >
            إعادة ضبط البيانات
          </button>
        )}
        <button
          onClick={toggleDarkMode}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cream-dark py-2 text-xs font-semibold text-gray-650 hover:bg-sidebar-hover active-press"
        >
          {darkMode ? <Sun size={14} className="text-amber-500 animate-pulse" /> : <Moon size={14} />}
          {darkMode ? 'المظهر الفاتح' : 'المظهر الداكن'}
        </button>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cream-dark py-2 text-xs font-semibold text-gray-650 hover:bg-sidebar-hover active-press"
        >
          <LogOut size={14} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
    </>
  )
}
