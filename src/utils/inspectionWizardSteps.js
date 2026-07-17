/** Pasos del wizard de inspección (incluye Emisión post-pago). */
export const INSPECTION_WIZARD_STEPS = [
  { id: 'docs', label: 'Documentos' },
  { id: 'loc', label: 'Ubicación' },
  { id: 'photos', label: 'Fotografías' },
  { id: 'review', label: 'Revisión' },
  { id: 'result', label: 'Resultado' },
  { id: 'payment', label: 'Pago' },
  { id: 'emission', label: 'Emisión' },
]

export const RESULT_STEP = INSPECTION_WIZARD_STEPS.findIndex((s) => s.id === 'result')
export const PAYMENT_STEP = INSPECTION_WIZARD_STEPS.findIndex((s) => s.id === 'payment')
export const EMISSION_STEP = INSPECTION_WIZARD_STEPS.findIndex((s) => s.id === 'emission')
