import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import {
  ESTADO_PIEZA,
  ESTADO_PIEZA_LABEL,
  PHOTO_SEQUENCES,
} from '../../data/mockData'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

const SAMPLE_IMAGES = {
  'seq-frontal-placa':
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80',
  'seq-frontal-lat-der':
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-placa':
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-lat-der':
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80',
  'seq-frontal-lat-izq':
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-lat-izq':
    'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1400&q=80',
  'seq-serial':
    'https://images.unsplash.com/photo-1597007030739-6d2e7172ee70?auto=format&fit=crop&w=1400&q=80',
  'seq-seguridad':
    'https://images.unsplash.com/photo-1471174466202-bd1bba73a8ec?auto=format&fit=crop&w=1400&q=80',
  'seq-tablero':
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=80',
  'seq-interior':
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=80',
  'seq-repuesto':
    'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&w=1400&q=80',
  'seq-danios':
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1400&q=80',
}

const simulateAiClassification = (piezas) => {
  const estados = [ESTADO_PIEZA.BUENO, ESTADO_PIEZA.BUENO, ESTADO_PIEZA.BUENO, ESTADO_PIEZA.REGULAR, ESTADO_PIEZA.MALO]
  return piezas.reduce((acc, p) => {
    acc[p] = { estado: estados[Math.floor(Math.random() * estados.length)], comentario: '' }
    return acc
  }, {})
}

/**
 * Top-down car diagram – uses brand navy (#0F1A5A) for done, green for active/next.
 * For perito: shows orange dot when AI found R/M pieces.
 * For client: no damage indicators shown.
 */
function CarDiagram({ sequences, photos, activeSeqId, showDamageIndicators }) {
  const zones = {
    'front':       { label: 'Frontal',   x: 80,  y: 10,  w: 80, h: 55 },
    'front-right': { label: 'Del.Der',   x: 160, y: 60,  w: 55, h: 100 },
    'rear-right':  { label: 'Tras.Der',  x: 160, y: 260, w: 55, h: 100 },
    'rear':        { label: 'Trasera',   x: 80,  y: 360, w: 80, h: 55 },
    'rear-left':   { label: 'Tras.Izq',  x: 25,  y: 260, w: 55, h: 100 },
    'front-left':  { label: 'Del.Izq',   x: 25,  y: 60,  w: 55, h: 100 },
    'serial':      { label: 'Serial',    x: 95,  y: 185, w: 50, h: 30 },
    'interior':    { label: 'Interior',  x: 80,  y: 160, w: 80, h: 60 },
    'dashboard':   { label: 'Tablero',   x: 85,  y: 140, w: 70, h: 25 },
    'trunk':       { label: 'Maletero',  x: 85,  y: 320, w: 70, h: 40 },
    'damages':     { label: 'Daños',     x: 85,  y: 220, w: 70, h: 25 },
  }

  const getZoneStatus = (zone) => {
    const seq = sequences.find((s) => s.diagramZone === zone)
    if (!seq) return 'hidden'
    const ph = photos[seq.id]
    if (seq.id === activeSeqId) return 'active'
    if (ph?.uploaded) return 'done'
    const activeIdx = sequences.findIndex((s) => s.id === activeSeqId)
    const seqIdx = sequences.findIndex((s) => s.id === seq.id)
    if (seqIdx === activeIdx + 1) return 'next'
    return 'pending'
  }

  const getZoneHasDamage = (zone) => {
    if (!showDamageIndicators) return false
    const seq = sequences.find((s) => s.diagramZone === zone)
    if (!seq) return false
    const ph = photos[seq.id]
    if (!ph?.analyzed) return false
    return Object.values(ph.piezas).some(
      (p) => p.estado === ESTADO_PIEZA.REGULAR || p.estado === ESTADO_PIEZA.MALO,
    )
  }

  // Brand colors: navy for done, green for active/next, slate for pending
  const STATUS_FILL = {
    active: '#16a34a',   // green-700 — next to capture
    next:   '#86efac',   // green-300 — upcoming
    done:   '#0F1A5A',   // brand navy — completed
    pending:'#e2e8f0',   // slate-200
    hidden: 'transparent',
  }
  const STATUS_STROKE = {
    active: '#15803d',
    next:   '#4ade80',
    done:   '#162A7F',
    pending:'#cbd5e1',
    hidden: 'none',
  }

  return (
    <svg viewBox="0 0 240 430" className="w-full max-w-[180px] mx-auto drop-shadow-sm" aria-label="Plano digital del vehículo">
      <rect x="55" y="55" width="130" height="310" rx="28" fill="#f1f5f9" stroke="#c8ccdb" strokeWidth="2" />
      <rect x="70" y="130" width="100" height="140" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="60" cy="110" rx="16" ry="22" fill="#334155" />
      <ellipse cx="180" cy="110" rx="16" ry="22" fill="#334155" />
      <ellipse cx="60" cy="320" rx="16" ry="22" fill="#334155" />
      <ellipse cx="180" cy="320" rx="16" ry="22" fill="#334155" />
      {Object.entries(zones).map(([zone, z]) => {
        const status = getZoneStatus(zone)
        const hasDamage = getZoneHasDamage(zone)
        if (status === 'hidden') return null
        return (
          <g key={zone}>
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h} rx="6"
              fill={STATUS_FILL[status]}
              stroke={hasDamage ? '#f59e0b' : STATUS_STROKE[status]}
              strokeWidth={status === 'active' ? 2.5 : 1.5}
              opacity={status === 'pending' ? 0.5 : 0.85}
            />
            {status === 'done' && (
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">✓</text>
            )}
            {status === 'active' && (
              <>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" fill="none" stroke="#16a34a" strokeWidth="3" opacity="0.6">
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
                </rect>
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 5} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{z.label}</text>
              </>
            )}
            {hasDamage && status === 'done' && (
              <circle cx={z.x + z.w - 8} cy={z.y + 8} r="6" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
            )}
          </g>
        )
      })}
      <text x="120" y="425" textAnchor="middle" fill="#7a7f95" fontSize="9" fontWeight="500">Plano digital del vehículo</text>
    </svg>
  )
}

export default function Step3Photos({ state }) {
  const { photos, setPhoto, setPiezaEstado, setPiezaComentario, vehiculo } = state
  const { user } = useAuth()
  const isPerito = user?.role === 'perito' || user?.role === 'admin'
  const toast = useToast()
  const railRef = useRef(null)

  const tipoVehiculo = vehiculo?.tipo || 'Particular'
  const visibleSequences = PHOTO_SEQUENCES.filter(
    (s) => !s.excludeVehicleTypes?.includes(tipoVehiculo),
  )

  const [activeSeq, setActiveSeq] = useState(visibleSequences[0]?.id)
  const seq = visibleSequences.find((s) => s.id === activeSeq) || visibleSequences[0]
  const photoState = photos[seq?.id] ?? { uploaded: false, analyzing: false, analyzed: false, piezas: {}, issues: [] }
  const completed = visibleSequences.filter((s) => photos[s.id]?.uploaded).length

  useEffect(() => {
    const first = visibleSequences.find((s) => !photos[s.id]?.uploaded)
    if (first && !activeSeq) setActiveSeq(first.id)
  }, []) // eslint-disable-line

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const idx = visibleSequences.findIndex((s) => s.id === activeSeq)
    const el = rail.querySelectorAll('[data-seq]')[idx]
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeSeq]) // eslint-disable-line

  const handleCapture = () => {
    setPhoto(activeSeq, { analyzing: true, uploaded: true, thumbnail: SAMPLE_IMAGES[activeSeq] })

    if (isPerito) {
      toast.info('Analizando imagen con IA…', { title: 'Validación IA' })
    } else {
      toast.info('Procesando foto…', { title: 'Captura' })
    }

    setTimeout(() => {
      const issues = []
      let placa = null
      let placaMatch = null

      if (seq.requierePlaca) {
        const detected = Math.random() > 0.2
        placa = detected ? vehiculo?.placa || 'XYZ-1234' : 'XYC-9999'
        placaMatch = placa === (vehiculo?.placa || 'XYZ-1234')
        if (isPerito && !placaMatch) {
          issues.push({ tone: 'warning', text: `Placa detectada (${placa}) no coincide con el carnet (${vehiculo?.placa || 'XYZ-1234'}).` })
        }
      }

      // AI classifies pieces — results only shown to perito
      const aiPiezas = simulateAiClassification(seq.piezas)
      if (isPerito) {
        const badCount = Object.values(aiPiezas).filter(
          (p) => p.estado === ESTADO_PIEZA.REGULAR || p.estado === ESTADO_PIEZA.MALO,
        ).length
        issues.unshift({
          tone: badCount === 0 ? 'success' : 'warning',
          text: `IA detectó ${seq.piezas.length} piezas. ${badCount} con observaciones.`,
        })
      }

      seq.piezas.forEach((pieza) => {
        if (aiPiezas[pieza]) setPiezaEstado(activeSeq, pieza, aiPiezas[pieza].estado)
      })

      setPhoto(activeSeq, { analyzing: false, analyzed: true, placa, placaMatch, issues })

      if (isPerito) {
        toast.success('Imagen validada por IA', { title: 'Análisis completado' })
      } else {
        toast.success('¡Foto guardada correctamente!', { title: 'Captura exitosa' })
      }
    }, 1800)
  }

  const goNextSeq = () => {
    const idx = visibleSequences.findIndex((s) => s.id === activeSeq)
    const next = visibleSequences[idx + 1]
    if (next) setActiveSeq(next.id)
  }

  if (!seq) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Excluded vehicle type notice */}
      {(tipoVehiculo === 'Moto' || tipoVehiculo === 'Remolque') && (
        <div className="flex items-start gap-2 p-3 bg-warning-container/50 border border-warning/30 rounded-xl text-on-warning-container">
          <Icon name="info" className="text-[20px] mt-0.5 shrink-0" filled />
          <p className="text-caption sm:text-body-md leading-snug">
            Para vehículos tipo <strong>{tipoVehiculo}</strong>, las secuencias fotográficas panorámicas frontales no aplican.
          </p>
        </div>
      )}

      {/* Progress + pill rail */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-headline-md text-on-surface">Secuencias fotográficas</h3>
          <span className="text-caption font-bold bg-primary text-on-primary px-2.5 py-1 rounded-full">
            {completed} / {visibleSequences.length}
          </span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(completed / visibleSequences.length) * 100}%`,
              background: 'linear-gradient(to right, #0F1A5A, #E84F51)',
            }}
          />
        </div>
        <div ref={railRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1 snap-x snap-mandatory">
          {visibleSequences.map((s, i) => {
            const ph = photos[s.id]
            const active = activeSeq === s.id
            const isNext = !active && !ph?.uploaded && visibleSequences.findIndex((x) => x.id === activeSeq) + 1 === i
            return (
              <button
                key={s.id}
                data-seq={s.id}
                onClick={() => setActiveSeq(s.id)}
                className={clsx(
                  'shrink-0 snap-start flex items-center gap-2 px-3 min-h-[44px] py-2.5 rounded-full border-2 transition-all',
                  active
                    ? 'bg-primary text-on-primary border-primary shadow-elev-primary'
                    : ph?.uploaded
                    ? 'bg-brand-50 text-primary border-brand-200'
                    : isNext
                    ? 'bg-green-50 text-green-800 border-green-400 animate-pulse'
                    : 'bg-white text-on-surface-variant border-outline-variant/60 hover:border-primary/40',
                )}
              >
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    active && 'bg-white/20 text-white',
                    !active && ph?.uploaded && 'bg-primary text-white',
                    !active && isNext && 'bg-green-500 text-white',
                    !active && !ph?.uploaded && !isNext && 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {ph?.uploaded ? <Icon name="check" className="text-[14px]" /> : i + 1}
                </span>
                <span className="text-label-md whitespace-nowrap">{s.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main layout: diagram + capture */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        {/* Vehicle diagram */}
        <div className="card p-3 sm:p-4 flex flex-col items-center">
          <h4 className="text-label-md text-on-surface-variant text-center mb-2 font-semibold uppercase tracking-wide text-[11px]">
            Plano del vehículo
          </h4>
          <CarDiagram
            sequences={visibleSequences}
            photos={photos}
            activeSeqId={activeSeq}
            showDamageIndicators={isPerito}
          />
          <div className="mt-3 w-full flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-3.5 rounded bg-green-600 inline-block shrink-0" />
              <span className="text-on-surface-variant">Capturando ahora</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3.5 rounded bg-primary inline-block shrink-0" />
              <span className="text-on-surface-variant">Completada ✓</span>
            </div>
            {isPerito && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-3.5 rounded bg-warning inline-block shrink-0" />
                <span className="text-on-surface-variant">Con observaciones IA</span>
              </div>
            )}
          </div>
        </div>

        {/* Capture zone */}
        <div className="card p-3 sm:p-5 flex flex-col gap-3">
          {/* Sequence header */}
          <div className="flex items-start sm:items-center gap-2 pb-3 border-b border-outline-variant/50">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-elev-primary">
              <Icon name={seq.icon} className="text-[22px]" filled />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-headline-md text-on-surface truncate">{seq.nombre}</h3>
              <p className="text-caption text-on-surface-variant line-clamp-2">{seq.descripcion}</p>
            </div>
            {/* StatusChip only for perito */}
            {isPerito && photoState.uploaded && photoState.analyzed && (
              <StatusChip
                tone={photoState.placaMatch === false ? 'warning' : 'success'}
                status={photoState.placaMatch === false ? 'Revisar' : 'Validada'}
                size="sm"
                className="shrink-0"
              />
            )}
          </div>

          {/* Optional pieces notice */}
          {seq.piezasOpcionales?.length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-surface-container rounded-lg text-caption text-on-surface-variant">
              <Icon name="info" className="text-[16px] mt-0.5 shrink-0" />
              <span>Piezas no obligatorias: {seq.piezasOpcionales.join(', ')}</span>
            </div>
          )}

          {/* Photo area */}
          <div className={clsx(
            'relative rounded-xl overflow-hidden border-2 border-dashed transition-all aspect-[16/10] sm:aspect-[16/9]',
            photoState.uploaded ? 'border-success/40' : 'border-outline-variant/70 hover:border-primary/60',
          )}>
            {photoState.uploaded ? (
              <>
                <img src={photoState.thumbnail} alt={seq.nombre} className="w-full h-full object-cover absolute inset-0" />

                {/* Processing overlay — same visual for both roles */}
                {photoState.analyzing && (
                  <>
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-2">
                        <Icon name="photo_camera" className="text-[28px] sm:text-[32px] animate-pulse" filled />
                      </div>
                      <p className="font-bold text-body-md sm:text-body-lg">Procesando…</p>
                      <div className="absolute inset-x-0 top-0 h-1 animate-shimmer" style={{ background: '#E84F51' }} />
                    </div>
                  </>
                )}

                {/* Placa overlay — ONLY for perito */}
                {isPerito && photoState.analyzed && photoState.placa && (
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/65 backdrop-blur text-white rounded-lg text-caption font-mono tracking-widest border border-white/20">
                    PLACA · {photoState.placa}
                  </div>
                )}

                {/* Success badge for client (no AI text) */}
                {!isPerito && photoState.analyzed && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-success text-on-success px-2.5 py-1 rounded-full text-caption font-bold shadow">
                    <Icon name="check_circle" className="text-[14px]" filled />
                    Guardada
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                <img src={SAMPLE_IMAGES[seq.id]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
                <div className="relative z-10 flex flex-col items-center max-w-sm">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-elev-2 flex items-center justify-center mb-2">
                    <Icon name="add_a_photo" className="text-[26px] sm:text-[28px] text-primary" filled />
                  </div>
                  <h4 className="text-headline-md text-on-surface mb-1">Tomar foto</h4>
                  <p className="text-caption sm:text-body-md text-on-surface-variant mb-3 max-w-xs">
                    {isPerito
                      ? 'Foto al instante para análisis de IA y clasificación de piezas.'
                      : 'Foto al instante. Sigue las instrucciones del recorrido guiado.'}
                  </p>
                  <button onClick={handleCapture} className="btn-primary">
                    <Icon name="photo_camera" /> Tomar foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI issues — ONLY for perito */}
          {isPerito && photoState.issues.length > 0 && photoState.analyzed && (
            <div className="flex flex-col gap-2 animate-fade-in">
              {photoState.issues.map((iss, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-start gap-2 p-2.5 rounded-lg border',
                    iss.tone === 'success' && 'bg-success-container/50 border-success/30 text-on-success-container',
                    iss.tone === 'warning' && 'bg-warning-container/60 border-warning/30 text-on-warning-container',
                    iss.tone === 'error' && 'bg-error-container border-error/30 text-on-error-container',
                  )}
                >
                  <Icon name={iss.tone === 'success' ? 'check_circle' : 'warning'} className="text-[20px] mt-0.5 shrink-0" filled />
                  <p className="text-caption sm:text-body-md flex-1 leading-snug">{iss.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {photoState.uploaded && (
            <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2">
              <button
                onClick={() => setPhoto(activeSeq, { uploaded: false, analyzed: false, thumbnail: null, placa: null, placaMatch: null, issues: [] })}
                className="btn-soft sm:flex-1"
              >
                <Icon name="refresh" /> Recapturar
              </button>
              {/* Re-analyze button only for perito */}
              {isPerito && (
                <button onClick={handleCapture} className="btn-ghost sm:flex-1">
                  <Icon name="auto_awesome" /> Re-analizar IA
                </button>
              )}
            </div>
          )}

          {photoState.uploaded && photoState.analyzed && (
            <button onClick={goNextSeq} className="btn-primary w-full">
              <Icon name="arrow_forward" /> Siguiente secuencia
            </button>
          )}
        </div>
      </div>

      {/* ── PERITO ONLY: piece classification ─────────────────────────── */}
      {isPerito && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/40">
            <div>
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <Icon name="admin_panel_settings" className="text-primary text-[20px]" filled />
                Clasificación de piezas
              </h3>
              <p className="text-caption text-on-surface-variant">Estado de cada pieza detectada en esta secuencia.</p>
            </div>
            <div className="text-caption hidden sm:flex items-center gap-3 text-on-surface-variant">
              <span><strong className="text-success">B</strong> Bueno</span>
              <span><strong className="text-warning">R</strong> Regular</span>
              <span><strong className="text-error">M</strong> Malo</span>
              <span><strong>N/E</strong> No existe</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...seq.piezas, ...(seq.piezasOpcionales || [])].map((pieza) => {
              const data = photoState.piezas[pieza] ?? { estado: ESTADO_PIEZA.BUENO, comentario: '' }
              const isOpcional = seq.piezasOpcionales?.includes(pieza)
              return (
                <div
                  key={pieza}
                  className={clsx(
                    'border rounded-xl p-3',
                    data.estado === ESTADO_PIEZA.MALO
                      ? 'border-error/50 bg-error-container/20'
                      : data.estado === ESTADO_PIEZA.REGULAR
                      ? 'border-warning/40 bg-warning-container/20'
                      : 'border-outline-variant/50 bg-surface-container-low/40',
                  )}
                >
                  <div className="flex items-center gap-1 mb-2">
                    <p className="text-label-md text-on-surface truncate flex-1">{pieza}</p>
                    {isOpcional && (
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded-full shrink-0">Opcional</span>
                    )}
                    {data.estado === ESTADO_PIEZA.REGULAR && <span className="w-2 h-2 rounded-full bg-warning shrink-0" />}
                    {data.estado === ESTADO_PIEZA.MALO && <span className="w-2 h-2 rounded-full bg-error shrink-0" />}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { v: ESTADO_PIEZA.BUENO,    label: 'B',   tone: 'success' },
                      { v: ESTADO_PIEZA.REGULAR,  label: 'R',   tone: 'warning' },
                      { v: ESTADO_PIEZA.MALO,     label: 'M',   tone: 'error'   },
                      { v: ESTADO_PIEZA.NO_EXISTE,label: 'N/E', tone: 'neutral' },
                    ].map(({ v, label, tone }) => {
                      const active = data.estado === v
                      return (
                        <button
                          key={v}
                          onClick={() => setPiezaEstado(activeSeq, pieza, v)}
                          title={ESTADO_PIEZA_LABEL[v]}
                          className={clsx(
                            'min-h-[44px] py-2 rounded-lg text-label-md font-bold border transition active:scale-95',
                            active && tone === 'success' && 'bg-success text-on-success border-success',
                            active && tone === 'warning' && 'bg-warning text-on-warning border-warning',
                            active && tone === 'error' && 'bg-error text-on-error border-error',
                            active && tone === 'neutral' && 'bg-on-surface text-surface border-on-surface',
                            !active && 'bg-white text-on-surface-variant border-outline-variant hover:border-on-surface',
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {data.estado !== ESTADO_PIEZA.BUENO && data.estado !== ESTADO_PIEZA.NO_EXISTE && (
                    <input
                      value={data.comentario}
                      onChange={(e) => setPiezaComentario(activeSeq, pieza, e.target.value)}
                      placeholder="Detalle del estado…"
                      className="input mt-2 text-caption"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
