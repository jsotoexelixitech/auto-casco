import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'

const SAMPLE_LOCATIONS = [
  { lat: 10.4969, lng: -66.8568, direccion: 'Centro Lido, Av. Francisco de Miranda, Caracas' },
  { lat: 10.4806, lng: -66.9036, direccion: 'Plaza Venezuela, Caracas' },
  { lat: 10.5061, lng: -66.9146, direccion: 'Parque Caiza, Caracas' },
  { lat: 10.4881, lng: -66.8792, direccion: 'Las Mercedes, Caracas' },
]

export default function Step2Location({ state }) {
  const { ubicacion, setUbicacion } = state
  const toast = useToast()

  const captureLocation = () => {
    setUbicacion({ ...ubicacion, capturando: true })
    toast.info('Detectando posición GPS…', { title: 'Geolocalización' })
    setTimeout(() => {
      const sample =
        SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)]
      setUbicacion({ ...sample, capturando: false })
      toast.success('Ubicación capturada con éxito')
    }, 1400)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
          <Icon name="location_on" className="text-primary text-[24px]" filled />
          <h3 className="text-headline-md text-on-surface">Ubicación de la Inspección</h3>
        </div>
        <p className="text-caption sm:text-body-md text-on-surface-variant mb-3">
          La ubicación se registra automáticamente para asegurar la trazabilidad
          del proceso.
        </p>

        <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-primary-fixed via-tertiary-fixed-dim to-primary-fixed-dim border border-outline-variant/40">
          <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full opacity-40">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F1A5A" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="800" height="450" fill="url(#grid)" />
            <path d="M0 220 Q 200 180 400 240 T 800 200" stroke="#162A7F" strokeWidth="3" fill="none" opacity="0.6" />
            <path d="M0 280 Q 300 320 500 260 T 800 320" stroke="#162A7F" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M150 0 L 180 450" stroke="#162A7F" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M520 0 L 480 450" stroke="#162A7F" strokeWidth="2" fill="none" opacity="0.4" />
          </svg>

          {ubicacion.lat && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full transition-all duration-700"
              style={{ top: '52%', left: '48%' }}
            >
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-accent-500/50 animate-ping" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-accent text-white flex items-center justify-center shadow-elev-accent border-4 border-white">
                  <Icon name="location_on" className="text-[26px]" filled />
                </div>
              </div>
            </div>
          )}

          {!ubicacion.lat && !ubicacion.capturando && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
              <div>
                <Icon name="my_location" className="text-[40px] sm:text-[48px] text-primary opacity-30" />
                <p className="text-on-surface-variant mt-2 text-caption sm:text-body-md">
                  Ubicación no capturada
                </p>
              </div>
            </div>
          )}
          {ubicacion.capturando && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur">
              <div className="text-center">
                <Icon name="progress_activity" className="text-[40px] sm:text-[48px] text-primary animate-spin" />
                <p className="text-primary font-bold mt-2">Detectando GPS…</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={captureLocation}
          disabled={ubicacion.capturando}
          className="btn-primary w-full mt-3"
        >
          <Icon name="my_location" />
          {ubicacion.lat ? 'Recapturar ubicación' : 'Capturar mi ubicación'}
        </button>
      </div>

      <aside className="card p-4 sm:p-5">
        <h3 className="text-headline-md text-on-surface mb-3">Coordenadas</h3>
        <div className="space-y-3">
          <DataRow label="Latitud" value={ubicacion.lat?.toFixed(4) ?? '—'} />
          <DataRow label="Longitud" value={ubicacion.lng?.toFixed(4) ?? '—'} />
          <DataRow label="Dirección" value={ubicacion.direccion || '—'} multiline />
          <DataRow
            label="Capturado"
            value={ubicacion.lat ? new Date().toLocaleString() : '—'}
          />
        </div>

        <div className="mt-4 p-3 bg-primary-fixed/40 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="lock" className="text-primary" filled />
            <p className="font-bold text-primary">Trazabilidad inmutable</p>
          </div>
          <p className="text-caption text-on-primary-fixed-variant">
            La ubicación queda registrada junto a la inspección para garantizar
            la auditoría posterior.
          </p>
        </div>
      </aside>
    </div>
  )
}

function DataRow({ label, value, multiline }) {
  return (
    <div className="min-w-0">
      <p className="text-caption text-on-surface-variant uppercase tracking-wider">{label}</p>
      <p
        className={`text-on-surface font-semibold ${
          multiline
            ? 'text-body-md break-words'
            : 'font-mono text-body-md truncate'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
