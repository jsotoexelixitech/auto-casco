import { useEffect } from 'react'
import clsx from 'clsx'
import Icon from './Icon'

/**
 * Reusable Modal / Dialog
 * - Backdrop blur + click to close
 * - Esc key closes
 * - Body scroll lock while open
 * - Animated entry
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  hideClose = false,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Diálogo'}
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-brand-900/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-elev-2 border border-outline-variant/40 flex flex-col animate-slide-up max-h-[92vh] sm:max-h-[min(92vh,calc(100dvh-2rem))]',
          sizes[size],
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {(title || icon || !hideClose) && (
          <header className="flex items-start gap-3 p-4 sm:p-5 border-b border-outline-variant/40">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <Icon name={icon} className="text-[22px]" filled />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-headline-md text-on-surface leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-caption sm:text-body-md text-on-surface-variant mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="btn-icon -mr-1 -mt-1 shrink-0"
                aria-label="Cerrar"
              >
                <Icon name="close" />
              </button>
            )}
          </header>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 p-3 sm:p-4 border-t border-outline-variant/40 bg-surface-container-low/50 rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
