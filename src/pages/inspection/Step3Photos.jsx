import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import { getDynamicSequences, getSequenceCompletionStats, isDetailSequence, isOptionalSequence } from '../../utils/sequencesConfig'
import CarDiagram from '../../components/inspection/CarDiagram'
import { useToast } from '../../context/ToastContext'
import {
  analyzeVehiclePhoto,
  mapResultToInternalFormat,
} from '../../services/aiVehicleAnalysis'
import {
  evaluateVehiclePhotoMatch,
  getReferenceFingerprintFromPhotos,
  VEHICLE_MATCH_STATUS,
} from '../../utils/vehiclePhotoMatch'
import { formatDamageText } from '../../utils/fieldValidators'

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
  const {
    photos,
    setPhoto,
    commitPhotoAnalysis,
    removeDetailPhotosForParent,
    vehiculo,
    observacionesRiesgo,
    setObservacionesRiesgo,
  } = state
  const toast = useToast()
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const tipoVehiculo = vehiculo?.tipo || 'Particular'
  
  const visibleSequences = getDynamicSequences(vehiculo, photos)
  const completion = getSequenceCompletionStats(visibleSequences, photos)

  const [activeSeq, setActiveSeq] = useState(visibleSequences[0]?.id)
  const [vehicleMatchRejections, setVehicleMatchRejections] = useState({})
  const [seqListOpen, setSeqListOpen] = useState(false)
  const seq = visibleSequences.find((s) => s.id === activeSeq) || visibleSequences[0]
  const photoState = photos[seq?.id] ?? { uploaded: false, analyzing: false, analyzed: false, piezas: {}, issues: [] }

  useEffect(() => {
    const first = visibleSequences.find((s) => !isOptionalSequence(s) && !photos[s.id]?.uploaded)
    if (first && !activeSeq) setActiveSeq(first.id)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!visibleSequences.some((s) => s.id === activeSeq) && visibleSequences[0]) {
      setActiveSeq(visibleSequences[0].id)
    }
  }, [visibleSequences, activeSeq])

  useEffect(() => {
    if (!activeSeq) return
    const candidates = document.querySelectorAll(`[data-seq="${activeSeq}"]`)
    for (const el of candidates) {
      if (el.offsetParent === null) continue
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      break
    }
  }, [activeSeq, seqListOpen])

  const goNextFrom = useCallback((fromId) => {
    const idx = visibleSequences.findIndex((s) => s.id === fromId)
    const next = visibleSequences[idx + 1]
    if (next) setActiveSeq(next.id)
  }, [visibleSequences])

  // Lee el archivo seleccionado y lanza el análisis
  const handleFileSelected = useCallback(async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido (JPG, PNG, WebP…)')
      return
    }

    setVehicleMatchRejections((prev) => {
      const next = { ...prev }
      delete next[activeSeq]
      return next
    })

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64DataUrl = e.target.result
      await handleCapture(base64DataUrl)
    }
    reader.readAsDataURL(file)
  }, [activeSeq, seq, vehiculo, photos, commitPhotoAnalysis, removeDetailPhotosForParent]) // eslint-disable-line

  const buildEmptyPiezas = (piezaNames) =>
    piezaNames.reduce((acc, name) => {
      acc[name] = { estado: 'B', comentario: '' }
      return acc
    }, {})

  const rejectVehiclePhoto = (seqId, piezaNames, match) => {
    setPhoto(seqId, {
      uploaded: false,
      analyzing: false,
      analyzed: false,
      thumbnail: null,
      placa: null,
      placaMatch: null,
      coincideModelo: null,
      motivoNoCoincide: null,
      vehicleMatchStatus: match.status,
      issues: [],
      piezas: buildEmptyPiezas(piezaNames),
    })
    if (!seqId.startsWith('seq-detail-')) {
      removeDetailPhotosForParent(seqId)
    }
    setVehicleMatchRejections((prev) => ({
      ...prev,
      [seqId]: { message: match.message, status: match.status },
    }))

    if (match.status === VEHICLE_MATCH_STATUS.OTHER) {
      toast.error(match.message, {
        title: 'Vehículo no coincide',
        duration: 7000,
      })
    } else if (match.status === VEHICLE_MATCH_STATUS.WRONG_CONTENT) {
      toast.error(match.message, {
        title: 'Foto incorrecta',
        duration: 7000,
      })
    } else {
      toast.warning(match.message, {
        title: 'Foto no concluyente',
        duration: 7000,
      })
    }
  }

  const clearOptionalPhoto = () => {
    if (!seq || !isOptionalSequence(seq)) return
    setPhoto(activeSeq, {
      uploaded: false,
      analyzing: false,
      analyzed: false,
      thumbnail: null,
      placa: null,
      placaMatch: null,
      coincideModelo: null,
      motivoNoCoincide: null,
      vehicleMatchStatus: null,
      vehicleFingerprint: null,
      issues: [],
      piezas: buildEmptyPiezas(seq.piezas || []),
    })
    setVehicleMatchRejections((prev) => {
      if (!prev[activeSeq]) return prev
      const next = { ...prev }
      delete next[activeSeq]
      return next
    })
    toast.info('Foto eliminada. Puedes volver a cargar o omitir esta secuencia.', {
      title: 'Secuencia opcional',
    })
  }

  const handleCapture = async (imageDataUrl) => {
    // Congelar secuencia actual: el análisis sigue en background mientras pedimos la siguiente
    const seqId = activeSeq
    const currentSeq = seq
    if (!seqId || !currentSeq) return

    const thumbnail = imageDataUrl || SAMPLE_IMAGES[seqId]
    setPhoto(seqId, { analyzing: true, uploaded: true, thumbnail })
    goNextFrom(seqId)

    toast.info(`Analizando «${currentSeq.nombre}»…`, { title: 'Análisis automático' })

    try {
      const todasLasPiezas = [...currentSeq.piezas, ...(currentSeq.piezasOpcionales || [])]

      const analysis = await analyzeVehiclePhoto(
        thumbnail,
        todasLasPiezas,
        currentSeq.nombre,
        currentSeq.diagramZone,
        vehiculo,
        currentSeq.descripcion,
      )

      const referenceFingerprint = getReferenceFingerprintFromPhotos(photos)

      const vehicleMatch = evaluateVehiclePhotoMatch(analysis, vehiculo, {
        referenceFingerprint,
        diagramZone: currentSeq.diagramZone,
      })
      if (!vehicleMatch.allowUpload) {
        rejectVehiclePhoto(seqId, todasLasPiezas, vehicleMatch)
        return
      }

      const piezasInternas = mapResultToInternalFormat(analysis)
      const piezasUpdates = {}
      for (const pieza of todasLasPiezas) {
        if (piezasInternas[pieza]) {
          piezasUpdates[pieza] = {
            estado: piezasInternas[pieza].estado,
            ...(piezasInternas[pieza].comentario
              ? { comentario: piezasInternas[pieza].comentario }
              : {}),
          }
        }
      }

      commitPhotoAnalysis(seqId, {
        piezasUpdates,
        patch: {
          analyzing: false,
          analyzed: true,
          uploaded: true,
          thumbnail,
          placa: analysis.placaDetectada || analysis.verificacionVehiculo?.placaDetectada || null,
          placaMatch: analysis.verificacionVehiculo?.coincidePlaca ?? null,
          issues: [],
          coincideModelo: true,
          motivoNoCoincide: null,
          vehicleMatchStatus: VEHICLE_MATCH_STATUS.SAME,
          vehicleFingerprint:
            vehicleMatch.fingerprint ?? analysis.vehicleFingerprint ?? null,
          ...(isDetailSequence(currentSeq)
            ? {
                isDynamicDetail: true,
                parentSeqId: currentSeq.parentSeqId,
                piezaNombre: currentSeq.piezaNombre,
              }
            : {}),
        },
      })
      setVehicleMatchRejections((prev) => {
        const next = { ...prev }
        delete next[seqId]
        return next
      })

      if (isDetailSequence(currentSeq)) {
        const pieza = currentSeq.piezaNombre
        const estado = piezasUpdates[pieza]?.estado
        if (estado === 'B' || estado === 'NE') {
          toast.success(
            `«${pieza}»: la foto de detalle no confirma el daño. Se toma como referencia y se descarga la observación.`,
            { title: 'Validación · Limpio', duration: 6500 },
          )
        } else if (estado === 'R' || estado === 'M') {
          toast.success(
            `«${pieza}»: daño confirmado en la foto de detalle. Se mantiene la observación.`,
            { title: 'Validación · Confirmado', duration: 5500 },
          )
        } else {
          toast.success(`«${currentSeq.nombre}» lista`, { title: 'IA · Listo' })
        }
      } else {
        toast.success(`«${currentSeq.nombre}» lista`, { title: 'IA · Listo' })
      }
    } catch (err) {
      console.error('[handleCapture] Error en análisis IA:', err)
      setPhoto(seqId, { analyzing: false, analyzed: false, uploaded: true, issues: [] })
      const isOverload = err.message?.includes('503') || err.message?.includes('high demand')
      toast.error(
        isOverload
          ? `Gemini saturado en «${currentSeq.nombre}». Vuelve a subir esa foto.`
          : `Error en «${currentSeq.nombre}»: ${err.message}`,
        { title: isOverload ? 'Servicio ocupado' : 'Error IA', duration: 6000 },
      )
    }
  }

  const goNextSeq = () => {
    goNextFrom(activeSeq)
  }

  const handleTabClick = (s, { closeMobileList = false } = {}) => {
    setActiveSeq(s.id)
    if (closeMobileList) setSeqListOpen(false)
  }

  const renderSequenceButton = (s, i) => {
    const ph = photos[s.id]
    const active = activeSeq === s.id
    const isDetail = isDetailSequence(s)
    const nextRequiredIdx = visibleSequences.findIndex(
      (x) => !isOptionalSequence(x) && !photos[x.id]?.uploaded,
    )
    const isNext = !active && !ph?.uploaded && i === nextRequiredIdx

    return (
      <div key={s.id} className={clsx(isDetail && 'pl-3 border-l-2 border-amber-300/80 ml-2')}>
        <button
          type="button"
          data-seq={s.id}
          onClick={() => handleTabClick(s, { closeMobileList: true })}
          className={clsx(
            'flex items-center gap-3 p-2 rounded-xl border-2 transition-all text-left w-full',
            isDetail && 'py-1.5',
            active
              ? 'bg-primary text-on-primary border-primary shadow-elev-primary'
              : ph?.analyzed
              ? 'bg-success-container/60 text-on-success-container border-success/40 hover:border-success/70'
              : ph?.uploaded
              ? 'bg-primary/10 text-primary border-primary/30'
              : isNext
              ? 'bg-amber-50 text-amber-800 border-amber-400 animate-pulse'
              : isDetail
              ? 'bg-amber-50/60 text-amber-950 border-amber-200/80 hover:border-amber-400/60'
              : 'bg-white text-on-surface-variant border-outline-variant/60 hover:border-primary/40',
          )}
        >
          {ph?.thumbnail && !active ? (
            <div className={clsx(
              'rounded-full overflow-hidden shrink-0 border border-white/50',
              isDetail ? 'w-7 h-7' : 'w-8 h-8',
            )}>
              <img src={ph.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className={clsx(
              'rounded-full flex items-center justify-center font-bold shrink-0',
              isDetail ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-[12px]',
              active && 'bg-white/20 text-white',
              !active && ph?.analyzed && 'bg-success text-white',
              !active && ph?.uploaded && !ph?.analyzed && 'bg-primary text-white',
              !active && isNext && 'bg-amber-500 text-white',
              !active && isDetail && !ph?.uploaded && !isNext && 'bg-amber-100 text-amber-800',
              !active && !ph?.uploaded && !isNext && !isDetail && 'bg-surface-container text-on-surface-variant',
            )}>
              {ph?.analyzed ? (
                <Icon name="check" className={isDetail ? 'text-[14px]' : 'text-[16px]'} />
              ) : isDetail ? (
                <Icon name="zoom_in" className="text-[14px]" />
              ) : (
                <Icon name="image" className={isDetail ? 'text-[14px]' : 'text-[16px]'} />
              )}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {isDetail && (
              <p className={clsx(
                'text-[10px] font-semibold uppercase tracking-wide truncate mb-0.5',
                active ? 'text-white/80' : 'text-amber-700',
              )}>
                Detalle · {s.parentNombre}
              </p>
            )}
            <p className={clsx('font-bold truncate', isDetail ? 'text-[13px]' : 'text-label-md')}>
              {isDetail ? s.piezaNombre || s.nombre : s.nombre}
            </p>
            {isOptionalSequence(s) && !active && (
              <p className="text-[10px] opacity-80 truncate">Opcional</p>
            )}
            {isDetail && !active && s.motivoCorto && (
              <p className="text-[10px] opacity-90 truncate">{s.motivoCorto}</p>
            )}
            {isDetail && active && s.motivoDetalle && (
              <p className={clsx('text-[10px] leading-snug mt-0.5 line-clamp-2', active ? 'text-white/85' : '')}>
                {s.motivoDetalle}
              </p>
            )}
          </div>
          {ph?.analyzing && <Icon name="auto_awesome" className="text-[16px] animate-pulse shrink-0" />}
        </button>
      </div>
    )
  }

  const renderNotesCard = () => (
    <div className="card p-3 sm:p-4">
      <label className="label flex items-center gap-1.5 mb-1.5">
        <Icon name="assignment" className="text-[18px] text-on-surface-variant" />
        Notas Adicionales
        <span className="text-caption text-on-surface-variant font-normal normal-case tracking-normal">(opcional)</span>
      </label>
      <textarea
        className="input min-h-[88px] resize-none text-[12px]"
        placeholder="Información adicional sobre el estado del vehículo…"
        value={observacionesRiesgo}
        onChange={(e) => setObservacionesRiesgo(formatDamageText(e.target.value))}
      />
    </div>
  )

  const handleZoneSelect = (zone) => {
    const zoneSeqs = visibleSequences.filter((s) => s.diagramZone === zone)
    if (zoneSeqs.length === 0) return

    const pending = zoneSeqs.find((s) => !photos[s.id]?.uploaded)
    const currentInZone = zoneSeqs.find((s) => s.id === activeSeq)
    const target = pending || currentInZone || zoneSeqs[0]
    handleTabClick(target, { closeMobileList: true })
  }

  if (!seq) {
    return (
      <div className="flex items-center justify-center min-h-[320px] card p-6">
        <Icon name="progress_activity" className="animate-spin text-primary text-[28px]" />
      </div>
    )
  }

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

      {/* Fila: lista | captura | plano */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(200px,260px)] gap-3 lg:gap-4 lg:items-start">
          {/* 1. Secuencias — desktop: lista fija */}
          <div className="card p-3 hidden lg:flex flex-col gap-2 order-2 lg:order-1">
            <h4 className="text-label-md text-on-surface-variant mb-1 font-semibold uppercase tracking-wide text-[11px]">
              Secuencias
            </h4>
            {visibleSequences.map((s, i) => renderSequenceButton(s, i))}
          </div>

          {/* 1b. Secuencias — móvil: desplegable */}
          <div className="card p-0 overflow-hidden order-1 lg:hidden">
            <button
              type="button"
              onClick={() => setSeqListOpen((open) => !open)}
              className="flex w-full min-h-[44px] items-center gap-3 p-3 text-left"
              aria-expanded={seqListOpen}
              aria-controls="step3-sequences-panel"
            >
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="format_list_bulleted" className="text-[20px]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-label-md font-bold text-on-surface truncate">
                  Secuencias
                </p>
                <p className="text-caption text-on-surface-variant truncate">
                  {seq?.nombre}
                  {completion.requiredTotal > 0
                    ? ` · ${completion.requiredAnalyzed}/${completion.requiredTotal}`
                    : ''}
                </p>
              </div>
              <Icon
                name={seqListOpen ? 'expand_less' : 'expand_more'}
                className="text-[24px] text-on-surface-variant shrink-0"
              />
            </button>
            {seqListOpen && (
              <div
                id="step3-sequences-panel"
                className="flex flex-col gap-2 border-t border-outline-variant/50 p-3"
              >
                {visibleSequences.map((s, i) => renderSequenceButton(s, i))}
              </div>
            )}
          </div>

          {/* 2. Plano (derecha en desktop); notas solo en desktop aquí */}
          <div className="flex flex-col gap-3 order-3 lg:order-3 lg:sticky lg:top-4">
          <div className="card p-3 sm:p-4 flex flex-col items-center">
            <h4 className="text-label-md text-on-surface-variant text-center mb-2 font-semibold uppercase tracking-wide text-[11px]">
              Plano del vehículo
            </h4>

            {completion.requiredTotal > 0 && (
              <div className="w-full mb-2">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold text-primary">
                    {completion.requiredAnalyzed} de {completion.requiredTotal} obligatorias
                  </span>
                  <span className="text-[10px] text-on-surface-variant tabular-nums">
                    {Math.round((completion.requiredAnalyzed / completion.requiredTotal) * 100)}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full bg-surface-container overflow-hidden"
                  role="progressbar"
                  aria-valuenow={completion.requiredAnalyzed}
                  aria-valuemin={0}
                  aria-valuemax={completion.requiredTotal}
                  aria-label="Progreso de fotos obligatorias"
                >
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-500',
                      completion.canAdvance ? 'bg-success' : 'bg-primary',
                    )}
                    style={{
                      width: `${Math.min(100, (completion.requiredAnalyzed / completion.requiredTotal) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <CarDiagram
              sequences={visibleSequences}
              photos={photos}
              activeSeqId={activeSeq}
              onZoneSelect={handleZoneSelect}
            />
            <div className="mt-2 w-full grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3.5 h-3 rounded bg-primary inline-block shrink-0" />
                <span className="text-on-surface-variant truncate">Capturando</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3.5 h-3 rounded bg-green-600 inline-block shrink-0" />
                <span className="text-on-surface-variant truncate">Sin daños</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3.5 h-3 rounded bg-amber-500 inline-block shrink-0" />
                <span className="text-on-surface-variant truncate">Con daños</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3.5 h-3 rounded bg-slate-200 border border-slate-300 inline-block shrink-0" />
                <span className="text-on-surface-variant truncate">Pendiente</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">{renderNotesCard()}</div>
          </div>


        {/* 3. Captura (centro en desktop) */}
        <div className="card p-3 sm:p-4 flex flex-col gap-2.5 min-w-0 order-2 lg:order-2">
          {/* Sequence header */}
          <div className="flex items-start gap-2 pb-2 border-b border-outline-variant/50">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-elev-primary">
              <Icon name={seq.icon} className="text-[20px]" filled />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-headline-md text-on-surface truncate text-base sm:text-lg">
                {isDetailSequence(seq) ? `Detalle: ${seq.piezaNombre || seq.nombre}` : seq.nombre}
              </h3>
              <p className="text-caption text-on-surface-variant line-clamp-2">
                {isDetailSequence(seq) ? seq.motivoDetalle || seq.descripcion : seq.descripcion}
              </p>
            </div>
            {photoState.uploaded && photoState.analyzed && (
              <StatusChip tone="success" status="Analizada" size="sm" className="shrink-0" />
            )}
          </div>

          {vehicleMatchRejections[activeSeq] && (
            <div
              className={clsx(
                'flex items-start gap-2 p-3 rounded-xl mb-2 mt-2 border',
                vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.WRONG_CONTENT
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.OTHER
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900',
              )}
            >
              <Icon
                name={
                  vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.UNCERTAIN
                    ? 'warning'
                    : 'error'
                }
                className={clsx(
                  'text-[20px] shrink-0',
                  vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.WRONG_CONTENT
                    ? 'text-orange-600'
                    : vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.OTHER
                    ? 'text-red-600'
                    : 'text-amber-600',
                )}
                filled
              />
              <div>
                <p className="font-bold text-label-md mb-0.5">
                  {vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.WRONG_CONTENT
                    ? 'Foto incorrecta para esta secuencia'
                    : vehicleMatchRejections[activeSeq].status === VEHICLE_MATCH_STATUS.OTHER
                    ? 'Otro vehículo detectado'
                    : 'No se pudo verificar el vehículo'}
                </p>
                <p className="text-caption sm:text-body-md leading-snug">
                  {vehicleMatchRejections[activeSeq].message}
                </p>
              </div>
            </div>
          )}

          {isDetailSequence(seq) && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 mb-2 mt-2">
              <Icon name="zoom_in" className="text-[22px] shrink-0 text-amber-600" />
              <div className="space-y-1.5">
                <p className="font-bold text-label-md">
                  Foto de validación
                </p>
                <p className="text-caption sm:text-body-md leading-snug">
                  {seq.motivoDetalle}
                </p>
                <p className="text-[11px] text-amber-800/90 leading-snug">
                  Si en este primer plano no se ven los daños, se toma esta foto como referencia y se descarga la observación.
                  Si se confirman, se mantienen.
                </p>
                {seq.parentNombre && (
                  <p className="text-[11px] text-amber-800/90">
                    Secuencia origen: <strong>{seq.parentNombre}</strong>
                    {seq.piezaEstado && (
                      <> · Estado detectado: <strong>{seq.piezaEstado === 'M' ? 'Malo' : 'Regular'}</strong></>
                    )}
                  </p>
                )}
              </div>
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
            'relative rounded-2xl overflow-hidden border-2 transition-all aspect-[4/3] max-h-[320px] lg:max-h-[360px]',
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

          {photoState.uploaded && !photoState.analyzing && (
            <div className="flex flex-col xs:flex-row gap-2">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="btn-soft flex-1"
              >
                <Icon name="upload" /> Cargar nuevamente
              </button>
              {isOptionalSequence(seq) && (
                <button
                  type="button"
                  onClick={clearOptionalPhoto}
                  className="btn-soft flex-1 text-error hover:bg-error-container/60"
                >
                  <Icon name="delete" /> Limpiar imagen
                </button>
              )}
            </div>
          )}

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
          {((isOptionalSequence(seq) && !photoState.analyzing) ||
            (photoState.uploaded && photoState.analyzed && !photoState.analyzing)) &&
            (() => {
            const nextIdx = visibleSequences.findIndex((s) => s.id === activeSeq) + 1
            const nextSeq = visibleSequences[nextIdx]
            const canSkipOptional = isOptionalSequence(seq) && !(photoState.uploaded && photoState.analyzed)
            return nextSeq ? (
              <button onClick={goNextSeq} className="btn-accent w-full">
                <Icon name="arrow_forward" />
                {canSkipOptional ? `Omitir — ${nextSeq.nombre}` : `Siguiente — ${nextSeq.nombre}`}
              </button>
            ) : null
          })()}
        </div>
      </div>

      {/* Notas al final en responsive */}
      <div className="lg:hidden">{renderNotesCard()}</div>

      {completion.canAdvance ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-container/60 border border-success/30">
          <Icon name="task_alt" className="text-success text-[22px] shrink-0" filled />
          <div>
            <p className="font-bold text-on-success-container text-label-md">¡Listo para continuar!</p>
            <p className="text-caption text-on-success-container/80">
              Todas las fotos obligatorias están listas. Las opcionales puedes completarlas u omitirlas.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-container/50 border border-warning/30">
          <Icon name="photo_camera" className="text-warning text-[22px] shrink-0" filled />
          <div>
            <p className="font-bold text-on-warning-container text-label-md">
              Faltan fotos obligatorias
            </p>
            <p className="text-caption text-on-warning-container/80">
              Completa todas las obligatorias. Llevas {completion.requiredAnalyzed} de {completion.requiredTotal}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
