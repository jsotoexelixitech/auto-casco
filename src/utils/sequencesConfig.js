/**
 * sequencesConfig.js
 * Gestiona qué secuencias de fotos están habilitadas para la inspección.
 * Se persiste en localStorage bajo la key 'ia_sequences'.
 */
import { PHOTO_SEQUENCES } from '../data/photoSequences'

const LS_KEY = 'ia_sequences'

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
  // Por defecto: todas habilitadas
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
 * Calcula todas las secuencias (base + dinámicas por daños)
 */
export function getDynamicSequences(vehiculo, photos) {
  const tipoVehiculo = vehiculo?.tipo || 'Particular'
  
  // 1. Get base sequences
  const baseSequences = getActiveSequences().filter(
    (s) => !s.excludeVehicleTypes?.includes(tipoVehiculo)
  )

  const result = []

  for (const baseSeq of baseSequences) {
    result.push(baseSeq)
    
    // Check if this base sequence has generated any details
    const photoData = photos?.[baseSeq.id]
    if (photoData && photoData.analyzed && photoData.piezas) {
      for (const [pieza, data] of Object.entries(photoData.piezas)) {
        if (data.estado === 'R' || data.estado === 'M') {
          result.push({
            id: `seq-detail-${baseSeq.id}-${pieza.replace(/[\s./-]+/g, '')}`,
            nombre: `Detalle: ${pieza}`,
            descripcion: `Foto detallada de la observación en ${pieza} (Requerida).`,
            icon: 'zoom_in',
            diagramZone: 'damages',
            piezas: [pieza],
            isDynamicDetail: true,
            parentSeqId: baseSeq.id
          })
        }
      }
    }
  }

  return result
}
