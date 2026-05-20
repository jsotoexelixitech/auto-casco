import { createContext, useCallback, useContext, useState } from 'react'
import Icon from '../components/ui/Icon'

const ToastContext = createContext(null)

const TONES = {
  success: { classes: 'bg-white border-success/40 text-on-surface', icon: '#16A34A', bar: '#16A34A' },
  error:   { classes: 'bg-white border-error/40 text-on-surface',   icon: '#DC2626', bar: '#DC2626' },
  info:    { classes: 'bg-white border-primary/30 text-on-surface',  icon: '#0F1A5A', bar: '#0F1A5A' },
  warning: { classes: 'bg-white border-amber-400/50 text-on-surface',icon: '#D97706', bar: '#D97706' },
}

const ICONS = {
  success: 'task_alt',
  error:   'error',
  info:    'info',
  warning: 'warning',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random()
    const tone = opts.tone ?? 'info'
    const duration = opts.duration ?? 4000
    setToasts((prev) => [...prev, { id, message, tone, title: opts.title, duration }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const api = {
    show,
    success: (msg, opts = {}) => show(msg, { ...opts, tone: 'success' }),
    error:   (msg, opts = {}) => show(msg, { ...opts, tone: 'error' }),
    info:    (msg, opts = {}) => show(msg, { ...opts, tone: 'info' }),
    warning: (msg, opts = {}) => show(msg, { ...opts, tone: 'warning' }),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast stack — esquina inferior derecha en móvil, superior derecha en desktop */}
      <div
        className="fixed z-[120] flex flex-col gap-2 pointer-events-none
                   bottom-[calc(72px+env(safe-area-inset-bottom,0px)+8px)] right-3 left-3
                   sm:bottom-auto sm:top-[calc(64px+env(safe-area-inset-top,0px)+12px)]
                   sm:right-5 sm:left-auto sm:w-[360px]"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] ?? TONES.info
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border-2 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl animate-slide-up overflow-hidden relative ${tone.classes}`}
              style={{ animationDuration: '220ms' }}
            >
              {/* Barra de color lateral */}
              <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ backgroundColor: tone.bar }} />

              <Icon
                name={ICONS[t.tone]}
                className="text-[22px] mt-0.5 shrink-0 ml-2"
                style={{ color: tone.icon }}
                filled
              />

              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="font-bold text-label-md leading-tight text-on-surface">{t.title}</p>
                )}
                <p className="text-caption sm:text-body-md leading-snug text-on-surface-variant mt-0.5">
                  {t.message}
                </p>
              </div>

              {/* Cerrar */}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center transition -mt-0.5 -mr-0.5"
                aria-label="Cerrar"
              >
                <Icon name="close" className="text-[16px] text-on-surface-variant" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
