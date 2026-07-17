/**
 * Prima Valrep: `mprimaext` es anual.
 * Otras frecuencias se calculan dividiendo ese monto.
 */

const PERIODS_BY_CODE = {
  A: 1,
  AN: 1,
  ANUAL: 1,
  S: 2,
  SE: 2,
  SEM: 2,
  SEMESTRAL: 2,
  T: 4,
  TR: 4,
  TRI: 4,
  TRIM: 4,
  TRIMESTRAL: 4,
  C: 3,
  CUA: 3,
  CUATRIMESTRAL: 3,
  M: 12,
  MEN: 12,
  MENSUAL: 12,
  Q: 24,
  QUI: 24,
  QUINCENAL: 24,
  D: 365,
  DIA: 365,
  DIARIA: 365,
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

/** Periodos de cobro en un año para una frecuencia Valrep. */
export function periodsPerYear(freq) {
  const code = String(freq?.cvalor ?? freq ?? '')
    .trim()
    .toUpperCase()
  if (PERIODS_BY_CODE[code]) return PERIODS_BY_CODE[code]

  const desc = String(freq?.xdescripcion ?? '').toUpperCase()
  if (desc.includes('ANUAL')) return 1
  if (desc.includes('SEMESTR')) return 2
  if (desc.includes('CUATRIM')) return 3
  if (desc.includes('TRIM')) return 4
  if (desc.includes('MENSUAL')) return 12
  if (desc.includes('QUINCEN')) return 24
  if (desc.includes('DIAR')) return 365
  return 1
}

export function isFrecuenciaAnual(freq) {
  return periodsPerYear(freq) === 1
}

/** Prefiere frecuencia anual; si no existe, la primera de la lista. */
export function pickDefaultFrecuencia(freqs = []) {
  if (!Array.isArray(freqs) || freqs.length === 0) return null
  const byCode = freqs.find((f) => {
    const c = String(f.cvalor ?? '').trim().toUpperCase()
    return c === 'A' || c === 'AN' || c === 'ANUAL'
  })
  if (byCode) return byCode
  const byDesc = freqs.find((f) => /anual/i.test(String(f.xdescripcion ?? '')))
  return byDesc || freqs[0]
}

/** Cuota por periodo a partir de la prima anual. */
export function cuotaFromPrimaAnual(primaAnual, freq) {
  const anual = Number(primaAnual)
  if (!Number.isFinite(anual)) return 0
  const n = Math.max(1, periodsPerYear(freq))
  return round2(anual / n)
}
