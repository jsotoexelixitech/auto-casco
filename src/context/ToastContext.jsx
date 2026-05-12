import { createContext, useCallback, useContext, useState } from 'react'
import Icon from '../components/ui/Icon'

const ToastContext = createContext(null)

const TONES = {
  success: 'bg-success-container text-on-success-container border-success/30',
  error: 'bg-error-container text-on-error-container border-error/30',
  info: 'bg-primary-fixed text-on-primary-fixed border-primary/30',
  warning: 'bg-warning-container text-on-warning-container border-warning/30',
}

const ICONS = {
  success: 'task_alt',
  error: 'error',
  info: 'info',
  warning: 'warning',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random()
    const tone = opts.tone ?? 'info'
    const duration = opts.duration ?? 3500
    setToasts((prev) => [...prev, { id, message, tone, title: opts.title }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const api = {
    show,
    success: (msg, opts = {}) => show(msg, { ...opts, tone: 'success' }),
    error: (msg, opts = {}) => show(msg, { ...opts, tone: 'error' }),
    info: (msg, opts = {}) => show(msg, { ...opts, tone: 'info' }),
    warning: (msg, opts = {}) => show(msg, { ...opts, tone: 'warning' }),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack fixed z-[120] flex flex-col gap-2 pointer-events-none right-3 left-3 sm:left-auto sm:right-6 sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border-2 shadow-elev-2 backdrop-blur-md animate-slide-up ${TONES[t.tone]}`}
          >
            <Icon name={ICONS[t.tone]} className="text-[22px] mt-0.5 shrink-0" filled />
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-bold leading-tight">{t.title}</p>}
              <p className="text-caption sm:text-body-md leading-snug">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
