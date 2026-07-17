/**
 * Cliente Valrep / INMA (API externa La Mundial).
 * Base: VITE_VALREP_API_URL  (ej. http://192.168.8.120:3002/api/v1 o /valrep-api)
 */
import { parseEmissionAutoResponse } from '../utils/emissionResult'

const VALREP_BASE = (import.meta.env.VITE_VALREP_API_URL ?? '').replace(/\/$/, '')

/** Parámetros fijos iniciales del listado de planes (ajustables cuando se parametrice). */
export const PLANES_V2_REQUEST = {
  cramo: 18,
  cproductor: 80080,
  ctipo: 1,
  cusuario: '7',
  iplaca: 'N',
  citem: '80080',
  centidad: 'P',
}

export const COTIZACION_DEFAULTS = {
  iplaca: 'N',
  ntoneladas: 0,
  cramo: 18,
}

export class ValrepApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    this.name = 'ValrepApiError'
  }
}

async function valrepRequest(method, path, body) {
  if (!VALREP_BASE) {
    throw new ValrepApiError(0, 'VITE_VALREP_API_URL no está configurada')
  }

  const url = `${VALREP_BASE}${path.startsWith('/') ? path : `/${path}`}`
  let res
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ValrepApiError(0, 'No se pudo conectar con Valrep')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`
    throw new ValrepApiError(res.status, typeof msg === 'string' ? msg : 'Error Valrep')
  }

  if (json?.status === false) {
    throw new ValrepApiError(res.status, json?.message || 'Valrep respondió status=false')
  }

  return json?.data !== undefined ? json.data : json
}

function listFromData(data, ...keys) {
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k]
  }
  if (Array.isArray(data?.info)) return data.info
  return []
}

/** Catálogo de planes disponibles (Valrep planes/v2). */
export async function fetchPlanesV2(params = PLANES_V2_REQUEST) {
  const data = await valrepRequest('POST', '/valrep/planes/v2', params)
  const list = data?.plan
  return Array.isArray(list) ? list : []
}

export async function fetchInmaMarcas(fano) {
  const data = await valrepRequest('POST', '/inma/marcas', { fano: Number(fano) })
  return listFromData(data, 'marcas')
}

export async function fetchInmaModelos(fano, cmarca) {
  const data = await valrepRequest('POST', '/inma/modelo', {
    fano: Number(fano),
    cmarca: String(cmarca),
  })
  return listFromData(data, 'modelos', 'modelo')
}

export async function fetchInmaVersiones(fano, cmarca, cmodelo) {
  const data = await valrepRequest('POST', '/inma/version', {
    fano: Number(fano),
    cmarca: String(cmarca),
    cmodelo: String(cmodelo),
  })
  return listFromData(data, 'versiones', 'version')
}

export async function fetchInmaCategoriasUso(fano, cmarca, cmodelo, cversion) {
  const data = await valrepRequest('POST', '/inma/categorias-uso', {
    fano: Number(fano),
    cmarca: String(cmarca),
    cmodelo: String(cmodelo),
    cversion: String(cversion),
  })
  return listFromData(data, 'categorias_uso', 'categorias')
}

/**
 * Cotización Valrep. Usa `mprimaext` como prima en $.
 * @param {object} params
 */
export async function fetchCotizacion(params) {
  const body = {
    ...COTIZACION_DEFAULTS,
    ...params,
    fano: Number(params.fano),
    ccategoria_uso: Number(params.ccategoria_uso),
    ntoneladas: Number(params.ntoneladas ?? 0),
    cramo: Number(params.cramo ?? COTIZACION_DEFAULTS.cramo),
    cmarca: String(params.cmarca),
    cmodelo: String(params.cmodelo),
    cversion: String(params.cversion),
    cplan: String(params.cplan),
  }
  return valrepRequest('POST', '/valrep/cotizacion', body)
}

/**
 * Frecuencias de pago disponibles para un plan.
 * @param {string} cplan
 * @returns {Promise<Array<{ cvalor: string, xdescripcion: string }>>}
 */
export async function fetchFrecuencias(cplan) {
  const data = await valrepRequest('POST', '/valrep/frecuencia', { cplan: String(cplan) })
  return listFromData(data, 'frecuencias')
}

/**
 * Valida placa + serial contra emisión (La Mundial external).
 * @returns {Promise<{ valid: boolean, message: string, reason: string }>}
 */
export async function validateEmissionAuto(placa, serial_carroceria) {
  if (!VALREP_BASE) {
    throw new ValrepApiError(0, 'VITE_VALREP_API_URL no está configurada')
  }

  const url = `${VALREP_BASE}/external/validateEmissionAuto`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placa: String(placa ?? '').trim(),
        serial_carroceria: String(serial_carroceria ?? '').trim(),
      }),
    })
  } catch {
    throw new ValrepApiError(0, 'No se pudo conectar con el servicio de validación')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = pickEmissionMessage(json?.result, json, json?.data) || `HTTP ${res.status}`
    throw new ValrepApiError(res.status, msg)
  }

  const result = json?.result ?? json?.data?.result ?? json?.data ?? json
  const valid = result?.status === true
  const apiMessage = pickEmissionMessage(result, json?.data, json)

  if (valid) {
    return {
      valid: true,
      message: 'Vehículo válido para emisión.',
      reason: '',
    }
  }

  return {
    valid: false,
    message: 'Vehículo no válido para emisión.',
    reason: apiMessage || 'Vehículo no válido para emisión.',
  }
}

/**
 * Emite póliza Auto Casco (La Mundial external).
 * @param {object} payload
 * @returns {Promise<import('../utils/emissionResult').parseEmissionAutoResponse extends Function ? object : object>}
 */
export async function createEmissionAuto(payload) {
  if (!VALREP_BASE) {
    throw new ValrepApiError(0, 'VITE_VALREP_API_URL no está configurada')
  }

  const url = `${VALREP_BASE}/external/createEmissionAuto`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ValrepApiError(0, 'No se pudo conectar con el servicio de emisión')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = pickEmissionMessage(json?.result, json, json?.data) || `HTTP ${res.status}`
    throw new ValrepApiError(res.status, msg)
  }

  const parsed = parseEmissionAutoResponse(json)
  if (!parsed.ok) {
    throw new ValrepApiError(400, parsed.message || 'No se pudo emitir la póliza')
  }
  return parsed
}

function pickEmissionMessage(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue
    for (const key of ['message', 'mensaje', 'motivo', 'descripcion', 'description', 'error']) {
      const value = src[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
      if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
        return value[0].trim()
      }
    }
  }
  return ''
}
