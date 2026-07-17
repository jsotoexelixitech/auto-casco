/**
 * Persistencia de inspección hacia el API Nest (tabla Inspection).
 * Usado en: paso pago → confirmación pago → emisión.
 *
 * Los `id` en Prisma son cuid() (string), no correlativos.
 */

import * as api from '../services/api'
import { getToken } from '../services/api'

/** Normaliza placa para buscar / crear vehículo. */
export function normalizePlaca(placa) {
  return String(placa || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function ubicacionLabel(ubicacion) {
  if (!ubicacion) return undefined
  if (typeof ubicacion === 'string') return ubicacion.trim() || undefined
  return (
    ubicacion.direccion
    || ubicacion.formatted
    || ubicacion.address
    || [ubicacion.ciudad, ubicacion.estado, ubicacion.municipio].filter(Boolean).join(', ')
    || undefined
  )
}

function asJsonString(value, fallback = '[]') {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return fallback
  }
}

function omitUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) out[k] = v
  }
  return out
}

/** Metadatos del flujo sin archivos ni blobs pesados. */
export function buildInspectionObservaciones(snapshot = {}) {
  const meta = {
    inspectionNumber: snapshot.numero || snapshot.id || null,
    tipoUi: snapshot.tipo || 'Auto-Gestionable',
    estadoUi: snapshot.estado || null,
    planRecomendado: snapshot.planRecomendado ?? snapshot.selectedPlan?.id ?? null,
    planNombre: snapshot.selectedPlan?.nombre ?? snapshot.planNombre ?? null,
    titular: snapshot.titular
      ? {
          nombre: snapshot.titular.nombreCompleto || snapshot.titular.nombre || null,
          documento: snapshot.titular.cedula || snapshot.titular.documento || snapshot.titular.rif || null,
        }
      : null,
    tomadorEsTitular: snapshot.tomadorEsTitular ?? null,
    payment: snapshot.payment
      ? {
          id: snapshot.payment.id,
          reference: snapshot.payment.reference,
          idOperacion: snapshot.payment.idOperacion || snapshot.idOperacion,
          metodo: snapshot.payment.metodo,
          monto: snapshot.payment.monto,
          fecha: snapshot.payment.fecha,
        }
      : null,
    idOperacion: snapshot.idOperacion || null,
    policyNumber: snapshot.policyNumber || snapshot.cnpoliza || null,
    cnrecibo: snapshot.cnrecibo || null,
    urlpoliza: snapshot.urlpoliza || null,
    emission: snapshot.emission
      ? {
          cnpoliza: snapshot.emission.cnpoliza,
          cnrecibo: snapshot.emission.cnrecibo,
          urlpoliza: snapshot.emission.urlpoliza,
          message: snapshot.emission.message,
          fanopol: snapshot.emission.fanopol,
          fmespol: snapshot.emission.fmespol,
          ncuota: snapshot.emission.ncuota,
        }
      : null,
    resultadoResumen: snapshot.resultado
      ? {
          elegible: snapshot.resultado.elegible,
          score: snapshot.resultado.score ?? snapshot.resultado.pctBuenas,
        }
      : null,
  }
  return JSON.stringify(meta)
}

export function mapSnapshotToInspectionDto(snapshot, vehicleId) {
  const lat = Number(snapshot.ubicacion?.lat ?? snapshot.ubicacion?.latitude)
  const lng = Number(snapshot.ubicacion?.lng ?? snapshot.ubicacion?.longitude)
  return omitUndefined({
    vehicleId,
    numero: snapshot.numero || snapshot.id,
    // Tipo canónico en BD; el UI queda en observaciones.tipoUi
    tipo: 'inicial',
    estado: snapshot.estado || 'Pendiente de pago',
    ubicacion: ubicacionLabel(snapshot.ubicacion),
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
    fotos: asJsonString(snapshot.fotosMeta || snapshot.fotos || [], '[]'),
    danios: asJsonString(
      Array.isArray(snapshot.daniosList)
        ? snapshot.daniosList
        : Array.isArray(snapshot.danios)
          ? snapshot.danios
          : [],
      '[]',
    ),
    observaciones: buildInspectionObservaciones(snapshot),
  })
}

/**
 * Asegura vehículo en API por placa. Devuelve id cuid del servidor.
 */
export async function ensureVehicleForInspection(vehiculo, { vehicles = [], setVehicles } = {}) {
  const placa = normalizePlaca(vehiculo?.placa)
  if (!placa) {
    throw new Error('La inspección requiere placa del vehículo para guardarse en BD')
  }

  const local = vehicles.find((v) => normalizePlaca(v.placa) === placa)
  if (local?.dbId != null) return Number(local.dbId) || local.dbId
  // ID correlativo numérico de Prisma (no mock veh-xxx)
  if (local?.id != null && !String(local.id).startsWith('veh-')) {
    const n = Number(local.id)
    if (Number.isInteger(n) && n > 0) return n
  }

  if (!getToken()) {
    throw new Error('Debes iniciar sesión para guardar en la base de datos')
  }

  try {
    const list = await api.vehicles.list()
    const remote = (list || []).find((v) => normalizePlaca(v.placa) === placa)
    if (remote?.id) {
      const normalized = { ...remote, dbId: remote.id }
      setVehicles?.((prev) => {
        const without = (prev || []).filter((v) => normalizePlaca(v.placa) !== placa)
        return [normalized, ...without]
      })
      return remote.id
    }
  } catch (err) {
    console.warn('[persistInspection] list vehicles failed', err)
  }

  const anio = Number(vehiculo?.anio) || new Date().getFullYear()
  const payload = omitUndefined({
    placa,
    marca: String(vehiculo?.marca || 'Por definir').slice(0, 80),
    modelo: String(vehiculo?.modelo || 'Por definir').slice(0, 80),
    anio,
    color: vehiculo?.color || undefined,
    tipo: vehiculo?.tipo || undefined,
    serial: vehiculo?.serial || vehiculo?.vin || undefined,
  })

  try {
    const created = await api.vehicles.create(payload)
    const normalized = { ...created, dbId: created.id, placa: created.placa || placa }
    setVehicles?.((prev) => [normalized, ...(prev || []).filter((v) => normalizePlaca(v.placa) !== placa)])
    return created.id
  } catch (err) {
    // Placa duplicada → reconsultar
    try {
      const list = await api.vehicles.list()
      const remote = (list || []).find((v) => normalizePlaca(v.placa) === placa)
      if (remote?.id) {
        setVehicles?.((prev) => {
          const normalized = { ...remote, dbId: remote.id }
          const without = (prev || []).filter((v) => normalizePlaca(v.placa) !== placa)
          return [normalized, ...without]
        })
        return remote.id
      }
    } catch { /* ignore */ }
    throw err
  }
}

/**
 * Crea o actualiza inspección en BD.
 * @returns {{ persisted: boolean, dbId?: string, error?: string, ...snapshot }}
 */
export async function persistInspectionSnapshot(snapshot, ctx = {}) {
  const {
    getInspection,
    addInspectionLocal,
    updateInspectionLocal,
    vehicles,
    setVehicles,
  } = ctx

  const id = snapshot?.id || snapshot?.numero
  if (!id) return { persisted: false, error: 'Sin número de inspección' }

  const existing = getInspection?.(id)
  const merged = { ...existing, ...snapshot, id, numero: snapshot.numero || id }

  if (existing) {
    updateInspectionLocal?.(id, merged)
  } else {
    addInspectionLocal?.({
      fechaCreacion: new Date().toISOString(),
      tipo: 'Auto-Gestionable',
      ...merged,
    })
  }

  if (!getToken()) {
    return {
      ...merged,
      persisted: false,
      error: 'Sin sesión: la inspección quedó solo en el navegador. Inicia sesión para guardar en BD.',
    }
  }

  try {
    const vehicleId = await ensureVehicleForInspection(merged.vehiculo || { placa: merged.placa }, {
      vehicles,
      setVehicles,
    })

    const dto = mapSnapshotToInspectionDto(merged, vehicleId)
    let dbId = merged.dbId || existing?.dbId
    let remote = null

    // Si no hay dbId, intentar localizar por número (cuid / numero wizard)
    if (!dbId && dto.numero) {
      try {
        const found = await api.inspections.get(dto.numero)
        if (found?.id) dbId = found.id
      } catch {
        /* no existe aún */
      }
    }

    if (dbId) {
      remote = await api.inspections.update(dbId, dto)
    } else {
      try {
        remote = await api.inspections.create(dto)
      } catch (err) {
        if (err?.status === 409 && dto.numero) {
          remote = await api.inspections.update(dto.numero, dto)
        } else {
          throw err
        }
      }
    }

    const enriched = {
      ...merged,
      dbId: remote?.id || dbId,
      numero: remote?.numero || merged.numero,
      estado: remote?.estado || merged.estado,
      persisted: true,
      error: null,
    }
    updateInspectionLocal?.(id, enriched)
    return enriched
  } catch (err) {
    const message = err?.message || 'No se pudo guardar la inspección en BD'
    console.warn('[persistInspection] API failed', err)
    return { ...merged, persisted: false, error: message }
  }
}
