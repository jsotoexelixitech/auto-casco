/**
 * Design tokens — La Mundial de Seguros / Auto Casco
 * Single source of truth for brand colors, plan tones, and UI timing.
 * Import from here instead of using inline hex values.
 */

// ── Brand palette ────────────────────────────────────────────────────────────
export const BRAND = {
  navy:    '#0F1A5A',   // Primary brand color
  deep:    '#091133',   // Darker navy (banners, overlays)
  mid:     '#162A7F',   // Mid blue (hover states)
  accent:  '#E84F51',   // Red accent
  white:   '#FFFFFF',
}

// ── Plan tone map ─────────────────────────────────────────────────────────────
// Used in planEngine, ConfiguracionIAPage, InspectionWizardPage, DashboardPage, etc.
export const PLAN_TONES = {
  success: { bg: '#DCFCE7', fg: '#16A34A', border: '#86EFAC' },
  warning: { bg: '#FEF3C7', fg: '#D97706', border: '#FCD34D' },
  error:   { bg: '#FEE2E2', fg: '#DC2626', border: '#FCA5A5' },
  neutral: { bg: '#F1F5F9', fg: '#64748B', border: '#CBD5E1' },
  info:    { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
}

/**
 * Tono gradual rojo → ámbar → verde según % de piezas buenas.
 * @param {number} pctBuenas 0–100
 * @param {{ elegible?: boolean }} [opts]
 */
export function getAnalisisGradientTone(pctBuenas, { elegible = true } = {}) {
  let pct = Math.max(0, Math.min(100, Number(pctBuenas) || 0))
  if (!elegible) pct = Math.min(pct, 35)

  const green  = { bg: [220, 252, 231], fg: [22, 163, 74],  border: [134, 239, 172] }
  const amber  = { bg: [254, 243, 199], fg: [217, 119, 6],  border: [252, 211, 77] }
  const red    = { bg: [254, 226, 226], fg: [220, 38, 38],  border: [252, 165, 165] }

  const lerpChan = (a, b, t) => Math.round(a + (b - a) * t)
  const lerpRgb = (a, b, t) => a.map((v, i) => lerpChan(v, b[i], t))
  const toHex = ([r, g, b]) =>
    `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
  const mix = (from, to, t) => ({
    bg: toHex(lerpRgb(from.bg, to.bg, t)),
    fg: toHex(lerpRgb(from.fg, to.fg, t)),
    border: toHex(lerpRgb(from.border, to.border, t)),
  })

  const t = pct / 100
  const tone = t >= 0.5
    ? mix(amber, green, (t - 0.5) / 0.5)
    : mix(red, amber, t / 0.5)

  return {
    ...tone,
    pct,
    icon: pct >= 72 ? 'task_alt' : pct >= 40 ? 'warning' : 'gpp_bad',
  }
}

// ── Piece state colors ────────────────────────────────────────────────────────
// B = Buena, R = Regular, M = Mala, NE = No Existe
export const PIEZA_TONES = {
  B:  { bg: '#DCFCE7', fg: '#16A34A' },
  R:  { bg: '#FEF3C7', fg: '#D97706' },
  M:  { bg: '#FEE2E2', fg: '#DC2626' },
  NE: { bg: '#F1F5F9', fg: '#64748B' },
}

// ── UI timing (ms) ───────────────────────────────────────────────────────────
export const TIMING = {
  toastShort:  1500,
  toastMedium: 3000,
  toastLong:   4000,
  splashDelay: 2500,
  retryDelay:  3000,
}

// ── Car diagram zone colors ───────────────────────────────────────────────────
export const DIAGRAM_STATUS_FILL = {
  active:  BRAND.navy,   // capturando
  next:    '#86A0E8',    // siguiente (azul suave)
  ok:      '#16a34a',    // cargada sin daños
  damaged: '#D97706',    // cargada con daños
  pending: '#e2e8f0',
  hidden:  'transparent',
}

export const DIAGRAM_STATUS_STROKE = {
  active:  BRAND.mid,
  next:    '#4A6FCF',
  ok:      '#15803d',
  damaged: '#B45309',
  pending: '#cbd5e1',
  hidden:  'none',
}
