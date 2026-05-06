import { useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'

const DAMAGE_TYPES = [
  { id: 'rayón', label: 'Rayón' },
  { id: 'abolladura', label: 'Abolladura' },
  { id: 'rotura', label: 'Rotura' },
  { id: 'pintura', label: 'Pérdida de pintura' },
  { id: 'cristal', label: 'Cristal dañado' },
]

const SEVERITY = [
  { id: 'leve', label: 'Leve', tone: 'success' },
  { id: 'moderado', label: 'Moderado', tone: 'warning' },
  { id: 'grave', label: 'Grave', tone: 'error' },
]

export default function Step4Damages({ state }) {
  const { danios, setDanios, video360, setVideo360 } = state
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({
    tipo: 'rayón',
    severidad: 'leve',
    ubicacion: '',
    descripcion: '',
  })

  const addDamage = () => {
    if (!draft.ubicacion) {
      toast.error('Indica la ubicación del daño en el vehículo.')
      return
    }
    setDanios([
      ...danios,
      { ...draft, id: `dam-${Date.now()}`, fecha: new Date().toISOString() },
    ])
    setShowAdd(false)
    setDraft({ tipo: 'rayón', severidad: 'leve', ubicacion: '', descripcion: '' })
    toast.success('Daño registrado')
  }

  const removeDamage = (id) => setDanios(danios.filter((d) => d.id !== id))

  const handleVideoUpload = () => {
    setVideo360({ ...video360, processing: true })
    toast.info('Subiendo video 360°…', { title: 'Procesamiento' })
    setTimeout(() => {
      setVideo360({
        uploaded: true,
        processing: false,
        url: 'https://video.local/demo.mp4',
        duration: '00:42',
      })
      toast.success('Video 360° procesado correctamente')
    }, 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/50 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="report" className="text-error text-[24px]" filled />
              <h3 className="text-headline-md text-on-surface truncate">Daños identificados</h3>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-accent py-1.5 px-3 shrink-0">
              <Icon name="add" /> <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>

          {danios.length === 0 && !showAdd && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-success-container text-on-success-container flex items-center justify-center mx-auto mb-2">
                <Icon name="task_alt" className="text-[28px]" filled />
              </div>
              <p className="font-bold text-on-surface">Sin daños registrados</p>
              <p className="text-caption text-on-surface-variant">
                Agrega un daño si fue detectado durante la inspección.
              </p>
            </div>
          )}

          {danios.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {danios.map((d) => (
                <div
                  key={d.id}
                  className="border border-outline-variant/50 rounded-xl p-3 bg-surface-container-low/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={clsx(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          d.severidad === 'leve' &&
                            'bg-success-container text-on-success-container',
                          d.severidad === 'moderado' &&
                            'bg-warning-container text-on-warning-container',
                          d.severidad === 'grave' &&
                            'bg-error-container text-on-error-container',
                        )}
                      >
                        <Icon name="report" filled />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface capitalize truncate">{d.tipo}</p>
                        <p className="text-caption text-on-surface-variant capitalize truncate">
                          {d.severidad} · {d.ubicacion}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDamage(d.id)}
                      className="p-1 text-on-surface-variant hover:text-error shrink-0"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                  {d.descripcion && (
                    <p className="text-caption text-on-surface mt-2 line-clamp-2">
                      {d.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAdd && (
            <div className="border-2 border-primary/30 bg-primary-fixed/20 rounded-xl p-3 sm:p-4 mt-3 animate-fade-in">
              <h4 className="font-bold text-primary mb-2">Nuevo daño</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Tipo</label>
                  <div className="flex flex-wrap gap-1">
                    {DAMAGE_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setDraft({ ...draft, tipo: t.id })}
                        className={clsx(
                          'px-3 py-1.5 rounded-full text-caption font-semibold border transition',
                          draft.tipo === t.id
                            ? 'bg-primary text-on-primary border-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary',
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Severidad</label>
                  <div className="grid grid-cols-3 gap-1">
                    {SEVERITY.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setDraft({ ...draft, severidad: s.id })}
                        className={clsx(
                          'py-1.5 rounded-lg text-label-md border transition',
                          draft.severidad === s.id && s.tone === 'success' &&
                            'bg-success text-on-success border-success',
                          draft.severidad === s.id && s.tone === 'warning' &&
                            'bg-warning text-on-warning border-warning',
                          draft.severidad === s.id && s.tone === 'error' &&
                            'bg-error text-on-error border-error',
                          draft.severidad !== s.id &&
                            'bg-white border-outline-variant text-on-surface-variant',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Ubicación en el vehículo</label>
                  <input
                    className="input"
                    placeholder="Ej. Parachoques delantero izquierdo"
                    value={draft.ubicacion}
                    onChange={(e) => setDraft({ ...draft, ubicacion: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Descripción</label>
                  <textarea
                    className="input min-h-[72px] resize-none"
                    placeholder="Describe el daño…"
                    value={draft.descripcion}
                    onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowAdd(false)} className="btn-soft flex-1">
                  Cancelar
                </button>
                <button onClick={addDamage} className="btn-primary flex-1">
                  <Icon name="check" /> Registrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle silhouette markers */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3">
            Mapa visual de daños
          </h3>
          <div className="relative aspect-[2/1] rounded-xl bg-gradient-to-b from-primary-fixed/40 to-primary-fixed/10 border border-outline-variant/50 overflow-hidden">
            <svg viewBox="0 0 600 300" className="w-full h-full">
              <g fill="#0F1A5A" opacity="0.18">
                <rect x="120" y="60" width="360" height="180" rx="40" />
                <rect x="180" y="40" width="240" height="60" rx="30" />
                <rect x="180" y="200" width="240" height="60" rx="30" />
              </g>
              <g stroke="#0F1A5A" strokeWidth="1.5" fill="none" opacity="0.6">
                <rect x="120" y="60" width="360" height="180" rx="40" />
                <line x1="220" y1="60" x2="220" y2="240" strokeDasharray="4 4" />
                <line x1="380" y1="60" x2="380" y2="240" strokeDasharray="4 4" />
              </g>
              {danios.map((d, i) => {
                const positions = [
                  { x: 150, y: 80 },
                  { x: 450, y: 80 },
                  { x: 450, y: 220 },
                  { x: 150, y: 220 },
                  { x: 300, y: 50 },
                  { x: 300, y: 250 },
                ]
                const pos = positions[i % positions.length]
                const color =
                  d.severidad === 'leve'
                    ? '#16a34a'
                    : d.severidad === 'moderado'
                    ? '#d97706'
                    : '#dc2626'
                return (
                  <g key={d.id}>
                    <circle cx={pos.x} cy={pos.y} r="14" fill={color} opacity="0.9" />
                    <circle cx={pos.x} cy={pos.y} r="22" fill="none" stroke={color} strokeWidth="2" opacity="0.4">
                      <animate attributeName="r" from="14" to="28" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="white" fontWeight="700" fontSize="13">
                      {i + 1}
                    </text>
                  </g>
                )
              })}
              <text x="300" y="160" textAnchor="middle" fill="#4a4f63" fontWeight="600" fontSize="14" opacity="0.6">
                {danios.length === 0 ? 'Sin daños registrados' : `${danios.length} daño(s)`}
              </text>
            </svg>
          </div>
        </div>
      </div>

      <aside className="card p-4 sm:p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
          <Icon name="360" className="text-primary text-[24px]" filled />
          <h3 className="text-headline-md text-on-surface">Video 360°</h3>
        </div>
        <p className="text-caption sm:text-body-md text-on-surface-variant mb-3">
          Captura un video 360° del vehículo para complementar el reporte.
        </p>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-tertiary to-tertiary-container flex items-center justify-center text-on-tertiary">
          {video360.uploaded ? (
            <>
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 flex flex-col items-center">
                <button className="w-14 h-14 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-elev-2 hover:scale-110 transition">
                  <Icon name="play_arrow" className="text-[32px]" filled />
                </button>
                <span className="mt-2 text-caption font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">
                  {video360.duration}
                </span>
              </div>
            </>
          ) : video360.processing ? (
            <div className="text-center">
              <Icon name="progress_activity" className="text-[40px] animate-spin" />
              <p className="font-bold mt-2">Procesando…</p>
            </div>
          ) : (
            <div className="text-center">
              <Icon name="videocam" className="text-[48px] opacity-50" />
              <p className="text-caption opacity-80 mt-1">No se ha subido</p>
            </div>
          )}
        </div>

        <button
          onClick={handleVideoUpload}
          disabled={video360.processing}
          className="btn-primary mt-3"
        >
          <Icon name={video360.uploaded ? 'refresh' : 'cloud_upload'} />
          {video360.uploaded ? 'Reemplazar video' : 'Subir video 360°'}
        </button>

        <div className="mt-3 p-3 bg-warning-container/40 border border-warning/30 rounded-lg flex items-start gap-2">
          <Icon name="info" className="text-warning text-[20px] mt-0.5 shrink-0" filled />
          <p className="text-caption text-on-warning-container leading-snug">
            El video 360° forma parte obligatoria del reporte y no se debe perder
            durante el proceso.
          </p>
        </div>
      </aside>
    </div>
  )
}
