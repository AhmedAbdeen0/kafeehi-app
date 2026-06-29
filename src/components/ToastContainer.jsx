import { useApp } from '../context/AppContext'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useApp()

  if (toasts.length === 0) return null

  const icons = {
    success: <CheckCircle className="text-green-500 shrink-0" size={18} />,
    error: <AlertCircle className="text-red-500 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
    info: <Info className="text-blue-500 shrink-0" size={18} />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200 text-blue-800',
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 flex max-w-sm flex-col gap-2" dir="rtl">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-in ${
            bgColors[toast.type] || bgColors.info
          }`}
          style={{
            animation: 'slideIn 0.3s ease forwards',
          }}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
