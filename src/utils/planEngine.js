import { BRAND } from '../theme/tokens'

/**
 * Plan Engine — La Mundial de Seguros
 *
 * Determina el plan de seguro elegible basado en el resultado
 * de la inspección vehicular analizada por Gemini Vision.
 *
 * Reglas de negocio (Minuta La Mundial — v2, basada en piezas BUENAS):
 *   ≥ 10 buenas             → Cobertura Amplia (sin deducible) + Pérdida Total disponible
 *   7 – 9 buenas            → Cobertura Amplia CON deducible (regulares×2% + malas×5%, máx 30%)
 *   4 – 6 buenas            → Pérdida Total únicamente
 *   < 4 buenas              → No asegurable
 */

export const PLANES = {
  COBERTURA_AMPLIA: {
    id: 'cobertura_amplia',
    nombre: 'Cobertura Amplia',
    subtitulo: 'Auto Casco — Protección Total',
    descripcion: 'El vehículo está en excelentes condiciones. Accede a la cobertura más completa: daños propios, robo total, responsabilidad civil y asistencia 24/7.',
    icono: 'verified_user',
    color: 'success',
    colorHex: '#16A34A',
    colorBg: '#DCFCE7',
    prima: { mensual: 285, anual: 3060, diaria: 9.5 },
    coberturas: [
      { nombre: 'Daños propios (casco)', incluida: true },
      { nombre: 'Responsabilidad Civil', incluida: true },
      { nombre: 'Robo Total', incluida: true },
      { nombre: 'Robo Parcial', incluida: true },
      { nombre: 'Gastos médicos ocupantes', incluida: true },
      { nombre: 'Asistencia vial 24/7', incluida: true },
      { nombre: 'Vehículo de reemplazo', incluida: true },
    ],
    badge: 'Recomendado',
    badgeTone: 'success',
  },
  COBERTURA_AMPLIA_CON_DEDUCIBLE: {
    id: 'cobertura_amplia_deducible',
    nombre: 'Cobertura Amplia',
    subtitulo: 'Auto Casco — Con Deducible',
    descripcion: 'El vehículo califica para Cobertura Amplia con un deducible proporcional al nivel de daños detectados en la inspección.',
    icono: 'verified_user',
    color: 'warning',
    colorHex: '#D97706',
    colorBg: '#FEF3C7',
    prima: { mensual: 245, anual: 2640, diaria: 8.2 },
    coberturas: [
      { nombre: 'Daños propios (casco)', incluida: true },
      { nombre: 'Responsabilidad Civil', incluida: true },
      { nombre: 'Robo Total', incluida: true },
      { nombre: 'Robo Parcial', incluida: true },
      { nombre: 'Gastos médicos ocupantes', incluida: true },
      { nombre: 'Asistencia vial 24/7', incluida: true },
      { nombre: 'Vehículo de reemplazo', incluida: false },
    ],
    badge: 'Con deducible',
    badgeTone: 'warning',
  },
  RCV: {
    id: 'rcv',
    nombre: 'RCV',
    subtitulo: 'Responsabilidad Civil Vehicular',
    descripcion: 'El vehículo presenta daños moderados. Se ofrece cobertura de Responsabilidad Civil para proteger a terceros, con deducible aplicable por las condiciones del vehículo.',
    icono: 'gavel',
    color: 'warning',
    colorHex: '#D97706',
    colorBg: '#FEF3C7',
    prima: { mensual: 120, anual: 1320, diaria: 4.0 },
    coberturas: [
      { nombre: 'Responsabilidad Civil a terceros', incluida: true },
      { nombre: 'Gastos médicos a terceros', incluida: true },
      { nombre: 'Asistencia vial básica', incluida: true },
      { nombre: 'Daños propios (casco)', incluida: false },
      { nombre: 'Robo Total', incluida: false },
      { nombre: 'Vehículo de reemplazo', incluida: false },
    ],
    badge: 'Con deducible',
    badgeTone: 'warning',
  },
  PERDIDA_TOTAL: {
    id: 'perdida_total',
    nombre: 'Pérdida Total',
    subtitulo: 'Cobertura por Pérdida Total',
    descripcion: 'El vehículo presenta daños significativos. Se puede ofrecer cobertura limitada únicamente para casos de Pérdida Total (siniestro catastrófico).',
    icono: 'car_crash',
    color: 'error',
    colorHex: '#DC2626',
    colorBg: '#FEE2E2',
    prima: { mensual: 75, anual: 840, diaria: 2.5 },
    coberturas: [
      { nombre: 'Pérdida Total por accidente', incluida: true },
      { nombre: 'Pérdida Total por robo', incluida: true },
      { nombre: 'Responsabilidad Civil', incluida: false },
      { nombre: 'Daños parciales', incluida: false },
      { nombre: 'Asistencia vial', incluida: false },
    ],
    badge: 'Cobertura limitada',
    badgeTone: 'error',
  },
}

/**
 * Calcula totales de piezas desde el estado de fotos de la inspección.
 * @param {Object} photos - Estado de fotos del hook useInspectionState
 * @returns {{ buenas, regulares, malas, noExiste, total, analizadas }}
 */
export function calcularPiezas(photos) {
  let buenas = 0, regulares = 0, malas = 0, noExiste = 0

  Object.values(photos).forEach((photo) => {
    if (!photo.analyzed) return
    Object.values(photo.piezas).forEach((pieza) => {
      if (pieza.estado === 'B') buenas++
      else if (pieza.estado === 'R') regulares++
      else if (pieza.estado === 'M') malas++
      else if (pieza.estado === 'NE') noExiste++
    })
  })

  const total = buenas + regulares + malas
  const analizadas = Object.values(photos).filter((p) => p.analyzed).length

  return { buenas, regulares, malas, noExiste, total, analizadas }
}

// ── Defaults — single source of truth (imported by ConfiguracionIAPage) ─────
export const CONFIG_DEFAULTS = {
  minBuenasAmplia: 10,
  minBuenasConDeducible: 7,
  minBuenasPerdidaTotal: 4,
  pctRegular: 2,
  pctMala: 5,
  maxDeducible: 30,
}

/**
 * Lee la configuración guardada desde localStorage.
 * Si no existe o está corrupta, devuelve los valores por defecto.
 */
export function loadPlanConfig() {
  try {
    const raw = localStorage.getItem('ia_config')
    if (raw) return { ...CONFIG_DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...CONFIG_DEFAULTS }
}

/**
 * Calcula el porcentaje de deducible usando la config activa.
 * @param {{ regulares: number, malas: number }} piezas
 * @param {Object} [cfg] - config opcional; si no se pasa, lee de localStorage
 * @returns {number} porcentaje de deducible
 */
export function calcularDeducible({ regulares, malas }, cfg) {
  const { pctRegular, pctMala, maxDeducible } = cfg || loadPlanConfig()
  return Math.min(maxDeducible, regulares * pctRegular + malas * pctMala)
}

/**
 * Determina el plan elegible según las reglas de negocio de La Mundial.
 * Basado en PIEZAS BUENAS (v2).
 * @param {Object} photos - Estado de fotos del hook useInspectionState
 * @returns {{ plan: Object|null, planesDisponibles: Object[], elegible: boolean, piezas: Object, motivo: string, deducible: number|null }}
 */
export function determinarPlan(photos) {
  const piezas = calcularPiezas(photos)
  const { buenas, regulares, malas } = piezas

  // Lee umbrales desde la configuración guardada (o defaults)
  const cfg = loadPlanConfig()
  const { minBuenasAmplia, minBuenasConDeducible, minBuenasPerdidaTotal } = cfg

  // Sin análisis suficiente
  if (piezas.analizadas === 0) {
    return {
      plan: null,
      planesDisponibles: [],
      elegible: false,
      piezas,
      deducible: null,
      motivo: 'No hay fotos analizadas. Completa la inspección fotográfica.',
    }
  }

  // ── Regla 1: < minBuenasPerdidaTotal → No asegurable ─────────────────
  if (buenas < minBuenasPerdidaTotal) {
    return {
      plan: null,
      planesDisponibles: [],
      elegible: false,
      piezas,
      deducible: null,
      motivo: `El vehículo presenta solo ${buenas} piezas en buen estado, por debajo del mínimo de ${minBuenasPerdidaTotal}. No es asegurable.`,
    }
  }

  // ── Regla 2: minBuenasPerdidaTotal – (minBuenasConDeducible-1) → Pérdida Total ──
  if (buenas < minBuenasConDeducible) {
    return {
      plan: PLANES.PERDIDA_TOTAL,
      planesDisponibles: [PLANES.PERDIDA_TOTAL],
      elegible: true,
      piezas,
      deducible: null,
      motivo: `${buenas} piezas buenas (rango ${minBuenasPerdidaTotal}–${minBuenasConDeducible - 1}). El vehículo solo califica para cobertura de Pérdida Total.`,
    }
  }

  // ── Regla 3: minBuenasConDeducible – (minBuenasAmplia-1) → Cob. Amplia con deducible ──
  if (buenas < minBuenasAmplia) {
    const pctDano = calcularDeducible({ regulares, malas }, cfg)
    return {
      plan: PLANES.COBERTURA_AMPLIA_CON_DEDUCIBLE,
      planesDisponibles: [PLANES.COBERTURA_AMPLIA_CON_DEDUCIBLE],
      elegible: true,
      piezas,
      deducible: pctDano,
      motivo: `${buenas} piezas buenas (rango ${minBuenasConDeducible}–${minBuenasAmplia - 1}). Cobertura Amplia disponible con deducible del ${pctDano}%.`,
    }
  }

  // ── Regla 4: ≥ minBuenasAmplia → Cobertura Amplia sin deducible + Pérdida Total ──
  return {
    plan: PLANES.COBERTURA_AMPLIA,
    planesDisponibles: [PLANES.COBERTURA_AMPLIA, PLANES.PERDIDA_TOTAL],
    elegible: true,
    piezas,
    deducible: null,
    motivo: `Excelente estado: ${buenas} piezas buenas (≥ ${minBuenasAmplia}). Puede optar a Cobertura Amplia sin deducible o Pérdida Total.`,
  }
}
