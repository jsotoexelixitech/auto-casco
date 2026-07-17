/**
 * Adapta el catálogo Valrep (`planes/v2`) a la forma que usa ResultadoPlan / PaymentStep.
 * No inventa suma asegurada ni coberturas: eso no viene estructurado en la API.
 */

function normalizeTag(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

/** Quita abreviaturas entre paréntesis: "Plan 7k$(RCV,…)" → "Plan 7k$". */
export function stripPlanParenLabels(text = '') {
  return String(text || '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Código de plan para cotización / emisión.
 * Prioriza `cplan` del catálogo Valrep (`planes/v2`).
 */
export function resolveValrepCplan(plan) {
  for (const raw of [plan?.cplan, plan?.raw?.cplan, plan?.id]) {
    const code = String(raw ?? '').trim()
    if (code) return code
  }
  return ''
}

/** Extrae tokens entre paréntesis, p.ej. (RCV,EL,DP,APOV, CLUB BÁSICO) — solo para badge/icono. */
export function parseCoberturaTags(xplan = '') {
  const m = String(xplan).match(/\(([^)]*)\)/)
  if (!m) return []
  return m[1]
    .split(',')
    .map((t) => normalizeTag(t))
    .filter(Boolean)
    .map((t) => {
      if (t.includes('CLUB') && t.includes('BÁS')) return 'CB'
      if (t.includes('CLUB') && t.includes('BAS')) return 'CB'
      if (t.includes('CLUB') && t.includes('PLUS')) return 'CP'
      if (t.includes('CLUB') && t.includes('GOLD')) return 'CG'
      if (t.includes('CLUB') && t.includes('DIAM')) return 'CD'
      if (t === 'CLUB BÁSICO' || t === 'CLUB BASICO') return 'CB'
      return t
    })
}

/**
 * Nivel numérico del plan.
 * Soporta "Plan 5.000$", "Plan 5k$", "5K$" etc.
 */
export function parseSumaAsegurada(text = '') {
  const s = String(text || '')

  // Formato corto: 1k$ / 5K / 10k$
  const mk = s.match(/(\d+(?:[.,]\d+)?)\s*[kK]\b/)
  if (mk) {
    const base = Number(String(mk[1]).replace(',', '.'))
    if (Number.isFinite(base)) return Math.round(base * 1000)
  }

  // Formato con miles VE: 1.000$ / 10.000$
  const m = s.match(/(\d[\d.,]*)\s*\$/)
  if (!m) return null

  const raw = m[1]
  // "1.000" o "10.000" → quitar puntos de miles
  // "1,5" poco habitual en estos nombres; se ignora como decimal
  const digits = raw.includes('.') && /^\d{1,3}(\.\d{3})+$/.test(raw)
    ? raw.replace(/\./g, '')
    : raw.replace(/[^\d]/g, '')
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

function resolveNivelFromTexts(...texts) {
  for (const t of texts) {
    const n = parseSumaAsegurada(t)
    if (n != null && n > 0) return n
  }
  return 0
}

function resolveIcono(cplan, tags) {
  const id = String(cplan || '').toUpperCase()
  if (id.includes('RCV') || (tags.length === 1 && tags[0] === 'RCV')) return 'gavel'
  if (id.includes('BOLI')) return 'directions_boat'
  return 'verified_user'
}

/**
 * @param {object} raw - ítem de data.plan Valrep
 */
export function mapValrepPlanToUi(raw) {
  const tags = parseCoberturaTags(raw.xplan)
  // `id` / `cplan` = valor exacto de data.plan[].cplan en planes/v2
  const cplan = raw.cplan == null ? '' : String(raw.cplan).trim()
  const nombre = stripPlanParenLabels(raw.xplan_c || raw.xplan || cplan || 'Plan')
  const subtitulo = stripPlanParenLabels(raw.xplan || '')
  const nivelPlan = resolveNivelFromTexts(raw.xplan, raw.xplan_c, nombre, cplan)
  const moneda = String(raw.cmoneda || '$').trim()

  return {
    id: cplan,
    cplan,
    nombre,
    subtitulo,
    descripcion: '',
    icono: resolveIcono(cplan, tags),
    color: 'info',
    colorHex: '#0F1A5A',
    colorBg: '#EEF0FA',
    prima: { monto: null, mensual: 0, diaria: 0, anual: 0, provisional: true, moneda },
    coberturas: [],
    badge: null,
    badgeTone: 'info',
    incluyeRcv: tags.includes('RCV') || cplan.toUpperCase().includes('RCV'),
    coletilla: null,
    nivelPlan,
    moneda,
    source: 'valrep',
    raw,
  }
}

export function mapValrepPlanesToUi(list = []) {
  return list
    .filter((p) => p && (p.iestado == null || String(p.iestado).toUpperCase() === 'V'))
    .filter((p) => String(p.cmoneda || '').trim() === '$')
    .map(mapValrepPlanToUi)
    .filter((p) => Boolean(p.cplan))
}

function isRcvPlan(p) {
  return (
    String(p.id || '').toUpperCase().includes('RCV')
    || /rcv/i.test(p.nombre || '')
    || /rcv/i.test(p.subtitulo || '')
  )
}

function isEspecialPlan(p) {
  const id = String(p.id || '').toUpperCase()
  const name = `${p.nombre || ''} ${p.subtitulo || ''}`.toUpperCase()
  return id.includes('BOLI') || name.includes('BOLIPUERTO') || name.includes('PRUEBA')
}

/**
 * Nivel Valrep objetivo según el plan IA + piezas del análisis.
 * Con vehículo casi impecable apunta a ~5k–7k, no al mínimo.
 */
export function resolveTargetNivel(iaPlan, piezas = {}) {
  const iaId = iaPlan?.id || ''
  const buenas = Number(piezas.buenas) || 0
  const regulares = Number(piezas.regulares) || 0
  const malas = Number(piezas.malas) || 0
  const total = Math.max(1, buenas + regulares + malas)
  const pctBuenas = (buenas / total) * 100

  if (iaId === 'rcv') return 0
  if (iaId === 'perdida_total') return 1500

  if (iaId === 'cobertura_amplia') {
    // Sin observancias: mayor protección
    if (pctBuenas >= 95) return 7000
    return 5000
  }

  // cobertura_amplia_deducible u otros:
  // vehículo casi impecable (p.ej. 39 buenas / 1 regular) → 7k
  if (malas === 0 && pctBuenas >= 95) return 7000
  if (malas === 0 && pctBuenas >= 90) return 5000
  if (pctBuenas >= 80) return 3000
  if (pctBuenas >= 70) return 2000
  return 1500
}

/**
 * Puntúa un plan Valrep según el resultado del motor IA (`determinarPlan`).
 * Mayor score = más preferible.
 */
export function scorePlanForIa(plan, iaPlan, piezas = {}) {
  const iaId = iaPlan?.id || ''
  const nivel = Number(plan.nivelPlan) || resolveNivelFromTexts(plan.subtitulo, plan.nombre, plan.id)
  const rcv = isRcvPlan(plan)
  let score = 0

  if (isEspecialPlan(plan)) score -= 50

  if (iaId === 'rcv') {
    if (rcv) return score + 120
    // Evitar sugerir casco alto cuando solo califica RCV
    return score + 25 - Math.min(nivel / 400, 35)
  }

  if (rcv) {
    // RCV solo como respaldo cuando hay casco disponible
    score -= 20
  }

  if (!nivel) {
    // Sin nivel parseable: no debe ganar al ranking
    return score + 8
  }

  const target = resolveTargetNivel(iaPlan, piezas)
  const dist = Math.abs(nivel - target)
  // 100 en el target; baja ~1 pt cada $80 de distancia
  score += 100 - Math.min(dist / 80, 75)

  // Vehículo sano: leve bonus si el plan está en el target o por encima (más protección)
  const malas = Number(piezas.malas) || 0
  if (
    (iaId === 'cobertura_amplia' || iaId === 'cobertura_amplia_deducible')
    && malas === 0
    && nivel >= target
  ) {
    score += 6
  }

  // Pérdida total: preferir niveles bajos reales
  if (iaId === 'perdida_total' && !rcv) {
    score += 20 - Math.min(nivel / 200, 25)
  }

  return score
}

/**
 * Top N planes adaptados al análisis IA, ordenados de mayor a menor preferencia.
 * El primero es el sugerido.
 *
 * @param {object[]} planesUi
 * @param {{ id?: string }|null} iaPlan
 * @param {{ limit?: number, piezas?: object }} [opts]
 * @returns {{ planes: object[], sugerido: object|null }}
 */
export function selectTopPlanesFromIa(planesUi = [], iaPlan = null, { limit = 4, piezas = {} } = {}) {
  if (!planesUi.length) return { planes: [], sugerido: null }

  const target = resolveTargetNivel(iaPlan, piezas)

  const ranked = [...planesUi]
    .map((plan) => ({
      plan,
      score: scorePlanForIa(plan, iaPlan, piezas),
      nivel: Number(plan.nivelPlan) || resolveNivelFromTexts(plan.subtitulo, plan.nombre, plan.id) || 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Empate: el más cercano al target (no orden alfabético → evitaba 1k$ ganador)
      const da = Math.abs((a.nivel || 0) - target)
      const db = Math.abs((b.nivel || 0) - target)
      if (da !== db) return da - db
      // Luego más cobertura si el auto está bien
      return (b.nivel || 0) - (a.nivel || 0)
    })
    .slice(0, Math.max(1, limit))
    .map((row) => row.plan)

  return {
    planes: ranked,
    sugerido: ranked[0] || null,
  }
}

/**
 * @deprecated Preferir `selectTopPlanesFromIa` — se mantiene por compatibilidad.
 */
export function pickSugeridoFromIa(planesUi, iaPlan, piezas = {}) {
  return selectTopPlanesFromIa(planesUi, iaPlan, { limit: 4, piezas }).sugerido
}
