import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex h-screen overflow-hidden bg-cream text-gray-800 transition-colors duration-300">
      {/* Background Neon Blobs for Dark Mode Ambient Light */}
      <div className="absolute top-[-100px] right-[-100px] glow-blob"></div>
      <div className="absolute bottom-[-80px] left-[-80px] glow-blob-secondary"></div>

      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-cream-dark bg-white px-4 py-3 md:hidden shrink-0">
          <h1 className="text-lg font-bold text-sidebar dark:text-accent">كافيهي ☕</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-[#f9f4ef] dark:hover:bg-white/5 active-press transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
