import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import { getDynamicSequences } from '../../utils/sequencesConfig'
import CarDiagram from '../../components/inspection/CarDiagram'
import { useToast } from '../../context/ToastContext'
import {
  analyzeVehiclePhoto,
  mapResultToInternalFormat,
} from '../../services/aiVehicleAnalysis'

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

// simulateAiClassification reemplazado por Gemini Vision — ver aiVehicleAnalysis.js

/**
 * Top-down car diagram – uses brand navy (#0F1A5A) for done, green for active/next.
 */
export default function Step3Photos({ state }) {
  const { photos, setPhoto, setPiezaEstado, setPiezaComentario, vehiculo } = state
  const toast = useToast()
  const railRef       = useRef(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const tipoVehiculo = vehiculo?.tipo || 'Particular'
  
  const visibleSequences = getDynamicSequences(vehiculo, photos)

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

  // Lee el archivo seleccionado y lanza el análisis
  const handleFileSelected = useCallback(async (file) => {
    if (!file) return

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido (JPG, PNG, WebP…)')
      return
    }

    // Convertir a base64 para mostrar y enviar a Gemini
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64DataUrl = e.target.result   // "data:image/jpeg;base64,..."
      await handleCapture(base64DataUrl)
    }
    reader.readAsDataURL(file)
  }, [activeSeq, seq, vehiculo]) // eslint-disable-line

  const handleCapture = async (imageDataUrl) => {
    // Si no se pasó imagen real, usar demo de Unsplash (modo preview)
    const thumbnail = imageDataUrl || SAMPLE_IMAGES[activeSeq]
    setPhoto(activeSeq, { analyzing: true, uploaded: true, thumbnail })

    toast.info('Analizando imagen con IA…', { title: 'Análisis automático' })

    try {
      const todasLasPiezas = [...seq.piezas, ...(seq.piezasOpcionales || [])]

      const analysis = await analyzeVehiclePhoto(
        thumbnail,
        todasLasPiezas,
        seq.nombre,
        seq.diagramZone,
        vehiculo,
      )

      // Aplicar resultados de Gemini al estado de piezas
      const piezasInternas = mapResultToInternalFormat(analysis)
      for (const pieza of todasLasPiezas) {
        if (piezasInternas[pieza]) {
          setPiezaEstado(activeSeq, pieza, piezasInternas[pieza].estado)
          if (piezasInternas[pieza].comentario) {
            setPiezaComentario(activeSeq, pieza, piezasInternas[pieza].comentario)
          }
        }
      }

      setPhoto(activeSeq, { 
        analyzing: false, 
        analyzed: true, 
        placa: null, 
        placaMatch: null, 
        issues: [],
        coincideModelo: analysis.coincideModelo !== false,
        motivoNoCoincide: analysis.motivoNoCoincide
      })
      toast.success('Foto analizada correctamente', { title: 'IA · Listo' })
    } catch (err) {
      console.error('[handleCapture] Error en análisis IA:', err)
      // Marcar la foto como no analizada para que el usuario pueda reintentar
      setPhoto(activeSeq, { analyzing: false, analyzed: false, uploaded: true, issues: [] })
      const isOverload = err.message?.includes('503') || err.message?.includes('high demand')
      toast.error(
        isOverload
          ? 'Gemini está saturado. Espera unos segundos y vuelve a subir la foto.'
          : `Error de análisis IA: ${err.message}`,
        { title: isOverload ? 'Servicio ocupado' : 'Error IA', duration: 6000 },
      )
    }
  }

  const goNextSeq = () => {
    const idx = visibleSequences.findIndex((s) => s.id === activeSeq)
    const next = visibleSequences[idx + 1]
    if (next) setActiveSeq(next.id)
  }

  const handleTabClick = (s, i) => {
    const firstUncompletedIdx = visibleSequences.findIndex(x => !photos[x.id]?.uploaded)
    // Permite navegar a secuencias anteriores o a la próxima disponible, pero no saltar
    if (firstUncompletedIdx !== -1 && i > firstUncompletedIdx && !photos[s.id]?.uploaded) {
      toast.error('Debes capturar las fotos pendientes (incluyendo detalles) antes de avanzar.', { title: 'Acción requerida' })
      return
    }
    setActiveSeq(s.id)
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
            {completed} / {Math.max(visibleSequences.length, 10)}
          </span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(completed / Math.max(visibleSequences.length, 10)) * 100}%`,
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
                onClick={() => handleTabClick(s, i)}
                className={clsx(
                  'shrink-0 snap-start flex items-center gap-2 px-3 min-h-[44px] py-2 rounded-full border-2 transition-all',
                  active
                    ? 'bg-primary text-on-primary border-primary shadow-elev-primary'
                    : ph?.analyzed
                    ? 'bg-success-container/60 text-on-success-container border-success/40 hover:border-success/70'
                    : ph?.uploaded
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : isNext
                    ? 'bg-amber-50 text-amber-800 border-amber-400 animate-pulse'
                    : 'bg-white text-on-surface-variant border-outline-variant/60 hover:border-primary/40',
                )}
              >
                {/* Thumbnail si hay foto */}
                {ph?.thumbnail && !active ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/50">
                    <img src={ph.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    active && 'bg-white/20 text-white',
                    !active && ph?.analyzed && 'bg-success text-white',
                    !active && ph?.uploaded && !ph?.analyzed && 'bg-primary text-white',
                    !active && isNext && 'bg-amber-500 text-white',
                    !active && !ph?.uploaded && !isNext && 'bg-surface-container text-on-surface-variant',
                  )}>
                    {ph?.analyzed ? <Icon name="check" className="text-[13px]" /> : i + 1}
                  </span>
                )}
                <span className="text-label-md whitespace-nowrap">{s.nombre}</span>
                {ph?.analyzing && <Icon name="auto_awesome" className="text-[14px] animate-pulse shrink-0" />}
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
            {photoState.uploaded && photoState.analyzed && (
              <StatusChip tone="success" status="Analizada" size="sm" className="shrink-0" />
            )}
          </div>

          {photoState.coincideModelo === false && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 mb-2 mt-2">
              <Icon name="error" className="text-[20px] shrink-0 text-red-600" filled />
              <div>
                <p className="font-bold text-label-md mb-0.5">Discrepancia de Vehículo</p>
                <p className="text-caption sm:text-body-md leading-snug">
                  {photoState.motivoNoCoincide || "La IA detectó que el vehículo en la foto no coincide con la marca/modelo indicados."}
                </p>
              </div>
            </div>
          )}

          {seq.isDynamicDetail && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 mb-2 mt-2">
              <Icon name="warning" className="text-[20px] shrink-0 text-amber-600" filled />
              <p className="text-caption sm:text-body-md leading-snug">
                La IA detectó una observación en <strong>{seq.piezas[0]}</strong>. Por favor, toma una foto más cercana para detallar el estado.
              </p>
            </div>
          )}

          {/* Optional pieces notice */}
          {seq.piezasOpcionales?.length > 0 && (
            <div className="flex items-start gap-2 p-2 bg-surface-container rounded-lg text-caption text-on-surface-variant">
              <Icon name="info" className="text-[16px] mt-0.5 shrink-0" />
              <span>Piezas no obligatorias: {seq.piezasOpcionales.join(', ')}</span>
            </div>
          )}

          {/* Inputs de archivo ocultos — cámara y galería */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />

          {/* Photo area */}
          <div className={clsx(
            'relative rounded-2xl overflow-hidden border-2 transition-all aspect-[4/3] sm:aspect-[16/9]',
            photoState.uploaded
              ? photoState.analyzed ? 'border-success/50' : 'border-primary/50'
              : 'border-dashed border-outline-variant/70 hover:border-primary/60 cursor-pointer bg-surface-container-low',
          )}
            onClick={!photoState.uploaded ? () => galleryInputRef.current?.click() : undefined}
          >
            {photoState.uploaded ? (
              <>
                <img src={photoState.thumbnail} alt={seq.nombre} className="w-full h-full object-cover absolute inset-0" />

                {/* Analyzing overlay */}
                {photoState.analyzing && (
                  <>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute inset-x-0 top-0">
                      <div className="h-1 bg-gradient-to-r from-primary via-accent-500 to-primary animate-shimmer" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                      <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center">
                        <Icon name="auto_awesome" className="text-[38px] animate-pulse" filled />
                      </div>
                      <div className="text-center px-4">
                        <p className="font-bold text-body-lg">Gemini Vision analizando…</p>
                        <p className="text-caption opacity-80 mt-0.5">Clasificando {seq.piezas.length} piezas detectadas en la imagen</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Analyzed badge */}
                {photoState.analyzed && !photoState.analyzing && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-success text-on-success px-3 py-1.5 rounded-full text-caption font-bold shadow-elev-1">
                    <Icon name="verified" className="text-[15px]" filled /> IA ✓
                  </div>
                )}

                {/* Recapture overlay — aparece al hacer hover */}
                {!photoState.analyzing && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-end justify-end p-3 opacity-0 hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click() }}
                      className="inline-flex items-center gap-1.5 bg-white/90 text-on-surface rounded-full px-3 py-1.5 text-caption font-bold shadow"
                    >
                      <Icon name="replay" className="text-[15px]" /> Cambiar foto
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state — zona sin capturar */
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 gap-3">
                <img src={SAMPLE_IMAGES[seq.id]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-5" />
                <div className="relative z-10 w-20 h-20 rounded-2xl border-2 border-dashed border-primary/40 bg-white flex items-center justify-center shadow-sm">
                  <Icon name={seq.icon} className="text-[34px] text-primary/70" filled />
                </div>
                <div className="relative z-10">
                  <p className="font-bold text-on-surface text-headline-md">{seq.nombre}</p>
                  <p className="text-caption text-on-surface-variant mt-1 max-w-xs leading-snug">{seq.descripcion}</p>
                </div>
                <div className="relative z-10 flex flex-col xs:flex-row gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
                    className="btn-accent"
                  >
                    <Icon name="photo_camera" /> Cámara
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click() }}
                    className="btn-primary"
                  >
                    <Icon name="photo_library" /> Galería
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mini resumen de piezas tras análisis */}
          {photoState.analyzed && !photoState.analyzing && Object.keys(photoState.piezas ?? {}).length > 0 && (() => {
            const ps = Object.values(photoState.piezas)
            const B = ps.filter((p) => p.estado === 'B').length
            const R = ps.filter((p) => p.estado === 'R').length
            const M = ps.filter((p) => p.estado === 'M').length
            return (
              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
                    <Icon name="auto_awesome" className="text-primary text-[16px]" filled />
                    Resultado IA — {seq.nombre}
                  </p>
                  <div className="flex gap-2 text-[11px] font-bold">
                    <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{B}B</span>
                    {R > 0 && <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">{R}R</span>}
                    {M > 0 && <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">{M}M</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {Object.entries(photoState.piezas).map(([nombre, p]) => {
                    const st = { B: ['#DCFCE7','#16A34A'], R: ['#FEF3C7','#D97706'], M: ['#FEE2E2','#DC2626'], NE: ['#F1F5F9','#64748B'] }
                    const [bg, fg] = st[p.estado] ?? st.B
                    return (
                      <div key={nombre} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ backgroundColor: bg }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fg }} />
                        <span className="text-[11px] font-semibold truncate" style={{ color: fg }}>{nombre}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Siguiente secuencia */}
          {photoState.uploaded && photoState.analyzed && !photoState.analyzing && (() => {
            const nextIdx = visibleSequences.findIndex((s) => s.id === activeSeq) + 1
            const nextSeq = visibleSequences[nextIdx]
            return nextSeq ? (
              <button onClick={goNextSeq} className="btn-accent w-full">
                <Icon name="arrow_forward" />
                Siguiente — {nextSeq.nombre}
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success-container/60 border border-success/30">
                <Icon name="task_alt" className="text-success text-[22px] shrink-0" filled />
                <div>
                  <p className="font-bold text-on-success-container text-label-md">¡Todas las zonas capturadas!</p>
                  <p className="text-caption text-on-success-container/80">Avanza al siguiente paso para continuar.</p>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

    </div>
  )
}
