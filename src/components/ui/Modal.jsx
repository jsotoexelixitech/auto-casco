import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  headerSize = 'default',
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

  const hasTitleAndSubtitle = Boolean(title && subtitle)
  const isCompactHeader = headerSize === 'compact'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Diálogo'}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-brand-900/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative z-10 w-full bg-white rounded-2xl shadow-elev-2 border border-outline-variant/40 flex flex-col animate-slide-up max-h-[min(90dvh,calc(100dvh-2rem))]',
          sizes[size],
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {(title || icon || !hideClose) && (
          <header
            className={clsx(
              'shrink-0 flex gap-2.5 border-b border-outline-variant/40',
              isCompactHeader ? 'p-3 sm:p-4' : 'p-4 sm:p-5 gap-3',
              hasTitleAndSubtitle ? 'items-start' : 'items-center',
            )}
          >
            {icon && (
              <div
                className={clsx(
                  'bg-primary-fixed text-primary flex items-center justify-center shrink-0',
                  isCompactHeader ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl',
                )}
              >
                <Icon name={icon} className={isCompactHeader ? 'text-[18px]' : 'text-[22px]'} filled />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3
                  className={clsx(
                    'text-on-surface leading-tight',
                    isCompactHeader ? 'text-label-md font-bold' : 'text-headline-md',
                  )}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={clsx(
                    'text-caption sm:text-body-md text-on-surface-variant',
                    title && 'mt-0.5',
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className={clsx('btn-icon shrink-0', isCompactHeader ? '-mr-1' : '-mr-1 -mt-1')}
                aria-label="Cerrar"
              >
                <Icon name="close" />
              </button>
            )}
          </header>
        )}
        {children ? (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        ) : null}
        {footer && (
          <footer
            className={clsx(
              'shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 p-3 sm:p-4 border-t border-outline-variant/40 bg-surface-container-low/50 rounded-b-2xl',
              !children && 'border-t-0',
            )}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
