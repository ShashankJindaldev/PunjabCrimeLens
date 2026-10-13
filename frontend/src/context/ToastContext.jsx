import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: CheckCircle2, border: 'border-emerald-500/40', iconColor: 'text-emerald-400' },
  error: { icon: AlertTriangle, border: 'border-red-500/40', iconColor: 'text-red-400' },
  info: { icon: Info, border: 'border-cyan-500/40', iconColor: 'text-cyan-400' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant, title, message, duration = 4500) => {
      const id = ++idRef.current
      setToasts((current) => [...current, { id, variant, title, message }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message, 7000),
      info: (title, message) => push('info', title, message, 3500),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => {
          const { icon: Icon, border, iconColor } = VARIANTS[toast.variant]
          return (
            <div
              key={toast.id}
              role="status"
              className={`toast-in pointer-events-auto flex items-start gap-3 rounded-xl border ${border} bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 break-words text-sm text-slate-400">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
