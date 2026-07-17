import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

function pageCanScroll() {
  const scrollHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
  return scrollHeight - window.innerHeight > 16
}

function getFloatingBarTop(barHeight) {
  const root = getComputedStyle(document.documentElement)
  const mainBottomPad = parseFloat(root.getPropertyValue('--main-bottom-pad')) || 24
  const mobile = window.matchMedia('(max-width: 767px)').matches
  const bottomOffset = mobile
    ? parseFloat(root.getPropertyValue('--bottom-nav-h')) || 72
    : mainBottomPad
  return window.innerHeight - bottomOffset - barHeight
}

function shouldFloatFooter(placeholder, barHeight) {
  if (!placeholder) return true
  if (!pageCanScroll()) return false

  const rect = placeholder.getBoundingClientRect()
  const dockLine = getFloatingBarTop(barHeight)

  return rect.top > dockLine + 4
}

function BarShell({ isFloating, children }) {
  return (
    <div
      className={clsx(
        'relative p-2.5 sm:p-3 flex items-center justify-between gap-2 rounded-2xl border-t transition-all duration-300',
        isFloating
          ? 'bg-white/[0.06] backdrop-blur-[6px] border-outline-variant/10 shadow-[0_-2px_10px_rgba(15,26,90,0.04)]'
          : 'card-elev2 bg-white/95 backdrop-blur-xl border-outline-variant/40 shadow-[0_-4px_16px_rgba(15,26,90,0.10)]',
      )}
    >
      {children}
    </div>
  )
}

export default function WizardStickyFooter({ children, className, anchorKey }) {
  const placeholderRef = useRef(null)
  const measureRef = useRef(null)
  const [isFloating, setIsFloating] = useState(true)
  const [barHeight, setBarHeight] = useState(68)
  const [mounted, setMounted] = useState(false)

  const updateMode = useCallback(() => {
    const placeholder = placeholderRef.current
    if (!placeholder) return
    setIsFloating(shouldFloatFooter(placeholder, barHeight))
  }, [barHeight])

  useEffect(() => setMounted(true), [])

  // Al cambiar de paso, asumir flotante y recalcular cuando el contenido termine de cargar
  useEffect(() => {
    setIsFloating(true)
    const timers = [0, 80, 200, 500, 1000, 1800].map((ms) =>
      window.setTimeout(updateMode, ms),
    )
    return () => timers.forEach(clearTimeout)
  }, [anchorKey, updateMode])

  useLayoutEffect(() => {
    if (measureRef.current) {
      setBarHeight(measureRef.current.offsetHeight || 68)
    }
    updateMode()
  }, [anchorKey, children, updateMode])

  useEffect(() => {
    const onScroll = () => requestAnimationFrame(updateMode)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateMode)

    const placeholder = placeholderRef.current
    const wizardPage = placeholder?.closest('.wizard-page')

    const ro = new ResizeObserver(() => requestAnimationFrame(updateMode))
    ro.observe(document.documentElement)
    ro.observe(document.body)
    if (placeholder) ro.observe(placeholder)
    if (wizardPage) ro.observe(wizardPage)

    const mo = wizardPage
      ? new MutationObserver(() => requestAnimationFrame(updateMode))
      : null
    if (wizardPage && mo) {
      mo.observe(wizardPage, { childList: true, subtree: true, attributes: true })
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateMode)
      ro.disconnect()
      mo?.disconnect()
    }
  }, [updateMode, anchorKey])

  const floatingBar = mounted && isFloating
    ? createPortal(
        <div
          className="fixed inset-x-0 md:left-64 wizard-footer-sticky z-[70] px-3 sm:px-4 md:px-5 lg:px-6 pointer-events-auto"
          role="navigation"
          aria-label="Navegación del asistente"
        >
          <BarShell isFloating>{children}</BarShell>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {floatingBar}

      <div
        ref={placeholderRef}
        className={clsx('relative mt-4 w-full shrink-0', className)}
        aria-hidden={isFloating}
      >
        {!isFloating && (
          <div className="w-full">
            <BarShell isFloating={false}>{children}</BarShell>
          </div>
        )}

        <div
          ref={measureRef}
          className={clsx(isFloating ? 'invisible pointer-events-none' : 'sr-only')}
          aria-hidden="true"
        >
          <BarShell isFloating={false}>{children}</BarShell>
        </div>
      </div>
    </>
  )
}
