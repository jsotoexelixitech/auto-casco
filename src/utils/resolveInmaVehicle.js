/**
 * Resuelve códigos INMA (cmarca, cmodelo, cversion, ccategoria_uso)
 * a partir de los textos del vehículo capturado en la inspección.
 */

import {
  fetchInmaCategoriasUso,
  fetchInmaMarcas,
  fetchInmaModelos,
  fetchInmaVersiones,
  ValrepApiError,
} from '../services/valrepApi'

const resolveCache = new Map()

export function normalizeLabel(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokensFrom(text) {
  return normalizeLabel(text)
    .split(/[\/|,;]+|\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

function pairScore(candidate, needle) {
  if (!candidate || !needle) return 0
  if (candidate === needle) return 100
  if (candidate.startsWith(needle) || needle.startsWith(candidate)) {
    return 80 + Math.min(15, Math.min(candidate.length, needle.length))
  }
  if (candidate.includes(needle) || needle.includes(candidate)) {
    return 55 + Math.min(20, Math.min(candidate.length, needle.length))
  }
  return 0
}

/**
 * Mejor ítem de catálogo según texto OCR (soporta "HFC1037 / T6 GAS").
 * @param {object[]} items
 * @param {string|string[]} labelKeys
 * @param {string} searchText
 */
export function bestCatalogMatch(items, labelKeys, searchText) {
  const keys = Array.isArray(labelKeys) ? labelKeys : [labelKeys]
  const needles = tokensFrom(searchText)
  if (!items?.length) return null
  if (!needles.length) return items[0]

  let best = null
  let bestScore = -1

  for (const item of items) {
    const labels = keys.map((k) => normalizeLabel(item?.[k])).filter(Boolean)
    let score = 0
    for (const label of labels) {
      score = Math.max(score, pairScore(label, normalizeLabel(searchText)))
      for (const needle of needles) {
        score = Math.max(score, pairScore(label, needle))
      }
    }
    // Preferir coincidencias de tokens más largos
    const longestHit = Math.max(
      0,
      ...needles.map((n) => (labels.some((l) => l.includes(n) || n.includes(l)) ? n.length : 0)),
    )
    score += Math.min(10, longestHit)

    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  return bestScore > 0 ? best : items[0]
}

function pickCategoriaUso(categorias, tipoVehiculo = '') {
  if (!categorias?.length) return null
  const tipo = normalizeLabel(tipoVehiculo)

  const byLabel = categorias.find((c) => {
    const x = normalizeLabel(c.xcategoria_uso)
    if (!tipo) return false
    if (tipo.includes('PARTICULAR') && (x.includes('PARTICULAR') || x.includes('800'))) return true
    if (tipo.includes('TAXI') && x.includes('TAXI')) return true
    if (tipo.includes('ALQUILER') && x.includes('ALQUILER')) return true
    return x.includes(tipo) || tipo.includes(x)
  })
  if (byLabel) return byLabel

  // Default frecuente en particulares: 2 = "Mas de 800 Kg de peso"
  const cat2 = categorias.find((c) => Number(c.ccategoria_uso) === 2)
  if (cat2) return cat2

  return categorias[0]
}

function vehicleCacheKey(vehiculo = {}) {
  return [
    vehiculo.anio,
    normalizeLabel(vehiculo.marca),
    normalizeLabel(vehiculo.modelo),
    normalizeLabel(vehiculo.version),
    normalizeLabel(vehiculo.tipo),
  ].join('|')
}

/**
 * Cascada INMA: marcas → modelo → version → categorias-uso.
 * @returns {Promise<{
 *   fano:number, cmarca:string, cmodelo:string, cversion:string, ccategoria_uso:number,
 *   matched: object
 * }>}
 */
export async function resolveInmaVehicle(vehiculo = {}) {
  const fano = Number(vehiculo.anio)
  if (!Number.isFinite(fano) || fano < 1900) {
    throw new ValrepApiError(0, 'Año del vehículo inválido para cotizar')
  }
  if (!vehiculo.marca?.trim()) {
    throw new ValrepApiError(0, 'Falta la marca del vehículo para cotizar')
  }

  const key = vehicleCacheKey(vehiculo)
  if (resolveCache.has(key)) return resolveCache.get(key)

  const promise = (async () => {
    const marcas = await fetchInmaMarcas(fano)
    const marca = bestCatalogMatch(marcas, 'xmarca', vehiculo.marca)
    if (!marca?.cmarca) throw new ValrepApiError(0, `No se encontró la marca "${vehiculo.marca}" en INMA`)

    const modelos = await fetchInmaModelos(fano, marca.cmarca)
    const modelo = bestCatalogMatch(modelos, 'xmodelo', vehiculo.modelo || vehiculo.version || '')
    if (!modelo?.cmodelo) throw new ValrepApiError(0, `No se encontró el modelo "${vehiculo.modelo}" en INMA`)

    const versiones = await fetchInmaVersiones(fano, marca.cmarca, modelo.cmodelo)
    const versionSearch = [vehiculo.version, vehiculo.modelo].filter(Boolean).join(' ')
    const version = bestCatalogMatch(versiones, 'xversion', versionSearch) || versiones[0]
    if (!version?.cversion) throw new ValrepApiError(0, 'No se encontró versión INMA para el vehículo')

    const categorias = await fetchInmaCategoriasUso(
      fano,
      marca.cmarca,
      modelo.cmodelo,
      version.cversion,
    )
    const categoria = pickCategoriaUso(categorias, vehiculo.tipo)
    if (categoria?.ccategoria_uso == null) {
      throw new ValrepApiError(0, 'No se encontró categoría de uso INMA')
    }

    return {
      fano,
      cmarca: String(marca.cmarca),
      cmodelo: String(modelo.cmodelo),
      cversion: String(version.cversion),
      ccategoria_uso: Number(categoria.ccategoria_uso),
      matched: {
        marca: marca.xmarca,
        modelo: modelo.xmodelo,
        version: version.xversion,
        categoria: categoria.xcategoria_uso,
      },
    }
  })()

  resolveCache.set(key, promise)
  try {
    return await promise
  } catch (err) {
    resolveCache.delete(key)
    throw err
  }
}

/** Prima UI a partir de `mprimaext` (monto anual en $). */
export function primaFromMprimaext(mprimaext, extra = {}) {
  const monto = Number(mprimaext)
  const anual = Number.isFinite(monto) ? Math.round(monto * 100) / 100 : 0
  return {
    /** Base Valrep: siempre anual */
    monto: anual,
    anual,
    semestral: Math.round((anual / 2) * 100) / 100,
    mensual: Math.round((anual / 12) * 100) / 100,
    diaria: Math.round((anual / 365) * 100) / 100,
    base: 'anual',
    provisional: false,
    cotizada: true,
    ...extra,
  }
}
