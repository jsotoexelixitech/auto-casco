import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

// ── Búsqueda de dirección ─────────────────────────────────────────────────────
// 1º Google Maps Geocoding (precisión métrica) → 2º Nominatim (OSM, fallback)

async function searchWithGoogle(query) {
  if (!MAPS_KEY) return null
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&language=es&region=ve&key=${MAPS_KEY}`,
    )
    if (!res.ok) return null
    const d = await res.json()
    if (d.status !== 'OK' || !d.results?.length) return null
    return d.results.map((r) => ({
      display_name: r.formatted_address,
      lat: String(r.geometry.location.lat),
      lon: String(r.geometry.location.lng),
      source: 'google',
    }))
  } catch { return null }
}

async function searchWithNominatim(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=es&countrycodes=ve`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.map((r) => ({ ...r, source: 'osm' }))
  } catch { return [] }
}

async function searchAddress(query) {
  if (!query || query.trim().length < 3) return []
  const google = await searchWithGoogle(query)
  if (google && google.length > 0) return google
  return searchWithNominatim(query)
}

// ── Geocodificación inversa ───────────────────────────────────────────────────
async function reverseGeocodeGoogle(lat, lng) {
  if (!MAPS_KEY) return null
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${MAPS_KEY}`,
    )
    if (!res.ok) return null
    const d = await res.json()
    return d.results?.[0]?.formatted_address ?? null
  } catch { return null }
}

// ── Fix Leaflet default icon (Vite/webpack) ──────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icono personalizado rojo de La Mundial
const PIN_ICON = L.divIcon({
  html: `<div style="
    width:36px;height:36px;
    background:linear-gradient(135deg,#E84F51,#B23F44);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 3px 12px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="transform:rotate(45deg);font-size:18px;color:white;font-family:Material Symbols Outlined;font-variation-settings:'FILL' 1">location_on</span>
  </div>`,
  className: '',
  iconSize:   [36, 36],
  iconAnchor: [18, 36],
  popupAnchor:[0, -36],
})

// ── Geocodificación inversa — Google Maps → BigDataCloud → Nominatim ──────────
async function reverseGeocode(lat, lng) {
  // 1º Google Maps (precisión máxima, dirección completa en español)
  const googleAddr = await reverseGeocodeGoogle(lat, lng)
  if (googleAddr) return googleAddr

  // 2º BigDataCloud (sin API key)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
    )
    if (res.ok) {
      const d = await res.json()
      const parts = [d.locality || d.city, d.principalSubdivision, d.countryName].filter(Boolean)
      if (parts.length) return parts.join(', ')
    }
  } catch { /* fallback */ }

  // 3º Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
    )
    if (res.ok) {
      const d = await res.json()
      const a = d.address ?? {}
      const parts = [
        a.road ?? a.pedestrian ?? a.neighbourhood,
        a.suburb ?? a.city_district,
        a.city ?? a.town ?? a.village ?? a.municipality,
        a.state,
      ].filter(Boolean)
      return parts.length ? parts.join(', ') : d.display_name ?? null
    }
  } catch { /* nothing */ }

  return null
}

// ── Umbrales de precisión ─────────────────────────────────────────────────────
const ACC_EXCELLENT = 15
const ACC_GOOD      = 50
const ACC_MAX_WAIT  = 20000

// ── Subcomponente: centra mapa cuando cambia la posición ─────────────────────
// acc ≤ 15 m → zoom 19 (edificio), ≤ 50 → zoom 18 (calle), > 50 → zoom 16 (barrio)
function MapCenterer({ lat, lng, accuracy }) {
  const map = useMap()
  useEffect(() => {
    if (!lat || !lng) return
    const zoom = accuracy == null ? 17 : accuracy <= 15 ? 19 : accuracy <= 50 ? 18 : 16
    map.setView([lat, lng], zoom, { animate: true })
  }, [lat, lng, accuracy, map])
  return null
}

// ── Subcomponente: click en el mapa para mover el pin ────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

export default function Step2Location({ state }) {
  const { ubicacion, setUbicacion } = state
  const toast = useToast()

  const [status,       setStatus]      = useState(() => ubicacion?.lat ? 'granted' : 'idle')
  const [liveAcc,      setLiveAcc]     = useState(null)
  const [accuracy,     setAccuracy]    = useState(null)
  const [geocoding,    setGeocoding]   = useState(false)
  const [timestamp,    setTimestamp]   = useState(ubicacion?.lat ? new Date() : null)
  const [searchQuery,  setSearchQuery] = useState('')
  const [searchResults,setSearchResults] = useState([])
  const [searching,    setSearching]   = useState(false)
  const [permState,    setPermState]   = useState(null)  // 'granted' | 'denied' | 'prompt' | null
  const searchTimerRef = useRef(null)

  /* ── Pre-detección de contexto / permisos ─────────────────────────────────
     Razón más común de "Permiso denegado": el sitio se sirve por IP LAN
     (ej. 192.168.x.x) en HTTP → el navegador lo trata como contexto
     INSEGURO y bloquea Geolocation API sin pedir permiso. */
  const ctxInfo = useMemo(() => {
    if (typeof window === 'undefined') return { secure: true, host: '', port: '', isLan: false, isLocalhost: true }
    const host = window.location.hostname
    const port = window.location.port
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
    const isLan = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !isLocalhost
    return { secure: window.isSecureContext, host, port, isLan, isLocalhost }
  }, [])

  // Consulta el estado del permiso de geolocation (cuando esté soportado)
  useEffect(() => {
    if (!navigator.permissions?.query) return
    let cancelled = false
    navigator.permissions.query({ name: 'geolocation' }).then((res) => {
      if (cancelled) return
      setPermState(res.state)
      res.onchange = () => setPermState(res.state)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const localhostUrl = `http://localhost:${ctxInfo.port || '5173'}${window.location.pathname}${window.location.search}`

  const watchIdRef  = useRef(null)
  const timerRef    = useRef(null)
  const bestAccRef  = useRef(Infinity)
  const bestPosRef  = useRef(null)

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
    if (timerRef.current)           { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopWatch(), [stopWatch])

  // Confirma la mejor posición capturada
  const confirmPos = useCallback(async (lat, lng, acc, ts) => {
    stopWatch()
    setAccuracy(Math.round(acc))
    setLiveAcc(null)
    setTimestamp(new Date(ts))
    setGeocoding(true)
    setUbicacion({ lat, lng, direccion: null, capturando: false })
    setStatus('granted')

    const dir = await reverseGeocode(lat, lng)
    setUbicacion({ lat, lng, direccion: dir ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`, capturando: false })
    setGeocoding(false)

    const rounded = Math.round(acc)
    if (rounded <= ACC_EXCELLENT) {
      toast.success(`± ${rounded} m — Precisión excelente`, { title: '✓ Ubicación capturada' })
    } else if (rounded <= ACC_GOOD) {
      toast.success(`± ${rounded} m — Buena precisión`, { title: '✓ Ubicación capturada' })
    } else {
      // En desktop la precisión WiFi es baja — orientamos al usuario
      toast.warning(
        `El GPS del navegador dio ± ${rounded} m. Para mayor exactitud usa el buscador de dirección o arrastra el pin en el mapa.`,
        { title: 'Precisión moderada', duration: 8000 },
      )
    }
  }, [stopWatch, setUbicacion, toast])

  // Búsqueda de dirección con debounce
  const handleSearchInput = useCallback((val) => {
    setSearchQuery(val)
    setSearchResults([])
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!val.trim() || val.trim().length < 3) return
    setSearching(true)
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchAddress(val)
      setSearchResults(results)
      setSearching(false)
    }, 500)
  }, [])

  const selectSearchResult = useCallback(async (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSearchQuery(result.display_name)
    setSearchResults([])
    setAccuracy(null)   // manual → sin dato de precisión GPS
    setTimestamp(new Date())
    setUbicacion({ lat, lng, direccion: result.display_name, capturando: false })
    setStatus('granted')
    toast.success('Ubicación establecida correctamente', { title: '✓ Dirección fijada' })
  }, [setUbicacion, toast])

  // Handler cuando el usuario arrastra/clica el pin en el mapa
  const handleMapPin = useCallback(async (lat, lng) => {
    setGeocoding(true)
    setUbicacion((prev) => ({ ...prev, lat, lng, direccion: null }))
    const dir = await reverseGeocode(lat, lng)
    setUbicacion((prev) => ({ ...prev, lat, lng, direccion: dir ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}` }))
    setGeocoding(false)
    toast.info('Ubicación ajustada manualmente', { title: 'Pin actualizado' })
  }, [setUbicacion, toast])

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      toast.error('Tu navegador no soporta geolocalización.', { title: 'No disponible' })
      return
    }
    /* Contexto inseguro → el navegador silenciosamente bloquea. Avisamos. */
    if (!ctxInfo.secure) {
      setStatus('insecure')
      toast.error(
        `El sitio se está sirviendo por IP (${ctxInfo.host}) en HTTP. Los navegadores solo permiten GPS en HTTPS o en localhost. Abre la app en http://localhost:${ctxInfo.port || '5173'} desde esta misma PC.`,
        { title: 'Contexto inseguro', duration: 10000 },
      )
      return
    }
    stopWatch()
    bestAccRef.current = Infinity
    bestPosRef.current = null
    setStatus('acquiring')
    setLiveAcc(null)
    setUbicacion({ lat: null, lng: null, direccion: null, capturando: true })
    toast.info('Adquiriendo señal GPS…', { title: 'GPS activo' })

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
        setLiveAcc(Math.round(acc))
        if (acc < bestAccRef.current) { bestAccRef.current = acc; bestPosRef.current = pos }
        if (acc <= ACC_EXCELLENT) confirmPos(lat, lng, acc, pos.timestamp)
      },
      (err) => {
        stopWatch()
        setUbicacion({ lat: null, lng: null, direccion: null, capturando: false })
        if (err.code === 1) {
          setStatus('denied')
          toast.error('Permiso denegado. Ve a Configuración del navegador → Privacidad → Ubicación y permítela para este sitio.', { title: 'Permiso denegado', duration: 8000 })
        } else if (err.code === 3) {
          setStatus('timeout')
          toast.error('Señal GPS débil. Sal al exterior o acércate a una ventana.', { title: 'Sin señal' })
        } else {
          setStatus('error')
          toast.error('Error al obtener GPS. Puedes fijar la ubicación tocando el mapa.', { title: 'Error GPS' })
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )

    timerRef.current = setTimeout(() => {
      if (bestPosRef.current) {
        const p = bestPosRef.current
        confirmPos(p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.timestamp)
      } else {
        stopWatch()
        setStatus('timeout')
        setUbicacion({ lat: null, lng: null, direccion: null, capturando: false })
        toast.warning('No se obtuvo señal GPS. Puedes tocar el mapa para fijar la ubicación manualmente.', { title: 'Sin señal GPS', duration: 7000 })
      }
    }, ACC_MAX_WAIT)
  }, [stopWatch, confirmPos, setUbicacion, toast, ctxInfo])

  const hasLocation = Boolean(ubicacion?.lat)
  const isAcquiring = status === 'acquiring'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

      {/* ── Panel del mapa ─────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5 min-w-0">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
          <Icon name="location_on" className="text-primary text-[24px]" filled />
          <div>
            <h3 className="text-headline-md text-on-surface">Ubicación de la Inspección</h3>
            <p className="text-caption text-on-surface-variant">
              Escribe tu dirección o usa GPS. Arrastra el pin para ajustar la posición exacta.
            </p>
          </div>
        </div>

        {/* ── Buscador de dirección ─────────────────────────────── */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant/60 bg-white px-3 py-2
                          focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Icon name={searching ? 'progress_activity' : 'search'}
              className={`text-[20px] text-on-surface-variant shrink-0 ${searching ? 'animate-spin' : ''}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Busca tu dirección, urbanización, municipio…"
              className="flex-1 bg-transparent border-0 outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-h-[36px]"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                className="shrink-0 w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center transition">
                <Icon name="close" className="text-[16px] text-on-surface-variant" />
              </button>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full mt-1 z-[2000] bg-white rounded-xl border border-outline-variant/50 shadow-elev-2 overflow-hidden max-h-64 overflow-y-auto">
              {/* indicador de fuente en el encabezado */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/20">
                <Icon name={searchResults[0]?.source === 'google' ? 'maps' : 'map'} className="text-[13px] text-on-surface-variant" />
                <span className="text-caption text-on-surface-variant">
                  {searchResults[0]?.source === 'google' ? 'Google Maps — precisión métrica' : 'OpenStreetMap'}
                </span>
              </div>
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => selectSearchResult(r)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-surface-container-low transition text-left border-b border-outline-variant/20 last:border-0">
                  <Icon name="place" className="text-[18px] text-primary shrink-0 mt-0.5" filled />
                  <p className="text-body-md text-on-surface leading-snug line-clamp-2">{r.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mapa Leaflet */}
        <div className="rounded-xl overflow-hidden border border-outline-variant/40 mb-3 relative"
          style={{ height: 'clamp(240px, 42vw, 420px)' }}>

          {/* Overlay de adquisición GPS */}
          {isAcquiring && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3 px-6 pointer-events-none">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {[1,2,3].map((i) => (
                  <span key={i} className="absolute rounded-full border-2 border-primary/40 animate-ping"
                    style={{ width: `${i*18+20}px`, height: `${i*18+20}px`, animationDelay: `${i*0.25}s`, animationDuration: `${1.2+i*0.3}s` }} />
                ))}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-elev-primary">
                  <Icon name="my_location" className="text-[20px] text-white" filled />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-primary">Adquiriendo señal GPS…</p>
                {liveAcc != null && (
                  <p className="text-caption text-on-surface-variant mt-0.5">
                    Señal actual: <strong className={liveAcc <= ACC_EXCELLENT ? 'text-green-600' : liveAcc <= ACC_GOOD ? 'text-amber-600' : 'text-red-600'}>
                      ± {liveAcc} m
                    </strong>
                  </p>
                )}
              </div>
              {liveAcc != null && (
                <div className="w-40 h-1.5 rounded-full bg-surface-container overflow-hidden pointer-events-auto">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(4, 100 - liveAcc))}%`,
                      backgroundColor: liveAcc <= ACC_EXCELLENT ? '#16A34A' : liveAcc <= ACC_GOOD ? '#D97706' : '#DC2626',
                    }} />
                </div>
              )}
              {liveAcc != null && liveAcc <= ACC_GOOD && (
                <button onClick={() => { const p = bestPosRef.current; if (p) confirmPos(p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.timestamp) }}
                  className="pointer-events-auto btn-soft text-caption py-1.5 px-4 min-h-[36px]">
                  <Icon name="check" className="text-[15px]" /> Usar ± {liveAcc} m
                </button>
              )}
            </div>
          )}

          {/* Estado sin ubicación */}
          {!hasLocation && !isAcquiring && (
            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-surface-container-low/85 backdrop-blur-[2px] p-4 overflow-y-auto pointer-events-none [&_button]:pointer-events-auto">
              {(() => {
                /* Diagnóstico inteligente:
                   - insecure → IP/LAN sin HTTPS (el caso real más frecuente)
                   - denied   → el usuario bloqueó el permiso
                   - timeout  → GPS sin señal */
                const effective = !ctxInfo.secure ? 'insecure' : (status === 'denied' && permState === 'denied') ? 'denied' : status
                if (effective === 'insecure') {
                  return (
                    <>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-100">
                        <Icon name="https" className="text-[32px] text-amber-600" filled />
                      </div>
                      <div className="text-center max-w-md">
                        <p className="font-bold text-amber-800">GPS bloqueado por el navegador</p>
                        <p className="text-caption text-on-surface-variant mt-1">
                          Estás abriendo el sitio por IP ({ctxInfo.host}) sobre HTTP.
                          Los navegadores solo permiten GPS en <strong>HTTPS</strong> o en <strong>localhost</strong>.
                        </p>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center justify-center">
                          <button
                            onClick={() => { window.location.href = localhostUrl }}
                            className="btn-primary text-caption py-2 px-3 min-h-[36px]">
                            <Icon name="open_in_new" className="text-[15px]" />
                            Abrir en localhost
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(localhostUrl)
                              toast.success('URL copiada al portapapeles', { title: '✓ Listo' })
                            }}
                            className="btn-soft text-caption py-2 px-3 min-h-[36px]">
                            <Icon name="content_copy" className="text-[15px]" />
                            Copiar URL localhost
                          </button>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-2 font-mono break-all">
                          {localhostUrl}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-2">
                          Si necesitas el GPS desde otro dispositivo en la red, levanta el dev server con HTTPS
                          (<span className="font-mono bg-surface-container px-1 rounded">vite --https</span>) o usa un túnel
                          tipo <span className="font-mono bg-surface-container px-1 rounded">ngrok</span>.
                        </p>
                        <p className="text-caption text-on-surface-variant mt-2">
                          Mientras tanto puedes <strong>buscar tu dirección</strong> arriba o <strong>tocar el mapa</strong> para fijar la ubicación.
                        </p>
                      </div>
                    </>
                  )
                }
                if (effective === 'denied') {
                  return (
                    <>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-error-container">
                        <Icon name="location_off" className="text-[32px] text-error" filled />
                      </div>
                      <div className="text-center max-w-md">
                        <p className="font-bold text-error">Permiso de ubicación denegado</p>
                        <p className="text-caption text-on-surface-variant mt-1">
                          Haz clic en el ícono del candado <Icon name="lock" className="text-[14px] inline-block align-middle" /> a la izquierda de la URL → <strong>Configuración del sitio</strong> → <strong>Ubicación</strong> → Permitir, y recarga la página.
                        </p>
                        <p className="text-caption text-on-surface-variant mt-2">
                          Mientras tanto puedes <strong>buscar tu dirección</strong> arriba o <strong>tocar el mapa</strong> para fijar la ubicación.
                        </p>
                      </div>
                    </>
                  )
                }
                if (effective === 'timeout') {
                  return (
                    <>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-warning-container">
                        <Icon name="signal_wifi_bad" className="text-[32px] text-amber-600" filled />
                      </div>
                      <div className="text-center max-w-md">
                        <p className="font-bold text-amber-700">Señal GPS débil</p>
                        <p className="text-caption text-on-surface-variant mt-1">
                          En computadora la precisión depende del WiFi (~50–200 m). Para mayor exactitud usa el buscador de dirección o arrastra el pin.
                        </p>
                      </div>
                    </>
                  )
                }
                return (
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10">
                      <Icon name="my_location" className="text-[32px] text-primary opacity-60" filled />
                    </div>
                    <div className="text-center max-w-md">
                      <p className="font-bold text-on-surface">Sin ubicación capturada</p>
                      <p className="text-caption text-on-surface-variant mt-1">
                        Busca tu dirección en el campo de arriba, pulsa <strong>Capturar con GPS</strong>, o toca directamente sobre el mapa.
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Mapa Leaflet — siempre montado para poder tocar */}
          <MapContainer
            center={hasLocation ? [ubicacion.lat, ubicacion.lng] : [10.4806, -66.9036]}
            zoom={hasLocation ? 17 : 12}
            style={{ width: '100%', height: '100%' }}
            zoomControl
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasLocation && (
              <>
                <MapCenterer lat={ubicacion.lat} lng={ubicacion.lng} accuracy={accuracy} />
                <Marker
                  position={[ubicacion.lat, ubicacion.lng]}
                  icon={PIN_ICON}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng()
                      handleMapPin(lat, lng)
                    },
                  }}
                />
              </>
            )}

            {/* Click en mapa para fijar ubicación manualmente */}
            <MapClickHandler onMapClick={handleMapPin} />
          </MapContainer>

          {/* Badge de precisión sobre el mapa */}
          {hasLocation && accuracy != null && (
            <div className="absolute bottom-3 left-3 z-[999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-caption font-bold shadow-elev-1 bg-white/90 backdrop-blur-sm border"
              style={{ borderColor: accuracy <= ACC_EXCELLENT ? '#86EFAC' : accuracy <= ACC_GOOD ? '#FCD34D' : '#FCA5A5',
                       color:       accuracy <= ACC_EXCELLENT ? '#16A34A' : accuracy <= ACC_GOOD ? '#D97706' : '#DC2626' }}>
              <Icon name="radar" className="text-[14px]" />
              ± {accuracy} m &nbsp;
              {accuracy <= ACC_EXCELLENT ? '— Excelente' : accuracy <= ACC_GOOD ? '— Buena' : '— Moderada'}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button onClick={captureGPS} disabled={isAcquiring || status === 'unsupported'}
            className={`flex-1 ${hasLocation ? 'btn-soft' : 'btn-primary'}`}>
            <Icon name={isAcquiring ? 'radar' : 'my_location'}
              className={isAcquiring ? 'animate-pulse' : ''} />
            {isAcquiring
              ? `GPS… ${liveAcc != null ? `± ${liveAcc} m` : ''}`.trim()
              : hasLocation ? 'Recapturar GPS' : 'Capturar con GPS'}
          </button>

          {/* Fijar manualmente */}
          {!hasLocation && !isAcquiring && (
            <button
              onClick={() => handleMapPin(10.4806, -66.9036)}
              className="btn-soft flex-1"
              title="Fija el pin en el centro del mapa y arrástralo"
            >
              <Icon name="edit_location_alt" /> Fijar en mapa
            </button>
          )}
        </div>

        <p className="text-caption text-on-surface-variant mt-2 flex items-start gap-1.5 bg-surface-container-low/60 rounded-xl px-3 py-2">
          <Icon name="tips_and_updates" className="text-[14px] shrink-0 mt-0.5 text-primary" filled />
          <span>
            <strong className="text-on-surface">Para máxima precisión:</strong>
            {' '}escribe tu dirección completa en el buscador (calle, municipio) — la geocodificación da coordenadas exactas. El GPS en computadoras usa WiFi y puede tener ± 50-200 m de error.
          </span>
        </p>
      </div>

      {/* ── Panel de datos ─────────────────────────────────────────── */}
      <aside className="card p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <h3 className="text-headline-md text-on-surface">Coordenadas</h3>

        <Coord label="Latitud"  icon="north" value={ubicacion?.lat?.toFixed(6) ?? '—'} mono />
        <Coord label="Longitud" icon="east"  value={ubicacion?.lng?.toFixed(6) ?? '—'} mono />

        {(accuracy != null || liveAcc != null) && (
          <Coord label="Precisión GPS" icon="radar"
            value={accuracy != null
              ? `± ${accuracy} m — ${accuracy <= ACC_EXCELLENT ? 'Excelente' : accuracy <= ACC_GOOD ? 'Buena' : 'Moderada'}`
              : `± ${liveAcc} m — Adquiriendo…`}
            mono
            tone={((accuracy ?? liveAcc ?? 999) <= ACC_EXCELLENT) ? 'success' : ((accuracy ?? liveAcc ?? 999) <= ACC_GOOD) ? 'warning' : 'error'}
          />
        )}

        <Coord label="Dirección" icon="place" multiline
          value={geocoding ? 'Buscando dirección…' : (ubicacion?.direccion || '—')} />

        <Coord label="Capturado" icon="schedule"
          value={timestamp ? timestamp.toLocaleString('es-VE') : '—'} />

        {hasLocation && (
          <a href={`https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-soft w-full text-center mt-1">
            <Icon name="open_in_new" className="text-[16px]" /> Ver en Google Maps
          </a>
        )}

        <div className="p-3 bg-primary-fixed/40 border border-primary/20 rounded-xl mt-auto">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="lock" className="text-primary text-[17px]" filled />
            <p className="font-bold text-primary text-label-md">Trazabilidad</p>
          </div>
          <p className="text-caption text-on-primary-fixed-variant leading-snug">
            Las coordenadas quedan registradas con la inspección para auditoría ante la aseguradora.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Coord({ label, value, mono, multiline, icon, tone }) {
  const color = tone === 'success' ? '#16A34A' : tone === 'warning' ? '#D97706' : tone === 'error' ? '#DC2626' : undefined
  return (
    <div className="flex items-start gap-2 py-2 border-b border-outline-variant/25 last:border-0">
      <Icon name={icon} className="text-[17px] text-on-surface-variant shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{label}</p>
        <p className={`font-semibold leading-snug mt-0.5 ${multiline ? 'text-body-md break-words' : 'font-mono text-body-md truncate'}`}
          style={color ? { color } : undefined}>
          {value}
        </p>
      </div>
    </div>
  )
}
