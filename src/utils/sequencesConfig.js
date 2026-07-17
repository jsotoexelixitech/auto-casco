/**
 * sequencesConfig.js
 * Gestiona qué secuencias de fotos están habilitadas para la inspección.
 * Se persiste en localStorage bajo la key 'ia_sequences'.
 */
import { PHOTO_SEQUENCES } from '../data/photoSequences'

const LS_KEY = 'ia_sequences'

const ESTADO_DETALLE = {
  R: { etiqueta: 'daño moderado', severidad: 'Regular', color: 'moderado' },
  M: { etiqueta: 'daño grave', severidad: 'Malo', color: 'grave' },
}

function slugPieza(pieza) {
  return pieza.replace(/[\s./-]+/g, '')
}

export function detailSequenceId(parentSeqId, pieza) {
  return `seq-detail-${parentSeqId}-${slugPieza(pieza)}`
}

/**
 * Elimina fotos de detalle que ya no aplican tras reanalizar la secuencia padre
 * (p. ej. la pieza pasó de Regular/Malo a Bueno).
 */
export function pruneObsoleteDetailPhotos(photos, parentSeqId, parentPiezas = {}) {
  if (!photos || !parentSeqId) return photos

  const keepIds = new Set(
    Object.entries(parentPiezas)
      .filter(([, data]) => data?.estado === 'R' || data?.estado === 'M')
      .map(([pieza]) => detailSequenceId(parentSeqId, pieza)),
  )

  const prefix = `seq-detail-${parentSeqId}-`
  let changed = false
  const next = { ...photos }

  for (const key of Object.keys(next)) {
    if (key.startsWith(prefix) && !keepIds.has(key)) {
      delete next[key]
      changed = true
    }
  }

  return changed ? next : photos
}

/** Elimina todas las fotos de detalle asociadas a una secuencia padre. */
export function removeAllDetailPhotosForParent(photos, parentSeqId) {
  if (!photos || !parentSeqId) return photos
  const prefix = `seq-detail-${parentSeqId}-`
  let changed = false
  const next = { ...photos }
  for (const key of Object.keys(next)) {
    if (key.startsWith(prefix)) {
      delete next[key]
      changed = true
    }
  }
  return changed ? next : photos
}

/** Solo fotos de secuencias actualmente vigentes (sin detalles huérfanos). */
export function filterPhotosForCurrentSequences(vehiculo, photos = {}) {
  const activeIds = new Set(
    getDynamicSequences(vehiculo, photos).map((s) => s.id),
  )
  return Object.fromEntries(
    Object.entries(photos).filter(([id]) => activeIds.has(id)),
  )
}

export function buildDetailReason(pieza, piezaData, parentSeq) {
  const info = ESTADO_DETALLE[piezaData?.estado]
  if (!info) {
    return `La IA detectó una observación en «${pieza}» durante «${parentSeq?.nombre}». Toma una foto de cerca para confirmar el estado.`
  }

  const partes = [
    `Durante la secuencia «${parentSeq?.nombre}», la IA clasificó «${pieza}» como ${info.severidad} (${info.etiqueta}).`,
  ]

  if (piezaData?.comentario?.trim()) {
    partes.push(`Observación: ${piezaData.comentario.trim()}.`)
  }

  if (typeof piezaData?.confianza === 'number' && piezaData.confianza > 0) {
    partes.push(`Confianza del análisis: ${Math.round(piezaData.confianza * 100)}%.`)
  }

  partes.push(
    'Esta foto es de VALIDACIÓN (primer plano): confirma o descarta lo visto en la secuencia padre. '
      + 'Si en este ángulo cercano NO se aprecian los daños (p. ej. por perspectiva o reflejo), clasifica la pieza como buena / sin daño. '
      + 'Si los daños se confirman, clasifica Regular o Malo según la gravedad real.',
  )

  return partes.join(' ')
}

function buildDetailSequence(parentSeq, pieza, piezaData) {
  const motivoDetalle = buildDetailReason(pieza, piezaData, parentSeq)
  const info = ESTADO_DETALLE[piezaData?.estado]

  return {
    id: detailSequenceId(parentSeq.id, pieza),
    nombre: pieza,
    descripcion: motivoDetalle,
    icon: 'zoom_in',
    diagramZone: 'damages',
    piezas: [pieza],
    isDynamicDetail: true,
    parentSeqId: parentSeq.id,
    parentNombre: parentSeq.nombre,
    piezaNombre: pieza,
    piezaEstado: piezaData?.estado,
    piezaComentario: piezaData?.comentario || '',
    motivoDetalle,
    motivoCorto: info
      ? `${info.severidad} en ${pieza}`
      : `Observación en ${pieza}`,
  }
}

/**
 * Retorna el array de IDs de secuencias habilitadas guardado en localStorage.
 * Si no hay configuración, devuelve todas las secuencias habilitadas.
 */
export function getEnabledSequenceIds() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const ids = JSON.parse(raw)
      if (Array.isArray(ids) && ids.length > 0) return ids
    }
  } catch { /* ignore */ }
  return PHOTO_SEQUENCES.map((s) => s.id)
}

/**
 * Retorna solo las secuencias activas (habilitadas en configuración).
 */
export function getActiveSequences() {
  const enabled = getEnabledSequenceIds()
  return PHOTO_SEQUENCES.filter((s) => enabled.includes(s.id))
}

/**
 * Guarda los IDs habilitados en localStorage.
 */
export function saveEnabledSequenceIds(ids) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

/**
 * Secuencias base + detalles dinámicos anidados justo debajo de su secuencia padre.
 */
export function getDynamicSequences(vehiculo, photos) {
  const tipoVehiculo = vehiculo?.tipo || 'Particular'

  const baseSequences = getActiveSequences().filter(
    (s) => !s.excludeVehicleTypes?.includes(tipoVehiculo),
  )

  const result = []

  for (const seq of baseSequences) {
    result.push(seq)

    const photoData = photos?.[seq.id]
    if (!photoData?.analyzed || !photoData.piezas) continue

    for (const [pieza, data] of Object.entries(photoData.piezas)) {
      if (data.estado === 'R' || data.estado === 'M') {
        result.push(buildDetailSequence(seq, pieza, data))
      }
    }
  }

  return result
}

export function isOptionalSequence(seq) {
  return Boolean(seq?.opcional)
}

export function isDetailSequence(seq) {
  return Boolean(seq?.isDynamicDetail)
}

/** Foto aceptada: subida y analizable por la IA (legible / válida). */
export function isPhotoAccepted(photo) {
  return Boolean(photo?.uploaded && photo?.analyzed && !photo?.analyzing)
}

/**
 * La foto de detalle valida el daño del padre:
 * - Si el detalle confirma R/M → el padre adopta el estado del detalle (referencia cercana).
 * - Si el detalle no aprecia daño (B/NE) → el padre queda en ese estado y el detalle deja de pedirse.
 *
 * @returns {{ photos: object, outcome: 'confirmed'|'cleared'|'skipped', piezaNombre?: string, estado?: string }}
 */
export function applyDetailValidation(photos, {
  detailSeqId,
  parentSeqId,
  piezaNombre,
  piezaUpdate,
  detailThumbnail,
} = {}) {
  if (!photos || !detailSeqId || !parentSeqId || !piezaNombre || !piezaUpdate?.estado) {
    return { photos, outcome: 'skipped' }
  }

  const parent = photos[parentSeqId]
  if (!parent?.piezas?.[piezaNombre]) {
    return { photos, outcome: 'skipped' }
  }

  const prevPieza = parent.piezas[piezaNombre]
  const nextEstado = piezaUpdate.estado
  const confirmed = nextEstado === 'R' || nextEstado === 'M'

  const comentario = confirmed
    ? (piezaUpdate.comentario?.trim()
      || prevPieza.comentario
      || 'Daño confirmado en foto de detalle.')
    : (piezaUpdate.comentario?.trim()
      || 'Validado en foto de detalle: no se aprecian los daños detectados inicialmente (posible falso positivo o ángulo).')

  let next = {
    ...photos,
    [parentSeqId]: {
      ...parent,
      piezas: {
        ...parent.piezas,
        [piezaNombre]: {
          ...prevPieza,
          estado: nextEstado,
          comentario,
          validatedByDetail: true,
          detailSeqId,
          estadoAntesValidacion: prevPieza.estado,
          ...(detailThumbnail ? { detailThumbnail } : {}),
        },
      },
    },
    [detailSeqId]: {
      ...(photos[detailSeqId] || {}),
      isDynamicDetail: true,
      parentSeqId,
      piezaNombre,
      validatesParent: true,
      validationOutcome: confirmed ? 'confirmed' : 'cleared',
    },
  }

  if (!confirmed) {
    // Ya no hay R/M en esa pieza → el detalle deja de ser secuencia requerida
    next = pruneObsoleteDetailPhotos(next, parentSeqId, next[parentSeqId].piezas)
  }

  return {
    photos: next,
    outcome: confirmed ? 'confirmed' : 'cleared',
    piezaNombre,
    estado: nextEstado,
  }
}

export function getSequenceCompletionStats(sequences, photos) {
  const required = sequences.filter((s) => !isOptionalSequence(s))
  const requiredCompleted = required.filter((s) => photos[s.id]?.uploaded).length
  const requiredAnalyzed = required.filter((s) => isPhotoAccepted(photos[s.id])).length
  const totalCompleted = sequences.filter((s) => photos[s.id]?.uploaded).length
  const pendingRequired = required.filter((s) => !isPhotoAccepted(photos[s.id]))
  const allRequiredComplete = pendingRequired.length === 0

  return {
    required,
    requiredTotal: required.length,
    requiredCompleted,
    requiredAnalyzed,
    totalCompleted,
    pendingRequired,
    allRequiredComplete,
    canAdvance: allRequiredComplete,
  }
}
