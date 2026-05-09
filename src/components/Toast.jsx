import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ICONS = { success: CheckCircle, error: XCircle, info: Info }
  const COLORS = {
    success: 'border-green-100 bg-white text-green-700',
    error:   'border-red-100 bg-white text-red-700',
    info:    'border-border bg-white text-text-primary',
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-md text-sm font-medium ${COLORS[t.type]} animate-in`}>
              <Icon size={15} />
              <span>{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="ml-2 opacity-40 hover:opacity-80">
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
