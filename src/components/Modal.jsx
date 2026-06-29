export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} rounded-2xl bg-white p-6 shadow-2xl border border-transparent animate-modal-pop transition-colors duration-300`}>
        {title && (
          <h2 className="mb-5 text-lg font-bold text-gray-900">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
