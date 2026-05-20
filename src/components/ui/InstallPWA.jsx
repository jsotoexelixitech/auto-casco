import { useState, useEffect } from 'react'

/**
 * Banner de instalación PWA.
 * - Aparece automáticamente en Android cuando Chrome lanza el evento
 *   `beforeinstallprompt` (requisito: manifest + service worker + HTTPS/localhost).
 * - En iOS muestra instrucciones manuales (Safari → Compartir → Añadir a pantalla).
 * - Se puede cerrar y no vuelve a aparecer en la sesión.
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid]       = useState(false)
  const [showIOS, setShowIOS]               = useState(false)
  const [installed, setInstalled]           = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true

    if (isInStandaloneMode) { setInstalled(true); return }

    // Android / Chrome: capturar el evento de instalación
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS: mostrar guía manual
    if (isIOS && !isInStandaloneMode) setShowIOS(true)

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShowAndroid(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShowAndroid(false)
    setDeferredPrompt(null)
  }

  // No mostrar si ya está instalada o ningún banner aplica
  if (installed || (!showAndroid && !showIOS)) return null

  // ── Banner Android ─────────────────────────────────────────────────────────
  if (showAndroid) {
    return (
      <div
        className="fixed left-3 right-3 z-[9999] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-h, 72px) + 8px)',
          background: '#0F1A5A',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <img src="/icon-192.png" alt="La Mundial" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Instalar La Mundial</p>
            <p className="text-white/60 text-xs mt-0.5">
              Añade la app a tu pantalla de inicio
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAndroid(false)}
              className="px-3 py-1.5 rounded-lg text-white/60 text-xs hover:bg-white/10 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
              style={{ background: '#C8102E' }}
            >
              Instalar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Guía iOS ───────────────────────────────────────────────────────────────
  if (showIOS) {
    return (
      <div
        className="fixed left-3 right-3 z-[9999] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-h, 72px) + 8px)',
          background: '#0F1A5A',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/icon-192.png" alt="La Mundial" className="w-10 h-10 rounded-xl" />
              <p className="text-white font-semibold text-sm">Añadir a pantalla de inicio</p>
            </div>
            <button
              onClick={() => setShowIOS(false)}
              className="text-white/50 hover:text-white/80 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <ol className="space-y-1.5">
            {[
              ['1', 'Toca el botón Compartir', '( ↑ ) en Safari'],
              ['2', 'Desplázate y elige', '"Añadir a pantalla de inicio"'],
              ['3', 'Pulsa', '"Añadir" en la esquina superior'],
            ].map(([n, a, b]) => (
              <li key={n} className="flex items-start gap-2 text-xs">
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]"
                  style={{ background: '#C8102E' }}
                >{n}</span>
                <span className="text-white/80">
                  {a} <span className="text-white font-medium">{b}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return null
}
