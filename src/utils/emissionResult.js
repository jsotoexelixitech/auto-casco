/**
 * Parseo de respuesta POST /external/createEmissionAuto
 *
 * Ejemplo éxito:
 * {
 *   "status": true,
 *   "result": {
 *     "message": "Póliza generada exitosamente",
 *     "cnpoliza": "18-1-0000079013",
 *     "cnrecibo": "18-100272336",
 *     "urlpoliza": "https://…/poliza/…",
 *     "ncuota": 1,
 *     "fanopol": 2025,
 *     "fmespol": 6
 *   }
 * }
 */

import { persistInspectionSnapshot } from './persistInspection'

export function parseEmissionAutoResponse(json = {}) {
  const topOk = json?.status === true || json?.status === 'true' || json?.status === 1
  const result = json?.result ?? json?.data?.result ?? json?.data ?? null

  if (!topOk && result?.status === false) {
    return { ok: false, message: pickMsg(result, json) || 'No se pudo emitir la póliza', result: null }
  }
  if (json?.status === false) {
    return { ok: false, message: pickMsg(json?.result, json) || 'No se pudo emitir la póliza', result: null }
  }

  const body = result && typeof result === 'object' ? result : json
  const cnpoliza = body?.cnpoliza || body?.poliza || body?.npoliza || body?.numero_poliza || body?.policyNumber || null
  const urlpoliza = body?.urlpoliza || body?.url_poliza || body?.pdfUrl || null

  if (!cnpoliza && !topOk && !body?.message) {
    return { ok: false, message: pickMsg(body, json) || 'Respuesta de emisión inválida', result: null }
  }

  return {
    ok: true,
    message: body?.message || 'Póliza generada exitosamente',
    cnpoliza: cnpoliza ? String(cnpoliza) : null,
    cnrecibo: body?.cnrecibo != null ? String(body.cnrecibo) : null,
    urlpoliza: urlpoliza ? String(urlpoliza) : null,
    ncuota: body?.ncuota ?? null,
    fanopol: body?.fanopol ?? null,
    fmespol: body?.fmespol ?? null,
    raw: body,
  }
}

function pickMsg(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue
    for (const key of ['message', 'mensaje', 'motivo', 'error', 'description']) {
      const v = src[key]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
  }
  return ''
}

/** Upsert local + persistencia en BD (Nest Inspection). */
export async function upsertInspectionRecord(
  {
    getInspection,
    addInspection,
    updateInspection,
    vehicles,
    setVehicles,
    persist = true,
  },
  snapshot,
) {
  const id = snapshot?.id || snapshot?.numero
  if (!id) return null

  if (!persist) {
    const existing = getInspection?.(id)
    if (existing) {
      updateInspection?.(id, { ...snapshot, id, numero: snapshot.numero || id })
      return { ...existing, ...snapshot, id }
    }
    const created = {
      fechaCreacion: new Date().toISOString(),
      tipo: 'Auto-Gestionable',
      ...snapshot,
      id,
      numero: snapshot.numero || id,
    }
    addInspection?.(created)
    return created
  }

  return persistInspectionSnapshot(snapshot, {
    getInspection,
    addInspectionLocal: (row) => addInspection?.(row),
    updateInspectionLocal: (inspId, patch) => updateInspection?.(inspId, patch),
    vehicles,
    setVehicles,
  })
}

const EMISSION_STORE_KEY = 'auto-casco:emisiones'

/** Guarda el resultado de emisión para reabrir `/pago/resultado?poliza=…` sin borrador. */
export function saveEmissionSnapshot(done) {
  const key = String(done?.policyNumber || done?.cnpoliza || '').trim()
  if (!key) return
  try {
    const all = loadAllEmissionSnapshots()
    all[key] = {
      policyNumber: key,
      cnrecibo: done.cnrecibo ?? null,
      urlpoliza: done.urlpoliza ?? null,
      message: done.message || 'Póliza generada exitosamente',
      idOperacion: done.idOperacion ?? null,
      inspectionNumber: done.inspectionNumber ?? null,
      planNombre: done.planNombre ?? done.plan?.nombre ?? null,
      cnpoliza: done.cnpoliza ?? key,
      fanopol: done.fanopol ?? done.emission?.fanopol ?? null,
      fmespol: done.fmespol ?? done.emission?.fmespol ?? null,
      ncuota: done.ncuota ?? done.emission?.ncuota ?? null,
      placa: done.placa ?? null,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(EMISSION_STORE_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadEmissionSnapshot(poliza) {
  const key = String(poliza || '').trim()
  if (!key) return null
  return loadAllEmissionSnapshots()[key] || null
}

function loadAllEmissionSnapshots() {
  try {
    const raw = localStorage.getItem(EMISSION_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** URL canónica de la pantalla de éxito post-emisión. */
export function emissionResultPath(poliza) {
  return `/pago/resultado?poliza=${encodeURIComponent(String(poliza))}`
}
