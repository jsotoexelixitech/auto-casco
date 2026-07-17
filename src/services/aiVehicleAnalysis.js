/**
 * AI Vehicle Analysis — cliente del API backend
 * La lógica Gemini vive en backend/src/modules/ai/
 */

import * as api from './api'
import { ApiError } from './api'

export const DAMAGE_TYPES = {
  NONE:       'Sin daño',
  SCRATCH:    'Rayón / Raspón',
  DENT:       'Abolladura',
  CRACK:      'Grieta / Fisura',
  BROKEN:     'Pieza rota / Fractura',
  PAINT_CHIP: 'Descascarado de pintura',
  CORROSION:  'Oxidación / Corrosión',
  MISSING:    'Pieza faltante',
  GLASS:      'Cristal quebrado / Astillado',
  DEFORMED:   'Deformación estructural',
}

const DAMAGE_TO_ESTADO = {
  [DAMAGE_TYPES.NONE]:       'B',
  [DAMAGE_TYPES.SCRATCH]:    'R',
  [DAMAGE_TYPES.DENT]:       'R',
  [DAMAGE_TYPES.PAINT_CHIP]: 'R',
  [DAMAGE_TYPES.CRACK]:      'M',
  [DAMAGE_TYPES.BROKEN]:     'M',
  [DAMAGE_TYPES.CORROSION]:  'M',
  [DAMAGE_TYPES.MISSING]:    'NE',
  [DAMAGE_TYPES.GLASS]:      'M',
  [DAMAGE_TYPES.DEFORMED]:   'M',
}
export { DAMAGE_TO_ESTADO }

// ─── Simulación local (solo si backend no disponible o imagen demo) ───────────
const ZONE_PROFILES = {
  front:         { B: 0.55, R: 0.30, M: 0.12, NE: 0.03 },
  'front-right': { B: 0.60, R: 0.25, M: 0.12, NE: 0.03 },
  'front-left':  { B: 0.60, R: 0.25, M: 0.12, NE: 0.03 },
  'rear-right':  { B: 0.62, R: 0.25, M: 0.10, NE: 0.03 },
  'rear-left':   { B: 0.62, R: 0.25, M: 0.10, NE: 0.03 },
  rear:          { B: 0.58, R: 0.28, M: 0.11, NE: 0.03 },
  interior:      { B: 0.75, R: 0.18, M: 0.05, NE: 0.02 },
  dashboard:     { B: 0.82, R: 0.12, M: 0.04, NE: 0.02 },
  serial:        { B: 0.90, R: 0.06, M: 0.03, NE: 0.01 },
  trunk:         { B: 0.70, R: 0.20, M: 0.07, NE: 0.03 },
  damages:       { B: 0.30, R: 0.40, M: 0.25, NE: 0.05 },
  roof:          { B: 0.65, R: 0.22, M: 0.10, NE: 0.03 },
}

const DAMAGE_BY_ESTADO = {
  B:  [DAMAGE_TYPES.NONE],
  R:  [DAMAGE_TYPES.SCRATCH, DAMAGE_TYPES.DENT, DAMAGE_TYPES.PAINT_CHIP, DAMAGE_TYPES.CRACK],
  M:  [DAMAGE_TYPES.BROKEN, DAMAGE_TYPES.CORROSION, DAMAGE_TYPES.GLASS, DAMAGE_TYPES.DEFORMED, DAMAGE_TYPES.CRACK],
  NE: [DAMAGE_TYPES.MISSING],
}

const OBSERVATIONS = {
  B:  ['Sin daño aparente', 'Buen estado general', 'Sin observaciones', 'Pieza en óptimas condiciones'],
  R:  ['Presenta daño superficial', 'Requiere atención menor', 'Daño leve visible', 'Desgaste por uso normal'],
  M:  ['Daño severo — requiere reposición', 'Pieza comprometida estructuralmente', 'Daño grave detectado'],
  NE: ['No presente en el vehículo', 'Pieza no aplica a este modelo'],
}

function weightedRandom(profile) {
  const r = Math.random()
  let acc = 0
  for (const [estado, prob] of Object.entries(profile)) {
    acc += prob
    if (r <= acc) return estado
  }
  return 'B'
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function simulateAnalysis(piezas, diagramZone) {
  const profile = ZONE_PROFILES[diagramZone] || ZONE_PROFILES.front
  const result = {}

  for (const pieza of piezas) {
    const estado = weightedRandom(profile)
    const tipoDano = pick(DAMAGE_BY_ESTADO[estado])
    result[pieza] = {
      estado,
      tipoDano,
      confianza: estado === 'B' ? 0.88 + Math.random() * 0.10 : 0.72 + Math.random() * 0.18,
      observacion: pick(OBSERVATIONS[estado]),
    }
  }

  const malos = Object.values(result).filter((p) => p.estado === 'M').length
  const regulares = Object.values(result).filter((p) => p.estado === 'R').length

  return {
    piezas: result,
    resumenGeneral:
      malos > 0
        ? `${malos} pieza(s) con daño grave, ${regulares} con daño moderado`
        : regulares > 0
        ? `${regulares} pieza(s) con daño moderado detectado`
        : 'Zona en buen estado general',
    alertas: malos > 1 ? ['Múltiples piezas con daño grave — evaluar asegurabilidad'] : [],
    placaDetectada: null,
    coincideModelo: true,
    motivoNoCoincide: null,
    verificacionVehiculo: {
      resultado: 'mismo',
      confianza: 0.92,
      motivo: 'Vehículo coherente con el registro',
      placaDetectada: null,
      coincidePlaca: null,
    },
    validacionContenido: {
      esCorrecta: true,
      confianza: 0.9,
      elementoDetectado: 'Contenido de secuencia',
      motivo: 'Coherente con la secuencia solicitada',
    },
    _simulado: true,
  }
}

function isDemoImage(imageData) {
  return imageData?.includes('unsplash.com')
}

async function simulateWithDelay(piezas, diagramZone) {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600))
  return simulateAnalysis(piezas, diagramZone)
}

function pickVehiculoPayload(vehiculo) {
  if (!vehiculo || typeof vehiculo !== 'object') return undefined
  const fields = ['marca', 'modelo', 'anio', 'placa', 'color', 'serial']
  const out = {}
  for (const key of fields) {
    if (vehiculo[key] != null && vehiculo[key] !== '') {
      out[key] = String(vehiculo[key])
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Analiza una foto de vehículo vía backend (/ai/analyze-photo).
 */
export async function analyzeVehiclePhoto(
  imageData,
  piezas,
  secuencia,
  diagramZone,
  vehiculo,
  secuenciaDescripcion,
) {
  if (isDemoImage(imageData)) {
    return simulateWithDelay(piezas, diagramZone)
  }

  try {
    return await api.ai.analyzePhoto({
      imageData,
      piezas,
      secuencia,
      diagramZone,
      secuenciaDescripcion,
      vehiculo: pickVehiculoPayload(vehiculo),
    })
  } catch (err) {
    // Modo demo sin backend
    if (err instanceof ApiError && err.status === 0) {
      console.info('[AI] Backend no disponible — simulación local')
      return simulateWithDelay(piezas, diagramZone)
    }
    throw err
  }
}

/**
 * Identifica la secuencia/zona de una imagen vía backend.
 */
export async function identifyPhotoSequence(imageData, sequences, vehiculo) {
  if (isDemoImage(imageData)) return null

  try {
    return await api.ai.identifySequence({
      imageData,
      sequences,
      vehiculo: pickVehiculoPayload(vehiculo),
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) return null
    console.warn('[AIAnalysis] identifyPhotoSequence error:', err.message)
    return null
  }
}

/**
 * Convierte resultado del backend al formato interno de piezas.
 */
export function mapResultToInternalFormat(analysisResult) {
  const out = {}
  for (const [pieza, data] of Object.entries(analysisResult.piezas || {})) {
    out[pieza] = {
      estado: data.estado || 'B',
      comentario:
        data.tipoDano !== DAMAGE_TYPES.NONE
          ? `${data.tipoDano}${data.observacion ? ' — ' + data.observacion : ''}`
          : '',
      confianza: data.confianza || 0.85,
      tipoDano: data.tipoDano,
    }
  }
  return out
}

/**
 * Lee un File como base64 data URL.
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
