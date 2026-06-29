import { Link } from 'react-router-dom'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream text-gray-800 p-4 transition-colors duration-300">
      <div className="w-full max-w-md animate-page-fade">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sidebar dark:text-accent">كافيهي ☕</h1>
          <p className="mt-1 text-sm text-gray-500">نظام إدارة الكافيه</p>
        </div>

        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-2xl transition-colors duration-300">
          <h2 className="mb-1 text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mb-6 text-sm text-gray-500">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthLink({ to, prefix, linkText }) {
  return (
    <p className="mt-6 text-center text-sm text-gray-500">
      {prefix}{' '}
      <Link to={to} className="font-medium text-accent hover:text-accent-hover">
        {linkText}
      </Link>
    </p>
  )
}
