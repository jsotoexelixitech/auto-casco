/**
 * AI Vehicle Analysis Service — La Mundial de Seguros
 *
 * Usa Google Gemini Vision (gemini-2.0-flash) para analizar fotos de vehículos
 * durante la inspección y clasificar el estado de cada pieza según la taxonomía
 * oficial del mercado asegurador venezolano.
 */

// gemini-2.5-flash: producción estable — visión multimodal, JSON estructurado, rápido
// gemini-2.5-pro disponible para análisis más exigentes
const GEMINI_MODEL        = 'gemini-2.5-flash'
const GEMINI_MODEL_PRO    = 'gemini-2.5-pro'
const GEMINI_API_URL      = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const GEMINI_API_URL_PRO  = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_PRO}:generateContent`

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// ─── Tipos de daño reconocidos (dataset Humans in the Loop + CarDD) ──────────
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
// evitar "unused" warning
export { DAMAGE_TO_ESTADO }

// ─── Helpers internos ─────────────────────────────────────────────────────────
function imagePart(imageData) {
  if (imageData.startsWith('data:')) {
    return {
      inlineData: {
        mimeType: imageData.split(';')[0].split(':')[1],
        data: imageData.split(',')[1],
      },
    }
  }
  return { fileData: { mimeType: 'image/jpeg', fileUri: imageData } }
}

/**
 * Extrae JSON de una respuesta de texto que puede contener:
 * - JSON puro
 * - Bloque ```json ... ```
 * - JSON incrustado en prosa
 */
function extractJson(text) {
  // 1) Intento directo
  try { return JSON.parse(text) } catch (_) { /* continúa */ }

  // 2) Bloque de código ```json ... ``` o ``` ... ```
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (block) {
    try { return JSON.parse(block[1].trim()) } catch (_) { /* continúa */ }
  }

  // 3) Primer objeto JSON completo en el texto (desde { hasta el último })
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch (_) { /* continúa */ }
  }

  throw new Error(`JSON no encontrado en respuesta: ${text.slice(0, 120)}`)
}

async function geminiPostOnce(parts, generationConfig = {}, apiUrl = GEMINI_API_URL) {
  const response = await fetch(`${apiUrl}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.85,
        maxOutputTokens: 8192,
        ...generationConfig,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || 'Error desconocido'
    const e = new Error(`Gemini ${response.status}: ${msg}`)
    e.status = response.status
    throw e
  }

  const data = await response.json()
  const allParts = data?.candidates?.[0]?.content?.parts ?? []
  const textPart = allParts.find((p) => p.text && !p.thought) ?? allParts.find((p) => p.text)
  const text = textPart?.text
  if (!text) throw new Error('Gemini no devolvió contenido')
  return extractJson(text)
}

/**
 * Llamada a Gemini con reintentos automáticos.
 * Estrategia: Pro → Flash (si Pro falla con 503/429) → lanza error (nunca simulación).
 */
async function geminiPost(parts, generationConfig = {}, apiUrl = GEMINI_API_URL) {
  const urls = apiUrl === GEMINI_API_URL_PRO
    ? [GEMINI_API_URL_PRO, GEMINI_API_URL]   // Pro primero, Flash como fallback
    : [apiUrl]

  let lastErr
  for (const url of urls) {
    // Hasta 2 intentos por URL ante errores transitorios (503/429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await geminiPostOnce(parts, generationConfig, url)
      } catch (err) {
        lastErr = err
        const isTransient = err.status === 503 || err.status === 429
        if (isTransient && attempt === 1) {
          // Esperar antes del segundo intento
          console.warn(`[Gemini] ${err.message} — reintentando en 3s (${url.includes('pro') ? 'Pro' : 'Flash'})…`)
          await new Promise((r) => setTimeout(r, 3000))
          continue
        }
        // Error no transitorio o segundo intento fallido → probar siguiente URL
        break
      }
    }
    if (urls.indexOf(url) < urls.length - 1) {
      console.warn(`[Gemini] Fallback a Flash después de error en Pro: ${lastErr?.message}`)
    }
  }
  throw lastErr
}

// ─── Prompt de análisis de piezas ────────────────────────────────────────────
function buildAnalysisPrompt(piezas, secuencia, vehiculo) {
  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${vehiculo.anio || ''}`.trim()
    : 'vehículo particular'

  return `Eres un sistema de IA especializado en inspección vehicular para seguros de casco automotor, 
entrenado en detección de daños según estándares del mercado asegurador venezolano (SUDESEG).

VEHÍCULO: ${vehiculoDesc}
SECUENCIA FOTOGRÁFICA: ${secuencia}
PIEZAS A EVALUAR: ${piezas.join(', ')}

Analiza la imagen y evalúa el estado de CADA pieza listada:

ESTADOS VÁLIDOS:
- B (Bueno): Sin daño visible o desgaste mínimo normal.
- R (Regular): Rayón, abolladura leve, descascarado de pintura, grieta menor. Funcional pero afectado.
- M (Malo): Fractura, deformación estructural, oxidación profunda, cristal roto. Compromete funcionalidad.
- NE (No Existe): Pieza no presente en este vehículo o no visible en esta toma.

Responde ÚNICAMENTE en JSON válido:
{
  "piezas": {
    "NOMBRE_PIEZA": {
      "estado": "B|R|M|NE",
      "tipoDano": "tipo de daño o 'Sin daño'",
      "confianza": 0.0-1.0,
      "observacion": "descripción breve máximo 80 caracteres"
    }
  },
  "resumenGeneral": "evaluación global máximo 120 caracteres",
  "alertas": [],
  "placaDetectada": "número de placa si visible, null si no",
  "coincideModelo": true,
  "motivoNoCoincide": "si coincideModelo es false, indica brevemente por qué el vehículo en la foto no parece ser un ${vehiculoDesc}. Si es true, null."
}`
}

// ─── Llamada real a Gemini — análisis de piezas (usa Pro para mayor precisión) ─
async function analyzeWithGemini(imageData, piezas, secuencia, vehiculo) {
  const prompt = buildAnalysisPrompt(piezas, secuencia, vehiculo)
  const result = await geminiPost([{ text: prompt }, imagePart(imageData)], {}, GEMINI_API_URL_PRO)

  // Normalizar: asegurar que todas las piezas solicitadas tengan resultado
  for (const pieza of piezas) {
    if (!result.piezas?.[pieza]) {
      if (!result.piezas) result.piezas = {}
      result.piezas[pieza] = { estado: 'B', tipoDano: DAMAGE_TYPES.NONE, confianza: 0.70, observacion: 'No detectado claramente' }
    }
  }
  return result
}

// ─── Identificación automática de zona (para carga por lote) ─────────────────
/**
 * Dada una imagen, Gemini identifica a qué secuencia/zona del vehículo pertenece.
 * @param {string} imageData  - base64 data URL
 * @param {Array}  sequences  - array de PHOTO_SEQUENCES disponibles
 * @param {object} vehiculo   - { marca, modelo, anio }
 * @returns {Promise<{id: string, nombre: string, confianza: number, razon: string}|null>}
 */
export async function identifyPhotoSequence(imageData, sequences, vehiculo) {
  // Sin API key → devolver null (el llamador usará fallback)
  if (!API_KEY || imageData?.includes('unsplash.com')) return null

  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${vehiculo.anio || ''}`.trim()
    : 'vehículo particular'

  const seqList = sequences
    .map((s) => `• ID: "${s.id}" | Zona: "${s.nombre}" | Descripción: "${s.descripcion}"`)
    .join('\n')

  const prompt = `Eres un experto en inspección vehicular para seguros de auto en Venezuela.
Se te muestra una fotografía de un ${vehiculoDesc}.

ZONAS DE INSPECCIÓN DISPONIBLES:
${seqList}

TAREA: Identifica a cuál de estas zonas/secuencias pertenece la fotografía mostrada.
Analiza: ángulo de la toma, partes visibles del vehículo, perspectiva y contexto.

Responde ÚNICAMENTE en JSON válido:
{
  "id": "id_exacto_de_la_zona_que_mejor_corresponde",
  "nombre": "nombre de la zona",
  "confianza": 0.0-1.0,
  "razon": "breve explicación en español de máximo 100 caracteres"
}`

  try {
    const result = await geminiPost(
      [{ text: prompt }, imagePart(imageData)],
      { temperature: 0.05, maxOutputTokens: 300 },
    )

    // Validar que el id devuelto sea uno de nuestras secuencias
    const valid = sequences.find((s) => s.id === result.id)
    if (!valid) return null

    return {
      id: result.id,
      nombre: result.nombre || valid.nombre,
      confianza: result.confianza ?? 0.7,
      razon: result.razon || '',
    }
  } catch (err) {
    console.warn('[AIAnalysis] identifyPhotoSequence error:', err.message)
    return null
  }
}

// ─── Simulación realista (fallback sin API key) ───────────────────────────────
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
    _simulado: true,
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Analiza una foto de vehículo con Gemini Vision.
 * @param {string}   imageData   - base64 data URL o URL pública
 * @param {string[]} piezas      - lista de piezas a evaluar
 * @param {string}   secuencia   - nombre de la secuencia fotográfica
 * @param {string}   diagramZone - zona del diagrama (front, rear, interior…)
 * @param {object}   vehiculo    - { marca, modelo, anio }
 */
export async function analyzeVehiclePhoto(imageData, piezas, secuencia, diagramZone, vehiculo) {
  // Sin API key o imagen demo → simulación inmediata
  if (!API_KEY || imageData?.includes('unsplash.com')) {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600))
    return simulateAnalysis(piezas, diagramZone)
  }

  // Con API key → siempre intentar con Gemini (Pro → Flash → error real)
  return await analyzeWithGemini(imageData, piezas, secuencia, vehiculo)
}

/**
 * Convierte resultado de Gemini al formato interno de piezas.
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
