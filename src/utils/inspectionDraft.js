/**
 * Persistencia del borrador de inspección (sessionStorage).
 * Evita perder datos si el redirect del pago falla o el usuario vuelve.
 */

export const INSPECTION_DRAFT_KEY = 'ac_inspection_draft_v1'

/**
 * @typedef {object} InspectionDraft
 * @property {string} savedAt
 * @property {string} inspectionNumber
 * @property {number} [step]
 * @property {string} [idOperacion]
 * @property {object} [titular]
 * @property {object} [tomador]
 * @property {boolean} [tomadorEsTitular]
 * @property {object} [docs]
 * @property {object} [vehiculo]
 * @property {object} [ubicacion]
 * @property {object} [resultado]
 * @property {object} [selectedPlan]
 * @property {object} [photosMeta]
 * @property {object} [checkout]
 * @property {object} [paymentNotify]
 * @property {object} [emission]
 * @property {object} [policy]
 */

function stripFiles(docs = {}) {
  const out = { ...docs }
  for (const key of Object.keys(out)) {
    if (typeof File !== 'undefined' && out[key] instanceof File) {
      out[key] = { name: out[key].name, type: out[key].type, size: out[key].size }
    }
  }
  return out
}

/** Photos: solo metadata para no saturar sessionStorage. */
function photosMeta(photos = {}) {
  const meta = {}
  for (const [k, v] of Object.entries(photos)) {
    if (!v || typeof v !== 'object') continue
    meta[k] = {
      hasPreview: Boolean(v.preview || v.url || v.dataUrl),
      analyzing: Boolean(v.analyzing),
      estado: v.estado ?? null,
      issues: Array.isArray(v.issues) ? v.issues.length : 0,
    }
  }
  return meta
}

export function buildInspectionDraft(partial = {}) {
  return {
    savedAt: new Date().toISOString(),
    inspectionNumber: partial.inspectionNumber || '',
    step: partial.step ?? 0,
    idOperacion: partial.idOperacion || null,
    titular: partial.titular || null,
    tomador: partial.tomador || null,
    tomadorEsTitular: Boolean(partial.tomadorEsTitular),
    docs: stripFiles(partial.docs || {}),
    vehiculo: partial.vehiculo || null,
    ubicacion: partial.ubicacion
      ? {
          lat: partial.ubicacion.lat ?? null,
          lng: partial.ubicacion.lng ?? null,
          direccion: partial.ubicacion.direccion || '',
        }
      : null,
    resultado: partial.resultado || null,
    selectedPlan: partial.selectedPlan || null,
    photosMeta: photosMeta(partial.photos || {}),
    checkout: partial.checkout || null,
    paymentNotify: partial.paymentNotify || null,
    emission: partial.emission || null,
    policy: partial.policy || null,
  }
}

export function saveInspectionDraft(partial) {
  const draft = buildInspectionDraft(partial)
  try {
    sessionStorage.setItem(INSPECTION_DRAFT_KEY, JSON.stringify(draft))
    return draft
  } catch (err) {
    // Reintento sin campos pesados
    try {
      const light = { ...draft, selectedPlan: draft.selectedPlan
        ? {
            id: draft.selectedPlan.raw?.cplan ?? draft.selectedPlan.cplan ?? draft.selectedPlan.id,
            cplan: draft.selectedPlan.raw?.cplan ?? draft.selectedPlan.cplan ?? null,
            nombre: draft.selectedPlan.nombre,
            source: draft.selectedPlan.source,
            frecuenciaCodigo: draft.selectedPlan.frecuenciaCodigo,
            frecuencia: draft.selectedPlan.frecuencia,
            prima: draft.selectedPlan.prima,
            cotizacion: draft.selectedPlan.cotizacion,
            inmaCodes: draft.selectedPlan.inmaCodes,
            inmaMatched: draft.selectedPlan.inmaMatched,
            raw: draft.selectedPlan.raw?.cplan != null
              ? { cplan: draft.selectedPlan.raw.cplan }
              : null,
          }
        : null }
      sessionStorage.setItem(INSPECTION_DRAFT_KEY, JSON.stringify(light))
      return light
    } catch {
      console.warn('[inspectionDraft] No se pudo guardar borrador', err)
      return null
    }
  }
}

export function loadInspectionDraft() {
  try {
    const raw = sessionStorage.getItem(INSPECTION_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function updateInspectionDraft(patch = {}) {
  const prev = loadInspectionDraft() || {}
  return saveInspectionDraft({ ...prev, ...patch })
}

export function clearInspectionDraft() {
  try {
    sessionStorage.removeItem(INSPECTION_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}
