import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

export default function UserLayout() {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-cream text-gray-800 transition-colors duration-300 overflow-hidden">
      {/* Background Neon Blobs for Dark Mode Ambient Light */}
      <div className="absolute top-[-100px] right-[-100px] glow-blob"></div>
      <div className="absolute bottom-[-80px] left-[-80px] glow-blob-secondary"></div>
      <header className="flex items-center justify-between border-b border-cream-dark bg-white px-6 py-4 transition-colors duration-300">
        <div>
          <h1 className="text-xl font-bold text-sidebar dark:text-accent">كافيهي ☕</h1>
          <p className="text-xs text-gray-500 dark:text-white/60">اطلب من طاولتك</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{user?.name}</span>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#f9f4ef] hover:bg-gray-50 dark:hover:bg-white/5 transition-all active-press"
          >
            {darkMode ? <Sun size={14} className="text-amber-400 animate-pulse" /> : <Moon size={14} />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs text-gray-600 dark:text-[#f9f4ef] hover:bg-gray-50 dark:hover:bg-white/5 transition-all active-press"
          >
            <LogOut size={14} />
            خروج
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
