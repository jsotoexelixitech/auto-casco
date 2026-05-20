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
  active:  '#16a34a',
  next:    '#86efac',
  done:    BRAND.navy,
  pending: '#e2e8f0',
  hidden:  'transparent',
}

export const DIAGRAM_STATUS_STROKE = {
  active:  '#15803d',
  next:    '#4ade80',
  done:    BRAND.mid,
  pending: '#cbd5e1',
  hidden:  'none',
}
