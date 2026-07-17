import {
  validateDocumentoVe,
  validatePersonName,
  validateRazonSocial,
  validateEmail,
  validatePhoneVe,
  validateBirthDateMinAge,
  validateVehicleAscii,
  validateVehicleModelo,
  validateVehicleAnio,
} from '../../utils/fieldValidators'

export function inferTipoPersona(docs, role = 'titular') {
  // El tomador siempre es persona natural
  if (role === 'tomador') return 'natural'
  if (docs.tipoTitular === 'juridica' || docs.tipoTitular === 'natural') {
    return docs.tipoTitular
  }
  if (docs.rif || docs.naturaleza === 'juridica') return 'juridica'
  return 'natural'
}

function pushIfInvalid(errors, result, fallbackMessage) {
  if (!result.valid) errors.push(result.message || fallbackMessage)
}

function validatePersonaFields(persona, tipo, labelPrefix, errors) {
  const prefix = labelPrefix ? `${labelPrefix}: ` : ''

  if (tipo === 'natural') {
    pushIfInvalid(errors, validateDocumentoVe(persona.documento, 'cedula'), `${prefix}Documento de identidad inválido`)
    pushIfInvalid(errors, validatePersonName(persona.nombres, 'Nombres'), `${prefix}Nombres inválidos`)
    pushIfInvalid(errors, validatePersonName(persona.apellidos, 'Apellidos'), `${prefix}Apellidos inválidos`)
    pushIfInvalid(errors, validateBirthDateMinAge(persona.fechaNacimiento), `${prefix}Fecha de nacimiento inválida`)
  } else {
    pushIfInvalid(errors, validateDocumentoVe(persona.documento, 'rif'), `${prefix}RIF inválido`)
    pushIfInvalid(errors, validateRazonSocial(persona.razonSocial, 'Razón social'), `${prefix}Razón social inválida`)
  }

  pushIfInvalid(errors, validateEmail(persona.email), `${prefix}Correo electrónico inválido`)
  pushIfInvalid(errors, validatePhoneVe(persona.telefono), `${prefix}Teléfono móvil inválido`)
}

/** Datos del titular (bloque 1). */
export function validateTitularSection({ docs, titular }, tipoPersona) {
  const tipo = tipoPersona ?? inferTipoPersona(docs, 'titular')
  const errors = []
  const persona = titular

  if (tipo === 'natural') {
    if (!docs.cedula) errors.push('Carga la Cédula de Identidad del titular')
  } else if (!docs.rif) {
    errors.push('Carga el RIF del titular')
  }

  validatePersonaFields(persona, tipo, 'Titular', errors)
  return { valid: errors.length === 0, errors }
}

/** Datos del tomador (bloque 2). El tomador siempre es persona natural.
 *  "Mismo titular" solo aplica si el titular también es natural.
 */
export function validateTomadorSection(state) {
  const { docs, titular, tomador, tomadorEsTitular } = state
  const errors = []
  const tipoTitular = inferTipoPersona(docs, 'titular')

  // Titular jurídico: siempre se exige tomador natural aparte
  const sameAsTitular = tomadorEsTitular && tipoTitular === 'natural'

  if (sameAsTitular) {
    const titularCheck = validateTitularSection({ docs, titular }, 'natural')
    if (!titularCheck.valid) {
      return {
        valid: false,
        errors: ['Completa primero los datos del titular'],
      }
    }
    return { valid: true, errors: [] }
  }

  if (tomadorEsTitular && tipoTitular === 'juridica') {
    errors.push('Si el titular es persona jurídica, debe cargar los datos del tomador (persona natural)')
  }

  if (!docs.cedulaTomador) errors.push('Carga la Cédula de Identidad del tomador')
  validatePersonaFields(tomador || titular, 'natural', 'Tomador', errors)
  return { valid: errors.length === 0, errors }
}

/** @deprecated Preferir validateTitularSection — compat con llamadas antiguas */
export function validateIdentitySection(state, tipoPersona) {
  const titular = state.titular ?? state.tomador
  return validateTitularSection({ docs: state.docs, titular }, tipoPersona)
}

export function validateVehicleSection({ docs, vehiculo }) {
  const errors = []
  const is0km = vehiculo?.is0km || false

  if (is0km) {
    if (!docs.certificadoOrigen) {
      errors.push('Carga el Certificado de Origen')
    }
    return { valid: errors.length === 0, errors }
  }

  if (!docs.carnet) {
    errors.push('Carga el Carnet de Circulación')
    return { valid: false, errors }
  }

  const fieldErrors = []
  pushIfInvalid(fieldErrors, validateVehicleAscii(vehiculo?.marca, 'Marca'), 'Marca inválida')
  pushIfInvalid(fieldErrors, validateVehicleModelo(vehiculo?.modelo, 'Modelo'), 'Modelo inválido')
  pushIfInvalid(fieldErrors, validateVehicleAscii(vehiculo?.color, 'Color'), 'Color inválido')
  pushIfInvalid(fieldErrors, validateVehicleAnio(vehiculo?.anio, 'Año'), 'Año inválido')
  pushIfInvalid(fieldErrors, validateVehicleAscii(vehiculo?.placa, 'Placa'), 'Placa inválida')
  pushIfInvalid(fieldErrors, validateVehicleAscii(vehiculo?.serial, 'Serial'), 'Serial inválido')

  if (fieldErrors.length > 0) {
    errors.push('Revisa y completa los datos del vehículo')
  }

  return { valid: errors.length === 0, errors }
}

/** Texto de error para bloqueo / toast de emisión inválida. */
export function formatEmissionError({ message, reason } = {}) {
  const summary = message?.trim() || 'Vehículo no válido para emisión.'
  const detail = reason?.trim()
  if (detail && detail !== summary) return `${summary} ${detail}`
  return summary
}

/** Valida placa + serial contra emisión (solo vehículos usados). */
export function validateEmissionSection({ vehiculo, emissionValidation }) {
  const is0km = vehiculo?.is0km || false
  if (is0km) return { valid: true, errors: [] }

  const placa = vehiculo?.placa?.trim()
  const serial = vehiculo?.serial?.trim()
  if (!placa || !serial) return { valid: true, errors: [] }

  const { status, message } = emissionValidation ?? {}

  if (status === 'valid') return { valid: true, errors: [] }
  if (status === 'loading') {
    return { valid: false, errors: ['Espera la validación del vehículo para emisión'] }
  }
  if (status === 'invalid') {
    return { valid: false, errors: [formatEmissionError(emissionValidation)] }
  }
  if (status === 'error') {
    return { valid: false, errors: [message || 'No se pudo validar el vehículo para emisión'] }
  }

  return { valid: false, errors: ['Validando vehículo para emisión…'] }
}

export function getStep1SectionStatus(state, tipoPersona, uploadWarnings = {}) {
  const tipoTitular = tipoPersona ?? inferTipoPersona(state.docs, 'titular')
  const titular = state.titular ?? state.tomador
  const identity = validateTitularSection({ docs: state.docs, titular }, tipoTitular)
  const tomador = validateTomadorSection(state)
  const vehicle = validateVehicleSection(state)
  const emission = validateEmissionSection(state)

  const identityBlocked =
    (tipoTitular === 'natural' && uploadWarnings.cedula) ||
    (tipoTitular === 'juridica' && uploadWarnings.rif)

  const identityComplete = identity.valid && !identityBlocked

  const sameAsTitular = state.tomadorEsTitular && tipoTitular === 'natural'

  const tomadorBlocked = sameAsTitular
    ? identityBlocked
    : !!uploadWarnings.cedulaTomador

  const tomadorComplete = sameAsTitular
    ? identityComplete
    : tomador.valid && !tomadorBlocked

  const vehicleBlocked =
    state.vehiculo?.is0km ? uploadWarnings.origen : uploadWarnings.certificado

  const vehicleComplete = vehicle.valid && emission.valid && !vehicleBlocked

  return {
    identityComplete,
    tomadorComplete,
    vehicleComplete,
    stepComplete: identityComplete && tomadorComplete && vehicleComplete,
  }
}

export function validateStep1(state, tipoPersona, uploadWarnings = {}) {
  const tipoTitular = tipoPersona ?? inferTipoPersona(state.docs, 'titular')
  const titular = state.titular ?? state.tomador
  const identity = validateTitularSection({ docs: state.docs, titular }, tipoTitular)
  const tomador = validateTomadorSection(state)
  const vehicle = validateVehicleSection(state)
  const emission = validateEmissionSection(state)
  const status = getStep1SectionStatus(state, tipoTitular, uploadWarnings)

  const errors = [...identity.errors, ...tomador.errors, ...vehicle.errors, ...emission.errors]

  if (uploadWarnings.cedula) errors.unshift(uploadWarnings.cedula)
  if (uploadWarnings.rif) errors.unshift(uploadWarnings.rif)
  if (uploadWarnings.cedulaTomador) errors.unshift(uploadWarnings.cedulaTomador)
  if (uploadWarnings.rifTomador) errors.unshift(uploadWarnings.rifTomador)
  if (uploadWarnings.certificado) errors.unshift(uploadWarnings.certificado)
  if (uploadWarnings.origen) errors.unshift(uploadWarnings.origen)

  return {
    valid: status.stepComplete,
    errors: [...new Set(errors)],
    identityComplete: status.identityComplete,
    tomadorComplete: status.tomadorComplete,
    vehicleComplete: status.vehicleComplete,
  }
}
