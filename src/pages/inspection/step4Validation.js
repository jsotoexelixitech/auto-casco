import { validateDamageText } from '../../utils/fieldValidators'

export function validateStep4Fields({ descripcionDanios, observacionesRiesgo }) {
  const errors = {}

  if (!descripcionDanios?.trim()) {
    errors.descripcionDanios = 'La descripción de los daños es obligatoria.'
  } else {
    const desc = validateDamageText(descripcionDanios, {
      label: 'La descripción de los daños',
    })
    if (!desc.valid) errors.descripcionDanios = desc.message
  }

  if (observacionesRiesgo?.trim()) {
    const obs = validateDamageText(observacionesRiesgo, {
      label: 'Las observaciones adicionales',
    })
    if (!obs.valid) errors.observacionesRiesgo = obs.message
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateDamageDraft(draft) {
  const errors = {}

  if (draft.tipo === 'otro') {
    if (!draft.tipoOtro?.trim()) {
      errors.tipoOtro = 'Indica el tipo de daño.'
    } else {
      const tipo = validateDamageText(draft.tipoOtro, { label: 'El tipo de daño' })
      if (!tipo.valid) errors.tipoOtro = tipo.message
    }
  }

  if (!draft.ubicacion?.trim()) {
    errors.ubicacion = 'Indica la ubicación del daño en el vehículo.'
  } else {
    const ubicacion = validateDamageText(draft.ubicacion, { label: 'La ubicación' })
    if (!ubicacion.valid) errors.ubicacion = ubicacion.message
  }

  if (draft.descripcion?.trim()) {
    const descripcion = validateDamageText(draft.descripcion, { label: 'La descripción' })
    if (!descripcion.valid) errors.descripcion = descripcion.message
  }

  return errors
}
